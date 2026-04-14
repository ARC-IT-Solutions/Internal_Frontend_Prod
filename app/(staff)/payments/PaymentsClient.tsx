'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Invoice, Payment, User } from '@/types';
import { Badge, Button, Input, Select, Textarea, Alert, Modal, EmptyState } from '@/components/ui';
import { PageShell, ListHeader, EmptyDetail, DetailHeader, DetailBody, Section } from '@/components/modules/PageShell';
import { money, shortDate } from '@/lib/utils';
import { recordPaymentAction, deletePaymentAction } from '@/app/actions';

type Rich = Invoice & { payments: Payment[] };
const PAY_METHODS = ['bank_transfer','card','upi','cash','other'] as const;

export function PaymentsClient({ invoices, currentUser, total }: { invoices: Rich[]; currentUser: User; total: number }) {
  const router = useRouter();
  const [sel, setSel]        = useState<Rich|null>(invoices[0]??null);
  const [isPend, startTrans] = useTransition();
  const [err, setErr]        = useState('');
  const [ok,  setOk]         = useState('');
  const [showRec, setShowRec]= useState(false);
  const [pf, setPf] = useState({ amount:'', payment_date:new Date().toISOString().split('T')[0], payment_method:'bank_transfer', reference:'', notes:'' });
  const isEmp = currentUser.role !== 'client';
  const notify = (m:string,t:'ok'|'err') => { t==='ok'?(setOk(m),setErr('')):(setErr(m),setOk('')); setTimeout(()=>{setOk('');setErr('');},5000); };

  const totalPaid = sel?.payments.reduce((s,p)=>s+p.amount,0)??0;
  const pct = sel ? Math.min(100,Math.round((totalPaid/sel.total_amount)*100)) : 0;
  const outstanding = sel ? Math.max(0,sel.total_amount-totalPaid) : 0;
  const totalBilled = invoices.reduce((s,i)=>s+i.total_amount,0);
  const totalCollected = invoices.reduce((s,i)=>s+i.payments.reduce((ps,p)=>ps+p.amount,0),0);

  async function doRecord() {
    if (!sel||!pf.amount||!pf.payment_date) return setErr('Amount and date required.');
    startTrans(async () => { const r = await recordPaymentAction({ invoice_id:sel.id, amount:parseFloat(pf.amount), payment_date:pf.payment_date, payment_method:pf.payment_method as never, reference:pf.reference||undefined, notes:pf.notes||undefined }); if(r.ok){notify('Recorded.','ok');setShowRec(false);router.refresh();}else notify(r.error,'err'); });
  }
  async function delPay(p: Payment) {
    if (!confirm('Delete payment?')) return;
    startTrans(async () => { const r = await deletePaymentAction(p.id); if(r.ok){notify('Deleted.','ok');router.refresh();}else notify(r.error,'err'); });
  }

  return (
    <>
      <PageShell
        list={
          <>
            <ListHeader title="Payments" count={total}/>
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'rgba(255,255,255,0.05)', flexShrink:0 }}>
              {[['Billed',money(totalBilled),'var(--s-text)'],['Collected',money(totalCollected),'#3fb950'],['Remaining',money(totalBilled-totalCollected),totalBilled-totalCollected>0?'#f85149':'var(--s-dim)']].map(([l,v,c])=>(
                <div key={l as string} style={{ padding:'10px 12px', background:'var(--s-surface)' }}>
                  <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--s-dim)', marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:12, fontWeight:700, fontFamily:'var(--font-mono)', color:c as string }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,.06) transparent' }}>
              {invoices.length===0&&<EmptyState title="No billing invoices"/>}
              {invoices.map((inv,i) => {
                const paid = inv.payments.reduce((s,p)=>s+p.amount,0);
                const p = Math.min(100,Math.round((paid/inv.total_amount)*100));
                const active = sel?.id===inv.id;
                return (
                  <motion.button key={inv.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*0.02}}
                    onClick={()=>setSel(inv)} style={{ width:'100%', textAlign:'left', display:'flex', border:'none', borderBottom:'1px solid rgba(255,255,255,0.04)', background:active?'rgba(255,255,255,0.04)':'transparent', cursor:'pointer', padding:0 }}>
                    <div style={{ width:3, flexShrink:0, background:active?(inv.status==='PAID'?'#3fb950':inv.status==='OVERDUE'?'#f85149':'#F0883E'):'transparent', transition:'background 0.2s' }}/>
                    <div style={{ flex:1, padding:'10px 14px', minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                        <span style={{ fontSize:10, color:'var(--s-dim)', fontFamily:'var(--font-mono)' }}>{inv.invoice_number}</span>
                        <Badge status={inv.status}/>
                      </div>
                      <div style={{ fontSize:13, fontWeight:active?500:400, color:active?'var(--s-text)':'var(--s-sub)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:6 }}>{inv.title}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'#3fb950' }}>{money(paid)}</span>
                        <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--s-dim)' }}>/ {money(inv.total_amount)}</span>
                      </div>
                      <div style={{ height:2, borderRadius:2, overflow:'hidden', background:'rgba(255,255,255,0.06)' }}>
                        <div style={{ height:'100%', borderRadius:2, width:`${p}%`, background:p===100?'#3fb950':'#F0883E' }}/>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </>
        }
        detail={
          !sel ? <EmptyDetail text="Select an invoice to manage payments"/> : (
            <>
              <DetailHeader
                title={sel.title} sub={`${sel.invoice_number} · Due ${shortDate(sel.due_date)}`}
                badges={<Badge status={sel.status}/>}
                actions={isEmp&&!['PAID','CANCELLED'].includes(sel.status)?<Button variant="success" size="sm" onClick={()=>setShowRec(true)}>+ Record Payment</Button>:undefined}
              />
              <DetailBody>
                {(err||ok)&&<Alert type={err?'error':'success'} message={err||ok}/>}
                <Section label="Progress">
                  <div style={{ padding:'18px 20px', borderRadius:12, background:'var(--s-raised)', border:'1px solid var(--s-border)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                      <div><div style={{ fontSize:10, color:'var(--s-dim)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Collected</div><div style={{ fontSize:24, fontWeight:700, color:'#3fb950', fontFamily:'var(--font-mono)' }}>{money(totalPaid,sel.currency)}</div></div>
                      <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:'var(--s-dim)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>{outstanding>0?'Outstanding':'Total'}</div><div style={{ fontSize:24, fontWeight:700, fontFamily:'var(--font-mono)', color:outstanding>0?'#f85149':'var(--s-sub)' }}>{outstanding>0?money(outstanding,sel.currency):money(sel.total_amount,sel.currency)}</div></div>
                    </div>
                    <div style={{ height:10, borderRadius:5, overflow:'hidden', background:'rgba(255,255,255,0.06)' }}>
                      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.6,ease:[0.22,1,0.36,1]}} style={{ height:'100%', borderRadius:5, background:pct===100?'#3fb950':'linear-gradient(90deg,#F0883E,#f0c03e)' }}/>
                    </div>
                    <div style={{ fontSize:10, color:'var(--s-dim)', marginTop:6, fontFamily:'var(--font-mono)' }}>{pct}% · {sel.payments.length} payment{sel.payments.length!==1?'s':''}</div>
                  </div>
                </Section>
                <Section label={`Payment History (${sel.payments.length})`}>
                  {sel.payments.length===0?<p style={{ fontSize:12, color:'var(--s-dim)', fontStyle:'italic' }}>No payments yet.</p>
                  :<div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {sel.payments.map(p=>(
                      <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:8, background:'var(--s-raised)', border:'1px solid var(--s-border)' }}>
                        <div><div style={{ fontSize:13, fontWeight:600, fontFamily:'var(--font-mono)', color:'var(--s-text)' }}>{money(p.amount,sel.currency)}</div><div style={{ fontSize:10, color:'var(--s-dim)', fontFamily:'var(--font-mono)', marginTop:2 }}>{shortDate(p.payment_date)}{p.payment_method?` · ${p.payment_method.replace('_',' ')}`:''}{p.reference?` · ${p.reference}`:''}</div></div>
                        {isEmp&&<Button variant="danger" size="sm" onClick={()=>delPay(p)} disabled={isPend}>×</Button>}
                      </div>
                    ))}
                  </div>}
                </Section>
              </DetailBody>
            </>
          )
        }
      />
      {showRec&&sel&&(
        <Modal title={`Record Payment — ${sel.invoice_number}`} onClose={()=>setShowRec(false)}>
          {err&&<Alert type="error" message={err}/>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Input label="Amount *" type="number" step="0.01" value={pf.amount} onChange={e=>setPf({...pf,amount:e.target.value})} placeholder={String(outstanding)}/>
            <Input label="Date *" type="date" value={pf.payment_date} onChange={e=>setPf({...pf,payment_date:e.target.value})}/>
            <Select label="Method" value={pf.payment_method} onChange={e=>setPf({...pf,payment_method:e.target.value})} style={{ width:'100%' }}>{PAY_METHODS.map(m=><option key={m} value={m}>{m.replace('_',' ')}</option>)}</Select>
            <Input label="Reference" value={pf.reference} onChange={e=>setPf({...pf,reference:e.target.value})}/>
            <Textarea label="Notes" rows={2} value={pf.notes} onChange={e=>setPf({...pf,notes:e.target.value})}/>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}><Button variant="success" onClick={doRecord} loading={isPend} style={{ flex:1, justifyContent:'center' }}>Record Payment</Button><Button variant="ghost" onClick={()=>setShowRec(false)}>Cancel</Button></div>
        </Modal>
      )}
    </>
  );
}
