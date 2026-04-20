'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Invoice, Payment, User, Paginated } from '@/types';
import { Badge, Button, Input, Select, Textarea, Alert, Modal, EmptyState } from '@/components/ui';
import { PageShell, ListHeader, EmptyDetail, DetailHeader, DetailBody, Section } from '@/components/modules/PageShell';
import { money, shortDate, fullDate, relTime } from '@/lib/utils';
import { deleteInvoiceAction, getInvoiceDownloadAction, recordPaymentAction, deletePaymentAction } from '@/app/actions';

const SB: Record<string,string> = { DRAFT:'#484F58', SENT:'#388bfd', PARTIALLY_PAID:'#F0883E', PAID:'#3fb950', OVERDUE:'#f85149', CANCELLED:'#484F58' };
const PAY_METHODS = ['bank_transfer','card','upi','cash','other'] as const;

export function InvoicesClient({ invoices, initialPayments, initialFocusId, currentUser }: {
  invoices: Paginated<Invoice>; initialPayments: Payment[]; initialFocusId: string|null; currentUser: User;
}) {
  const router = useRouter();
  const [sel, setSel]         = useState<Invoice|null>(initialFocusId?(invoices.items.find(i=>i.id===initialFocusId)??null):null);
  const [pays, setPays]       = useState<Payment[]>(initialPayments);
  const [loadingP, setLoadingP]= useState(false);
  const [isPend, startTrans]  = useTransition();
  const [err, setErr]         = useState('');
  const [ok,  setOk]          = useState('');
  const [showRec, setShowRec] = useState(false);
  const [sf, setSf]           = useState('');
  const [pf, setPf] = useState({ amount:'', payment_date:new Date().toISOString().split('T')[0], payment_method:'bank_transfer', reference:'', notes:'' });
  const isEmp = currentUser.role !== 'client';
  const isAdmin = currentUser.role === 'admin';
  const notify = (m:string,t:'ok'|'err') => { t==='ok'?(setOk(m),setErr('')):(setErr(m),setOk('')); setTimeout(()=>{setOk('');setErr('');},5000); };

  async function loadPays(id: string) {
    setLoadingP(true);
    const r = await fetch(`/api/proxy?path=payments/invoice/${id}`);
    const d = await r.json().catch(()=>[]);
    setPays(Array.isArray(d)?d:[]);
    setLoadingP(false);
  }
  async function pick(inv: Invoice) { setSel(inv); loadPays(inv.id); }
  async function doRecord() {
    if (!sel||!pf.amount||!pf.payment_date) return setErr('Amount and date required.');
    startTrans(async () => { const r = await recordPaymentAction({ invoice_id:sel.id, amount:parseFloat(pf.amount), payment_date:pf.payment_date, payment_method:pf.payment_method as never, reference:pf.reference||undefined, notes:pf.notes||undefined }); if(r.ok){notify('Recorded.','ok');setShowRec(false);router.refresh();loadPays(sel.id);}else notify(r.error,'err'); });
  }
  async function delPay(p: Payment) {
    if (!confirm('Delete?')) return;
    startTrans(async () => { const r = await deletePaymentAction(p.id); if(r.ok){notify('Deleted.','ok');if(sel)loadPays(sel.id);}else notify(r.error,'err'); });
  }
  async function download() {
    if (!sel) return;
    const r = await getInvoiceDownloadAction(sel.id);
    if (r.ok) window.open((r.data as {signed_url:string}).signed_url,'_blank'); else notify((r as {error:string}).error,'err');
  }

  const totalPaid = pays.reduce((s,p)=>s+p.amount,0);
  const pct = sel ? Math.min(100,Math.round((totalPaid/sel.total_amount)*100)) : 0;
  const outstanding = sel ? Math.max(0,sel.total_amount-totalPaid) : 0;

  return (
    <>
      <PageShell
        hasDetail={!!sel}
        detailTitle="invoices list"
        list={
          <>
            <ListHeader title="Invoices" count={invoices.total}
              filters={<Select value={sf} onChange={e=>setSf(e.target.value)} style={{ width:'auto', height:28, padding:'0 8px', fontSize:11 }}>
                <option value="">All Status</option>
                {['DRAFT','SENT','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </Select>}
            />
            <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,.06) transparent' }}>
              {invoices.items.filter(i=>!sf||i.status===sf).length===0&&<EmptyState title="No invoices"/>}
              {invoices.items.filter(i=>!sf||i.status===sf).map((inv,i) => {
                const active = sel?.id===inv.id;
                return (
                  <motion.button key={inv.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*0.02}}
                    onClick={()=>pick(inv)} style={{ width:'100%', textAlign:'left', display:'flex', border:'none', borderBottom:'1px solid rgba(255,255,255,0.04)', background:active?'rgba(255,255,255,0.04)':'transparent', cursor:'pointer', padding:0 }}>
                    <div style={{ width:3, flexShrink:0, background:active?SB[inv.status]:'transparent', transition:'background 0.2s' }}/>
                    <div style={{ flex:1, padding:'11px 14px', minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:3 }}>
                        <span style={{ fontSize:10, color:'var(--s-dim)', fontFamily:'var(--font-mono)' }}>{inv.invoice_number}</span>
                        <Badge status={inv.status}/>
                      </div>
                      <div style={{ fontSize:13, fontWeight:active?500:400, color:active?'var(--s-text)':'var(--s-sub)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>{inv.title}</div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:12, fontFamily:'var(--font-mono)', color:inv.status==='OVERDUE'?'#f85149':'var(--s-text)', fontWeight:500 }}>{money(inv.total_amount,inv.currency)}</span>
                        <span style={{ fontSize:10, color:'var(--s-dim)', fontFamily:'var(--font-mono)' }}>Due {shortDate(inv.due_date)}</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </>
        }
        detail={
          !sel ? <EmptyDetail text="Select an invoice"/> : (
            <>
              <DetailHeader
                title={sel.title} sub={`${sel.invoice_number} · Client ${sel.client_id.slice(0,12)}…`}
                badges={<Badge status={sel.status}/>}
                actions={
                  <>
                    <Button variant="secondary" size="sm" onClick={download}>↓ PDF</Button>
                    {isEmp&&!['PAID','CANCELLED'].includes(sel.status)&&<Button variant="success" size="sm" onClick={()=>setShowRec(true)}>Record Payment</Button>}
                    {isAdmin&&<Button variant="danger" size="sm" onClick={async()=>{ if(!confirm('Delete?'))return; const r=await deleteInvoiceAction(sel.id); if(r.ok){setSel(null);router.refresh();}else notify((r as {error:string}).error,'err'); }}>Delete</Button>}
                  </>
                }
              />
              <DetailBody>
                {(err||ok)&&<Alert type={err?'error':'success'} message={err||ok}/>}
                {['SENT','PARTIALLY_PAID','OVERDUE'].includes(sel.status)&&(
                  <Section label="Payment Progress">
                    <div style={{ padding:'16px 18px', borderRadius:12, background:'var(--s-raised)', border:'1px solid var(--s-border)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                        <div><div style={{ fontSize:10, color:'var(--s-dim)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Collected</div><div style={{ fontSize:22, fontWeight:700, color:'#3fb950', fontFamily:'var(--font-mono)' }}>{money(totalPaid,sel.currency)}</div></div>
                        <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:'var(--s-dim)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Outstanding</div><div style={{ fontSize:22, fontWeight:700, fontFamily:'var(--font-mono)', color:outstanding>0?'#f85149':'var(--s-sub)' }}>{money(outstanding,sel.currency)}</div></div>
                      </div>
                      <div style={{ height:8, borderRadius:4, overflow:'hidden', background:'rgba(255,255,255,0.06)' }}>
                        <div style={{ height:'100%', borderRadius:4, transition:'width 0.5s', width:`${pct}%`, background:pct===100?'#3fb950':'linear-gradient(90deg,#F0883E,#f0c03e)' }}/>
                      </div>
                      <div style={{ fontSize:10, color:'var(--s-dim)', marginTop:4, fontFamily:'var(--font-mono)' }}>{pct}% · {pays.length} payment{pays.length!==1?'s':''}</div>
                    </div>
                  </Section>
                )}
                <Section label="Invoice Details">
                  <table style={{ width:'100%', borderCollapse:'collapse' }}><tbody>
                    {[['Amount',money(sel.amount,sel.currency)],[`Tax (${sel.tax_rate}%)`,money(sel.tax_amount,sel.currency)],['Total',money(sel.total_amount,sel.currency)],['Due',shortDate(sel.due_date)],['Issued',fullDate(sel.created_at)]].map(([l,v])=>(
                      <tr key={l} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding:'7px 12px 7px 0', fontSize:11, color:'var(--s-dim)', width:80 }}>{l}</td>
                        <td style={{ padding:'7px 0', fontSize:12, color:'var(--s-text)', fontFamily:'var(--font-mono)' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody></table>
                </Section>
                <Section label={`Payments (${pays.length})`}>
                  {loadingP&&<p style={{ fontSize:12, color:'var(--s-dim)' }}>Loading…</p>}
                  {!loadingP&&pays.length===0&&<p style={{ fontSize:12, color:'var(--s-dim)', fontStyle:'italic' }}>No payments recorded.</p>}
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {pays.map(p=>(
                      <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:8, background:'var(--s-raised)', border:'1px solid var(--s-border)' }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, fontFamily:'var(--font-mono)', color:'var(--s-text)' }}>{money(p.amount,sel.currency)}</div>
                          <div style={{ fontSize:10, color:'var(--s-dim)', fontFamily:'var(--font-mono)', marginTop:2 }}>{shortDate(p.payment_date)}{p.payment_method?` · ${p.payment_method.replace('_',' ')}`:''}{p.reference?` · ${p.reference}`:''}</div>
                        </div>
                        {isEmp&&<Button variant="danger" size="sm" onClick={()=>delPay(p)} disabled={isPend}>×</Button>}
                      </div>
                    ))}
                  </div>
                </Section>
              </DetailBody>
            </>
          )
        }
      />
      {showRec&&sel&&(
        <Modal title={`Record Payment — ${sel.invoice_number}`} onClose={()=>setShowRec(false)}>
          <div style={{ padding:'10px 14px', borderRadius:8, background:'var(--s-raised)', border:'1px solid var(--s-border)', marginBottom:14, fontSize:12, color:'var(--s-sub)' }}>
            Outstanding: <strong style={{ color:'var(--s-text)', fontFamily:'var(--font-mono)' }}>{money(outstanding,sel.currency)}</strong>
          </div>
          {err&&<Alert type="error" message={err}/>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Input label="Amount *" type="number" step="0.01" value={pf.amount} onChange={e=>setPf({...pf,amount:e.target.value})} placeholder={String(outstanding)}/>
            <Input label="Payment Date *" type="date" value={pf.payment_date} onChange={e=>setPf({...pf,payment_date:e.target.value})}/>
            <Select label="Method" value={pf.payment_method} onChange={e=>setPf({...pf,payment_method:e.target.value})} style={{ width:'100%' }}>{PAY_METHODS.map(m=><option key={m} value={m}>{m.replace('_',' ')}</option>)}</Select>
            <Input label="Reference / TXN ID" value={pf.reference} onChange={e=>setPf({...pf,reference:e.target.value})}/>
            <Textarea label="Notes" rows={2} value={pf.notes} onChange={e=>setPf({...pf,notes:e.target.value})}/>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <Button variant="success" onClick={doRecord} loading={isPend} style={{ flex:1, justifyContent:'center' }}>Record Payment</Button>
            <Button variant="ghost" onClick={()=>setShowRec(false)}>Cancel</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
