'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Invoice, Payment } from '@/types';
import { ArcBadge, ArcButton, ArcCard, ArcPageHeader, ArcAlert, ArcEmpty } from '@/components/ui/ArcUI';
import { money, shortDate, fullDate } from '@/lib/utils';
import { getInvoiceDownloadAction } from '@/app/actions';

type Rich = Invoice & { payments: Payment[] };

const LEFT: Record<string,string> = { OVERDUE:'#C05050', PARTIALLY_PAID:'#C9A84C', SENT:'#4A7EC0', DRAFT:'var(--c-muted)', PAID:'#4CAF7D', CANCELLED:'var(--c-muted)' };
const SORT = ['OVERDUE','PARTIALLY_PAID','SENT','DRAFT','PAID','CANCELLED'];

export function ClientInvoicesView({ invoices }: { invoices: Rich[] }) {
  const [mobileTab, setMobileTab] = useState<'list'|'detail'>('list');

  const sorted = [...invoices].sort((a,b) => SORT.indexOf(a.status)-SORT.indexOf(b.status));
  const [sel, setSel]             = useState<Rich|null>(null);
  const [downloading, setDownloading] = useState(false);
  const [err, setErr]             = useState('');

  async function download() {
    if (!sel) return;
    setDownloading(true); setErr('');
    const r = await getInvoiceDownloadAction(sel.id);
    setDownloading(false);
    if (r.ok) window.open((r.data as {signed_url:string}).signed_url,'_blank'); else setErr((r as {error:string}).error);
  }

  const totalPaid   = sel?.payments.reduce((s,p)=>s+p.amount,0)??0;
  const pct         = sel ? Math.min(100,Math.round((totalPaid/sel.total_amount)*100)) : 0;
  const outstanding = sel ? Math.max(0,sel.total_amount-totalPaid) : 0;
  const showProgress = ['SENT','PARTIALLY_PAID','OVERDUE'].includes(sel?.status??'');

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <ArcPageHeader eyebrow="ARC IT Solutions" title="Invoices" italic="& Billing" sub="Your complete billing history and payment records." />

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* ── Desktop: side-by-side ── */}
        <div className="hide-mobile" style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <div style={{ width:300, flexShrink:0, overflowY:'auto', borderRight:'1px solid var(--c-border)', background:'var(--c-surface)', scrollbarWidth:'none' }}>
          {invoices.length===0&&<ArcEmpty message="No invoices yet."/>}
          {sorted.map((inv,i) => (
            <motion.button key={inv.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
              onClick={()=>{ setSel(inv); setMobileTab('detail'); }}
              style={{ width:'100%', textAlign:'left', display:'flex', border:'none', borderBottom:'1px solid var(--c-border)', borderLeft:`2px solid ${sel?.id===inv.id?'var(--c-gold)':'transparent'}`, background:sel?.id===inv.id?'rgba(201,168,76,.07)':'transparent', cursor:'pointer', padding:0 }}>
              <div style={{ width:3, flexShrink:0, background:LEFT[inv.status]??'var(--c-muted)' }}/>
              <div style={{ flex:1, padding:'13px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--c-gold)' }}>{inv.invoice_number}</span>
                  <ArcBadge status={inv.status}/>
                </div>
                <p style={{ fontSize:13, fontWeight:sel?.id===inv.id?500:400, color:sel?.id===inv.id?'var(--c-cream)':'var(--c-sub)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:5 }}>{inv.title}</p>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13, fontWeight:600, fontFamily:'var(--font-mono)', color:inv.status==='OVERDUE'?'#C05050':'var(--c-cream)' }}>{money(inv.total_amount,inv.currency)}</span>
                  <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>Due {shortDate(inv.due_date)}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Detail */}
        {!sel ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><ArcEmpty message="Select an invoice to view details."/></div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={sel.id} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} exit={{opacity:0}} transition={{duration:0.2}}
              style={{ flex:1, overflowY:'auto', padding:'28px 32px', display:'flex', flexDirection:'column', gap:24, scrollbarWidth:'thin', scrollbarColor:'rgba(201,168,76,.12) transparent' }}>
              {err&&<ArcAlert type="error" message={err}/>}

              {/* Header */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--c-gold)' }}>{sel.invoice_number}</span>
                    <ArcBadge status={sel.status}/>
                  </div>
                  <h2 style={{ fontFamily:'var(--font-serif)', fontWeight:700, fontSize:'1.2rem', letterSpacing:'-0.01em', color:'var(--c-cream)', marginBottom:5 }}>{sel.title}</h2>
                  {sel.description&&<p style={{ fontSize:13, color:'var(--c-sub)' }}>{sel.description}</p>}
                </div>
                <ArcButton variant="outline" onClick={download} loading={downloading} size="sm" style={{ flexShrink:0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  PDF
                </ArcButton>
              </div>

              {/* Payment progress */}
              {showProgress&&(
                <ArcCard>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:18 }}>
                    <div><div style={{ fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)', marginBottom:5 }}>Amount Due</div>
                    <p style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', fontWeight:700, fontSize:'1.5rem', color:sel.status==='OVERDUE'?'#C05050':'var(--c-gold)' }}>{money(outstanding,sel.currency)}</p></div>
                    <div style={{ textAlign:'right' }}><div style={{ fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)', marginBottom:5 }}>Total Invoice</div>
                    <p style={{ fontSize:'1.15rem', fontWeight:600, fontFamily:'var(--font-mono)', color:'var(--c-cream)' }}>{money(sel.total_amount,sel.currency)}</p></div>
                  </div>
                  <div style={{ height:3, borderRadius:2, overflow:'hidden', background:'var(--c-hover)' }}>
                    <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8,ease:[0.22,1,0.36,1]}}
                      style={{ height:'100%', borderRadius:2, background:'linear-gradient(90deg,var(--c-gold),var(--c-gold2))' }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                    <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--c-sub)' }}>{money(totalPaid,sel.currency)} paid</span>
                    <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--c-gold)' }}>{pct}%</span>
                  </div>
                </ArcCard>
              )}

              {sel.status==='OVERDUE'&&(
                <div style={{ padding:'14px 18px', borderRadius:14, background:'rgba(192,80,80,.07)', border:'1px solid rgba(192,80,80,.22)' }}>
                  <p style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', color:'#C05050', fontSize:13 }}>This invoice is past its due date. Please contact your project manager to arrange payment.</p>
                </div>
              )}

              {/* Details table */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <span style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>Invoice Details</span>
                  <div style={{ height:1, flex:1, background:'var(--c-border)' }}/>
                </div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}><tbody>
                  {[['Amount',money(sel.amount,sel.currency)],[`Tax (${sel.tax_rate}%)`,money(sel.tax_amount,sel.currency)],['Total',money(sel.total_amount,sel.currency)],['Due Date',shortDate(sel.due_date)],['Issued',fullDate(sel.created_at)],...(sel.paid_at?[['Paid On',fullDate(sel.paid_at)]]:[])]
                    .map(([l,v])=>(
                    <tr key={l} style={{ borderBottom:'1px solid var(--c-border)' }}>
                      <td style={{ padding:'9px 14px 9px 0', fontSize:10, fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--c-dim)', width:120, verticalAlign:'top' }}>{l}</td>
                      <td style={{ padding:'9px 0', fontSize:13, color:l==='Total'?'var(--c-cream)':'var(--c-sub)', fontFamily:l==='Total'?'var(--font-mono)':'var(--font-sans)', fontWeight:l==='Total'?700:400, verticalAlign:'top' }}>{v}</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>

              {/* Payments */}
              {sel.payments.length > 0 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                    <span style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>Payment History ({sel.payments.length})</span>
                    <div style={{ height:1, flex:1, background:'var(--c-border)' }}/>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {sel.payments.map((pay,i) => (
                      <motion.div key={pay.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderRadius:12, background:'var(--c-card)', border:'1px solid var(--c-border)', borderLeft:'3px solid #4CAF7D' }}>
                        <div>
                          <p style={{ fontSize:14, fontWeight:600, fontFamily:'var(--font-mono)', color:'var(--c-cream)', marginBottom:3 }}>{money(pay.amount,sel.currency)}</p>
                          <p style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--c-sub)' }}>{shortDate(pay.payment_date)}{pay.payment_method?` · ${pay.payment_method.replace('_',' ')}`:''}{pay.reference?` · ${pay.reference}`:''}</p>
                        </div>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:'#4CAF7D' }}/>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,.25) 30%,rgba(201,168,76,.25) 70%,transparent)' }}/>
            </motion.div>
          </AnimatePresence>
        )}
        </div>{/* desktop detail */}
      </div>{/* hide-mobile desktop wrapper */}

      {/* ── Mobile: tab switcher ── */}
      <div className="show-mobile" style={{ display:'none', flex:1, flexDirection:'column', overflow:'hidden' }}>
        {mobileTab === 'list' ? (
          <div style={{ flex:1, overflowY:'auto', background:'var(--c-surface)', scrollbarWidth:'none' }}>
            {invoices.length===0&&<ArcEmpty message="No invoices yet."/>}
            {sorted.map((inv,i) => (
              <motion.button key={inv.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
                onClick={()=>{ setSel(inv); setMobileTab('detail'); }}
                style={{ width:'100%', textAlign:'left', display:'flex', border:'none', borderBottom:'1px solid var(--c-border)', borderLeft:`2px solid ${sel?.id===inv.id?'var(--c-gold)':'transparent'}`, background:sel?.id===inv.id?'rgba(201,168,76,.07)':'transparent', cursor:'pointer', padding:0 }}>
                <div style={{ width:3, flexShrink:0, background:LEFT[inv.status]??'var(--c-muted)' }}/>
                <div style={{ flex:1, padding:'13px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--c-gold)' }}>{inv.invoice_number}</span>
                    <ArcBadge status={inv.status}/>
                  </div>
                  <p style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--c-cream)', marginBottom:5 }}>{inv.title}</p>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, fontWeight:600, fontFamily:'var(--font-mono)', color:inv.status==='OVERDUE'?'#C05050':'var(--c-cream)' }}>{money(inv.total_amount,inv.currency)}</span>
                    <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>Due {shortDate(inv.due_date)}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--c-bg)' }}>
            <button onClick={() => setMobileTab('list')}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'var(--c-surface)', border:'none', borderBottom:'1px solid var(--c-border)', cursor:'pointer', color:'var(--c-gold)', fontSize:13, fontWeight:500, width:'100%', textAlign:'left', flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to invoices
            </button>
            {!sel ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><ArcEmpty message="Select an invoice."/></div>
            ) : (
              <div style={{ flex:1, overflowY:'auto', padding:'20px 16px', display:'flex', flexDirection:'column', gap:20, scrollbarWidth:'thin', scrollbarColor:'rgba(201,168,76,.12) transparent' }}>
                {err&&<ArcAlert type="error" message={err}/>}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--c-gold)' }}>{sel.invoice_number}</span>
                      <ArcBadge status={sel.status}/>
                    </div>
                    <h2 style={{ fontFamily:'var(--font-serif)', fontWeight:700, fontSize:'1.1rem', letterSpacing:'-0.01em', color:'var(--c-cream)', marginBottom:5 }}>{sel.title}</h2>
                  </div>
                  <ArcButton variant="outline" onClick={download} loading={downloading} size="sm" style={{ flexShrink:0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    PDF
                  </ArcButton>
                </div>
                {showProgress&&(
                  <div style={{ padding:'16px 18px', borderRadius:14, background:'var(--c-card)', border:'1px solid var(--c-border)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                      <div><p style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)', marginBottom:4 }}>Due</p><p style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', fontWeight:700, fontSize:'1.3rem', color:sel.status==='OVERDUE'?'#C05050':'var(--c-gold)' }}>{money(outstanding,sel.currency)}</p></div>
                      <div style={{ textAlign:'right' }}><p style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)', marginBottom:4 }}>Total</p><p style={{ fontSize:'1rem', fontWeight:600, fontFamily:'var(--font-mono)', color:'var(--c-cream)' }}>{money(sel.total_amount,sel.currency)}</p></div>
                    </div>
                    <div style={{ height:3, borderRadius:2, overflow:'hidden', background:'var(--c-hover)' }}>
                      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8,ease:[0.22,1,0.36,1]}} style={{ height:'100%', borderRadius:2, background:'linear-gradient(90deg,var(--c-gold),var(--c-gold2))' }}/>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                      <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--c-sub)' }}>{money(totalPaid,sel.currency)} paid</span>
                      <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--c-gold)' }}>{pct}%</span>
                    </div>
                  </div>
                )}
                <table style={{ width:'100%', borderCollapse:'collapse' }}><tbody>
                  {[['Amount',money(sel.amount,sel.currency)],[`Tax (${sel.tax_rate}%)`,money(sel.tax_amount,sel.currency)],['Total',money(sel.total_amount,sel.currency)],['Due Date',shortDate(sel.due_date)],['Issued',fullDate(sel.created_at)]]
                    .map(([l,v])=>(
                    <tr key={l} style={{ borderBottom:'1px solid var(--c-border)' }}>
                      <td style={{ padding:'8px 12px 8px 0', fontSize:10, fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--c-dim)', width:100, verticalAlign:'top' }}>{l}</td>
                      <td style={{ padding:'8px 0', fontSize:13, color:l==='Total'?'var(--c-cream)':'var(--c-sub)', fontFamily:l==='Total'?'var(--font-mono)':'var(--font-sans)', fontWeight:l==='Total'?700:400, verticalAlign:'top' }}>{v}</td>
                    </tr>
                  ))}
                </tbody></table>
                {sel.payments.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)', marginBottom:4 }}>Payment History</div>
                    {sel.payments.map((pay)=>(
                      <div key={pay.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderRadius:10, background:'var(--c-card)', border:'1px solid var(--c-border)', borderLeft:'3px solid #4CAF7D' }}>
                        <div><p style={{ fontSize:13, fontWeight:600, fontFamily:'var(--font-mono)', color:'var(--c-cream)' }}>{money(pay.amount,sel.currency)}</p><p style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--c-sub)', marginTop:2 }}>{shortDate(pay.payment_date)}{pay.payment_method?` · ${pay.payment_method.replace('_',' ')}`:''}</p></div>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:'#4CAF7D' }}/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
