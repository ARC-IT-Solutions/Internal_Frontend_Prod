'use client';

import { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Inquiry, User, Paginated, ConvertInquiryPayload } from '@/types';
import { Badge, Button, Input, Select, Textarea, Modal, Alert, EmptyState, Spinner } from '@/components/ui';
import { PageShell, ListHeader, EmptyDetail, DetailHeader, DetailBody, Section } from '@/components/modules/PageShell';
import { relTime, fullDate } from '@/lib/utils';
import { patchInquiryAction, deleteInquiryAction, convertInquiryAction } from '@/app/actions';

const STATUSES  = ['NEW','CONTACTED','QUALIFIED','CONVERTED','REJECTED'] as const;
const PRIS      = ['LOW','MEDIUM','HIGH','URGENT'] as const;
const POLL_MS   = 10 * 60 * 1000;
const SRC_COLOR: Record<string,string> = { website_form:'#F0883E', cold_call:'#388bfd', referral:'#3fb950', social:'#a371f7', other:'#484F58' };

function RefreshIcon({ spin }: { spin: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={spin ? '#F0883E' : '#484F58'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: spin ? 'spin 1s linear infinite' : 'none' }}>
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
    </svg>
  );
}

export function InquiriesClient({ inquiries: init, employees, currentUser }: {
  inquiries: Paginated<Inquiry>; employees: User[]; currentUser: User;
}) {
  const router = useRouter();
  const [items,    setItems]    = useState(init.items);
  const [total,    setTotal]    = useState(init.total);
  const [sel,      setSel]      = useState<Inquiry | null>(null);
  const [polling,  setPolling]  = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [newBadge, setNewBadge] = useState(0);
  const [countdown,setCountdown]= useState('');
  const [showConv, setShowConv] = useState(false);
  const [isPend,   startTrans]  = useTransition();
  const [err,      setErr]      = useState('');
  const [ok,       setOk]       = useState('');
  const [sfStatus, setSfStatus] = useState('');
  const [sfPri,    setSfPri]    = useState('');
  const [cv, setCv] = useState<ConvertInquiryPayload>({ full_name:'', password:'', project_title:'', priority:'HIGH' });
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const isAdmin = currentUser.role === 'admin';
  const isEmp   = currentUser.role !== 'client';

  const notify = (msg: string, t: 'ok'|'err') => {
    t==='ok' ? (setOk(msg), setErr('')) : (setErr(msg), setOk(''));
    setTimeout(() => { setOk(''); setErr(''); }, 5000);
  };

  const doPoll = useCallback(async () => {
    setPolling(true);
    try {
      const q = new URLSearchParams({ page_size:'50' });
      if (sfStatus) q.set('status', sfStatus);
      if (sfPri)    q.set('priority', sfPri);
      const res = await fetch(`/api/proxy?path=inquiries&${q}`);
      if (!res.ok) return;
      const data = await res.json() as { items: Inquiry[]; total: number };
      if (!data?.items) return;
      setItems(prev => {
        const ids = new Set(prev.map(i => i.id));
        const fresh = data.items.filter(i => !ids.has(i.id));
        if (fresh.length) setNewBadge(c => c + fresh.length);
        return data.items;
      });
      setTotal(data.total ?? data.items.length);
      setLastSync(new Date());
      setSel(s => s ? (data.items.find(i => i.id === s.id) ?? s) : s);
    } catch {}
    setPolling(false);
  }, [sfStatus, sfPri]);

  useEffect(() => {
    window.dispatchEvent(new Event('inquiries:register'));
    const handler = (e: Event) => { setNewBadge(c => c + ((e as CustomEvent).detail?.count ?? 1)); doPoll(); };
    window.addEventListener('inquiries:new', handler);
    pollRef.current = setInterval(doPoll, POLL_MS);
    return () => { window.removeEventListener('inquiries:new', handler); if (pollRef.current) clearInterval(pollRef.current); };
  }, [doPoll]);

  useEffect(() => {
    const t = setInterval(() => {
      if (!lastSync) { setCountdown(''); return; }
      const s = Math.max(0, Math.floor((lastSync.getTime() + POLL_MS - Date.now()) / 1000));
      setCountdown(`${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, [lastSync]);

  async function patch(field: string, value: string) {
    if (!sel) return;
    startTrans(async () => {
      const r = await patchInquiryAction(sel.id, { [field]: value });
      if (r.ok) {
        const u = r.data as Inquiry;
        setItems(p => p.map(i => i.id === sel.id ? { ...i, ...u } : i));
        setSel(p => p ? { ...p, ...u } : p);
        notify('Updated.', 'ok');
      } else notify(r.error, 'err');
    });
  }

  async function doDelete() {
    if (!sel || !confirm('Delete this inquiry?')) return;
    startTrans(async () => {
      const r = await deleteInquiryAction(sel.id);
      if (r.ok) { setItems(p => p.filter(i => i.id !== sel.id)); setSel(null); notify('Deleted.', 'ok'); }
      else notify(r.error, 'err');
    });
  }

  async function doConvert() {
    if (!sel) return;
    if (!cv.full_name || !cv.password || !cv.project_title) return setErr('Name, password, and project title required.');
    startTrans(async () => {
      const r = await convertInquiryAction(sel.id, cv);
      if (r.ok) {
        setItems(p => p.map(i => i.id === sel.id ? { ...i, status:'CONVERTED' } : i));
        setSel(p => p ? { ...p, status:'CONVERTED' } : p);
        setShowConv(false); notify('Converted! Redirecting…', 'ok');
        setTimeout(() => router.push('/projects'), 1500);
      } else notify(r.error, 'err');
    });
  }

  const filtered   = items.filter(i => (!sfStatus || i.status===sfStatus) && (!sfPri || i.priority===sfPri));
  const canConvert = isEmp && sel?.status === 'QUALIFIED';
  const canDelete  = isAdmin && sel && sel.status !== 'CONVERTED';

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <PageShell
        list={
          <>
            <ListHeader
              title="Inquiries" count={total}
              filters={
                <>
                  <Select value={sfStatus} onChange={e => setSfStatus(e.target.value)} style={{ width:'auto', height:28, padding:'0 8px', fontSize:11 }}>
                    <option value="">All Status</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Select value={sfPri} onChange={e => setSfPri(e.target.value)} style={{ width:'auto', height:28, padding:'0 8px', fontSize:11 }}>
                    <option value="">All Priority</option>
                    {PRIS.map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </>
              }
              actions={
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {newBadge > 0 && (
                    <motion.button initial={{ scale:0 }} animate={{ scale:1 }} onClick={() => setNewBadge(0)}
                      style={{ fontSize:10, padding:'2px 8px', borderRadius:5, background:'rgba(240,136,62,.15)', color:'#F0883E', border:'none', cursor:'pointer', fontFamily:'var(--font-mono)' }}>
                      +{newBadge} new
                    </motion.button>
                  )}
                  {countdown && !polling && (
                    <span style={{ fontSize:10, color:'rgba(72,79,88,0.6)', fontFamily:'var(--font-mono)' }}>{countdown}</span>
                  )}
                  <button onClick={() => doPoll()} disabled={polling}
                    style={{ width:28, height:28, borderRadius:7, border:'1px solid var(--s-border)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                    title={lastSync ? `Synced ${relTime(lastSync.toISOString())} · auto every 10 min` : 'Auto-refresh every 10 min'}>
                    <RefreshIcon spin={polling} />
                  </button>
                </div>
              }
            />

            {/* Poll bar */}
            <div style={{ padding:'4px 14px', background:'rgba(255,255,255,0.01)', borderBottom:'1px solid var(--s-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:10, color:'rgba(72,79,88,0.6)', fontFamily:'var(--font-mono)' }}>
                {polling ? 'syncing…' : lastSync ? `synced ${relTime(lastSync.toISOString())}` : '10-min auto-refresh active'}
              </span>
            </div>

            {/* List */}
            <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,.06) transparent' }}>
              {filtered.length === 0 && <EmptyState title="No inquiries found" />}
              {filtered.map((inq, i) => {
                const active = sel?.id === inq.id;
                return (
                  <motion.button
                    key={inq.id}
                    initial={{ opacity:0, x:-6 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSel(inq)}
                    style={{ width:'100%', textAlign:'left', display:'flex', border:'none', borderBottom:'1px solid rgba(255,255,255,0.04)', background: active ? 'rgba(255,255,255,0.04)' : 'transparent', cursor:'pointer', padding:0 }}>
                    <div style={{ width:3, flexShrink:0, background: active ? SRC_COLOR[inq.source??'other'] : 'transparent', transition:'background 0.2s' }} />
                    <div style={{ flex:1, padding:'11px 14px', minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:8, marginBottom:3 }}>
                        <span style={{ fontSize:13, fontWeight:active?500:400, color:active?'var(--s-text)':'var(--s-sub)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {inq.name}
                        </span>
                        <span style={{ fontSize:10, color:'var(--s-dim)', fontFamily:'var(--font-mono)', flexShrink:0 }}>
                          {relTime(inq.created_at)}
                        </span>
                      </div>
                      <div style={{ fontSize:11, color:'var(--s-dim)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:5 }}>
                        {inq.subject ?? inq.company ?? inq.email}
                      </div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        <Badge status={inq.priority} />
                        <Badge status={inq.status} />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </>
        }
        detail={
          !sel ? <EmptyDetail text="Select an inquiry to view details" /> : (
            <>
              <DetailHeader
                title={sel.name}
                sub={`${sel.email}${sel.phone?' · '+sel.phone:''}${sel.company?' · '+sel.company:''}`}
                badges={<><Badge status={sel.priority} /><Badge status={sel.status} /></>}
                actions={
                  <>
                    {sel.phone && <a href={`tel:${sel.phone}`} style={{ display:'inline-flex', alignItems:'center', padding:'0 10px', height:30, borderRadius:7, border:'1px solid var(--s-border)', background:'var(--s-raised)', color:'var(--s-sub)', fontSize:12, textDecoration:'none', fontWeight:500 }}>Call</a>}
                    <a href={`mailto:${sel.email}`} style={{ display:'inline-flex', alignItems:'center', padding:'0 10px', height:30, borderRadius:7, border:'1px solid var(--s-border)', background:'var(--s-raised)', color:'var(--s-sub)', fontSize:12, textDecoration:'none', fontWeight:500 }}>Email</a>
                    {canConvert && <Button variant="success" size="sm" onClick={() => { setCv({ ...cv, full_name:sel.name, project_title:`${sel.company??sel.name} — Project` }); setShowConv(true); }}>Convert to Client</Button>}
                    {canDelete  && <Button variant="danger"  size="sm" onClick={doDelete} disabled={isPend}>Delete</Button>}
                  </>
                }
              />
              <DetailBody>
                {(err||ok) && <Alert type={err?'error':'success'} message={err||ok} />}

                {sel.subject && (
                  <Section label="Subject">
                    <p style={{ fontSize:14, fontWeight:500, color:'var(--s-text)' }}>{sel.subject}</p>
                  </Section>
                )}
                {sel.message && (
                  <Section label="Message">
                    <div style={{ fontSize:13, lineHeight:1.65, whiteSpace:'pre-wrap', color:'var(--s-sub)', background:'rgba(255,255,255,0.02)', border:'1px solid var(--s-border)', borderLeft:'3px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'12px 14px' }}>
                      {sel.message}
                    </div>
                  </Section>
                )}

                <Section label="Details">
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <tbody>
                      {[['Source',(sel.source??'—').replace('_',' ')],['Company',sel.company??'—'],['Received',fullDate(sel.created_at)],...(sel.converted_at?[['Converted',fullDate(sel.converted_at)]]:[])]
                        .map(([l,v]) => (
                          <tr key={l} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding:'7px 12px 7px 0', fontSize:11, color:'var(--s-dim)', width:100 }}>{l}</td>
                            <td style={{ padding:'7px 0', fontSize:12, color:'var(--s-text)', textTransform:'capitalize' }}>{v}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </Section>

                {isEmp && sel.status !== 'CONVERTED' && sel.status !== 'REJECTED' && (
                  <Section label="Move Status">
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {STATUSES.filter(s => s !== 'CONVERTED').map(s => (
                        <Button key={s} variant={sel.status===s?'primary':'secondary'} size="sm" onClick={() => patch('status', s)} disabled={isPend}>
                          {s}
                        </Button>
                      ))}
                    </div>
                  </Section>
                )}

                {isEmp && (
                  <Section label="Notes">
                    <Textarea defaultValue={sel.notes??''} rows={3} style={{ width:'100%' }} placeholder="Add internal notes…"
                      onBlur={e => { if (e.target.value !== (sel.notes??'')) patch('notes', e.target.value); }} />
                  </Section>
                )}

                {isEmp && employees.length > 0 && (
                  <Section label="Assigned To">
                    <Select defaultValue={sel.assigned_to??''} onChange={e => patch('assigned_to', e.target.value)} style={{ width:200 }}>
                      <option value="">Unassigned</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                    </Select>
                  </Section>
                )}
              </DetailBody>
            </>
          )
        }
      />

      {showConv && sel && (
        <Modal title={`Convert: ${sel.name}`} sub="Creates a client account and project in PLANNING status" onClose={() => setShowConv(false)}>
          {err && <Alert type="error" message={err} />}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Input label="Client Full Name *" value={cv.full_name} onChange={e => setCv({...cv, full_name:e.target.value})} />
            <Input label="Temporary Password *" type="password" placeholder="Min 8 chars" value={cv.password} onChange={e => setCv({...cv, password:e.target.value})} />
            <Input label="Project Title *" value={cv.project_title} onChange={e => setCv({...cv, project_title:e.target.value})} />
            <Textarea label="Project Description" rows={2} value={cv.project_description??''} onChange={e => setCv({...cv, project_description:e.target.value})} />
            <Select label="Priority" value={cv.priority??'HIGH'} onChange={e => setCv({...cv, priority:e.target.value as never})} style={{ width:160 }}>
              {PRIS.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:18 }}>
            <Button variant="success" onClick={doConvert} loading={isPend} style={{ flex:1, justifyContent:'center' }}>Create Client + Project</Button>
            <Button variant="ghost" onClick={() => setShowConv(false)}>Cancel</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
