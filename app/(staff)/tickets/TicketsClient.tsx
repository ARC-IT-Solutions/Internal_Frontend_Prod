'use client';
import { useState, useTransition, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Ticket, TicketComment, User, Paginated } from '@/types';
import { Badge, Button, Select, Textarea, Alert, EmptyState } from '@/components/ui';
import { PageShell, ListHeader, EmptyDetail, DetailHeader, DetailBody, Section } from '@/components/modules/PageShell';
import { relTime } from '@/lib/utils';
import { patchTicketAction, addCommentAction, deleteTicketAction } from '@/app/actions';

const NEXT: Record<string,string[]> = { OPEN:['IN_PROGRESS'], IN_PROGRESS:['WAITING_CLIENT','RESOLVED'], WAITING_CLIENT:['IN_PROGRESS','RESOLVED'], RESOLVED:['CLOSED'], CLOSED:[] };
const DOT: Record<string,string> = { OPEN:'#f85149', IN_PROGRESS:'#F0883E', WAITING_CLIENT:'#a371f7', RESOLVED:'#3fb950', CLOSED:'#484F58' };

export function TicketsClient({ tickets: init, currentUser }: { tickets: Paginated<Ticket>; currentUser: User }) {
  const [sel, setSel]             = useState<Ticket|null>(null);
  const [comments, setComments]   = useState<TicketComment[]>([]);
  const [loadingC, setLoadingC]   = useState(false);
  const [isPend, startTrans]      = useTransition();
  const [err, setErr]             = useState('');
  const [ok,  setOk]              = useState('');
  const [newMsg, setNewMsg]       = useState('');
  const [isInt, setIsInt]         = useState(false);
  const [sfStatus, setSfStatus]   = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const isEmp = currentUser.role !== 'client';
  const isAdmin = currentUser.role === 'admin';
  const notify = (m:string,t:'ok'|'err') => { t==='ok'?(setOk(m),setErr('')):(setErr(m),setOk('')); setTimeout(()=>{setOk('');setErr('');},5000); };
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [comments]);

  async function loadComments(id: string) {
    setLoadingC(true);
    const r = await fetch(`/api/proxy?path=tickets/${id}/comments`);
    const d = await r.json().catch(()=>[]);
    setComments(Array.isArray(d)?d:[]);
    setLoadingC(false);
  }
  async function moveTo(status:string) {
    if (!sel) return;
    startTrans(async () => { const r = await patchTicketAction(sel.id, {status}); if (r.ok) setSel(r.data as Ticket); else notify(r.error,'err'); });
  }
  async function send() {
    if (!sel||!newMsg.trim()) return;
    startTrans(async () => { const r = await addCommentAction(sel.id, newMsg.trim(), isInt); if (r.ok) { setComments(p=>[...p,r.data as TicketComment]); setNewMsg(''); } else notify(r.error,'err'); });
  }
  async function doDelete() {
    if (!sel||!confirm('Delete?')) return;
    startTrans(async () => { const r = await deleteTicketAction(sel.id); if (r.ok) { setSel(null); notify('Deleted.','ok'); } else notify(r.error,'err'); });
  }

  const filtered = init.items.filter(t => !sfStatus || t.status===sfStatus);
  const isClosed = ['RESOLVED','CLOSED'].includes(sel?.status??'');

  return (
    <PageShell
      list={
        <>
          <ListHeader title="Tickets" count={init.total}
            filters={<Select value={sfStatus} onChange={e=>setSfStatus(e.target.value)} style={{ width:'auto', height:28, padding:'0 8px', fontSize:11 }}>
              <option value="">All Status</option>
              {['OPEN','IN_PROGRESS','WAITING_CLIENT','RESOLVED','CLOSED'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </Select>}
          />
          <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,.06) transparent' }}>
            {filtered.length===0&&<EmptyState title="No tickets found" />}
            {filtered.map((t,i) => {
              const active = sel?.id===t.id;
              return (
                <motion.button key={t.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*0.02}}
                  onClick={()=>{ setSel(t); loadComments(t.id); }}
                  style={{ width:'100%', textAlign:'left', display:'flex', border:'none', borderBottom:'1px solid rgba(255,255,255,0.04)', background:active?'rgba(255,255,255,0.04)':'transparent', cursor:'pointer', padding:0 }}>
                  <div style={{ width:3, flexShrink:0, background:active?DOT[t.status]:'transparent', transition:'background 0.2s' }} />
                  <div style={{ flex:1, padding:'11px 14px', minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:3 }}>
                      <span style={{ fontSize:13, fontWeight:active?500:400, color:active?'var(--s-text)':'var(--s-sub)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</span>
                      <span style={{ fontSize:10, color:'var(--s-dim)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{relTime(t.created_at)}</span>
                    </div>
                    <div style={{ display:'flex', gap:5, marginTop:5, flexWrap:'wrap' }}><Badge status={t.priority}/><Badge status={t.status}/></div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </>
      }
      detail={
        !sel ? <EmptyDetail text="Select a ticket" /> : (
          <>
            <DetailHeader
              title={sel.title}
              sub={`Priority: ${sel.priority}`}
              badges={<><Badge status={sel.priority}/><Badge status={sel.status}/></>}
              actions={
                <>
                  {isEmp && NEXT[sel.status]?.map(s=><Button key={s} variant={['RESOLVED','CLOSED'].includes(s)?'success':'secondary'} size="sm" onClick={()=>moveTo(s)} disabled={isPend}>→ {s.replace('_',' ')}</Button>)}
                  {isAdmin&&<Button variant="danger" size="sm" onClick={doDelete} disabled={isPend}>Delete</Button>}
                </>
              }
            />
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {/* Thread */}
              <div style={{ flex:1, overflowY:'auto', padding:'16px 22px', display:'flex', flexDirection:'column', gap:12, scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,.06) transparent' }}>
                {(err||ok)&&<Alert type={err?'error':'success'} message={err||ok}/>}
                {sel.description && <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid var(--s-border)', color:'var(--s-sub)', fontSize:13, lineHeight:1.65 }}>{sel.description}</div>}
                {loadingC&&<p style={{ fontSize:12, color:'var(--s-dim)' }}>Loading…</p>}
                {comments.map((c,i) => {
                  const mine = c.author_id === sel.client_id;
                  return (
                    <motion.div key={c.id} initial={{opacity:0,x:mine?8:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
                      style={{ display:'flex', justifyContent:mine?'flex-end':'flex-start' }}>
                      <div style={{ maxWidth:'76%' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, justifyContent:mine?'flex-end':'flex-start' }}>
                          {c.is_internal&&<span style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background:'rgba(163,113,247,.15)', color:'#a371f7', fontFamily:'var(--font-mono)', textTransform:'uppercase' }}>internal</span>}
                          <span style={{ fontSize:10, color:'var(--s-dim)', fontFamily:'var(--font-mono)' }}>{mine?'Client':'Staff'} · {relTime(c.created_at)}</span>
                        </div>
                        <div style={{ padding:'10px 14px', borderRadius:14, fontSize:13, lineHeight:1.65, whiteSpace:'pre-wrap', background:c.is_internal?'rgba(163,113,247,.08)':mine?'rgba(56,139,253,.1)':'rgba(255,255,255,0.04)', border:c.is_internal?'1px solid rgba(163,113,247,.2)':mine?'1px solid rgba(56,139,253,.2)':'1px solid rgba(255,255,255,.06)', color:'var(--s-text)' }}>
                          {c.message}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={bottomRef}/>
              </div>
              {/* Compose */}
              {!isClosed ? (
                <div style={{ flexShrink:0, padding:'12px 22px', borderTop:'1px solid var(--s-border)', background:'rgba(255,255,255,0.01)' }}>
                  {isEmp&&<div style={{ display:'flex', gap:6, marginBottom:8 }}>
                    {[{l:'Public',int:false},{l:'Internal',int:true}].map(o=>(
                      <button key={o.l} onClick={()=>setIsInt(o.int)} style={{ fontSize:11, padding:'3px 10px', borderRadius:6, border:`1px solid ${isInt===o.int?(o.int?'rgba(163,113,247,.3)':'rgba(255,255,255,.15)'):'transparent'}`, background:isInt===o.int?(o.int?'rgba(163,113,247,.1)':'rgba(255,255,255,.06)'):'transparent', color:isInt===o.int?(o.int?'#a371f7':'var(--s-text)'):'var(--s-dim)', cursor:'pointer' }}>{o.l}</button>
                    ))}
                  </div>}
                  <div style={{ display:'flex', gap:8 }}>
                    <textarea value={newMsg} onChange={e=>setNewMsg(e.target.value)} placeholder={isInt?'Internal note…':'Reply to client…'} rows={2}
                      style={{ flex:1, resize:'none', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--s-text)', borderRadius:8, padding:'8px 10px', fontSize:13, outline:'none', fontFamily:'var(--font-sans)' }}
                      onKeyDown={e=>{ if((e.ctrlKey||e.metaKey)&&e.key==='Enter') send(); }} />
                    <Button variant="primary" onClick={send} loading={isPend} style={{ alignSelf:'flex-end', height:36, padding:'0 14px' }}>Send</Button>
                  </div>
                  <p style={{ fontSize:10, color:'var(--s-dim)', marginTop:4 }}>Ctrl+Enter to send</p>
                </div>
              ) : (
                <div style={{ padding:'12px 22px', borderTop:'1px solid var(--s-border)', textAlign:'center' }}>
                  <p style={{ fontSize:13, color:'var(--s-dim)' }}>Ticket is {sel.status.toLowerCase()}.</p>
                </div>
              )}
            </div>
          </>
        )
      }
    />
  );
}
