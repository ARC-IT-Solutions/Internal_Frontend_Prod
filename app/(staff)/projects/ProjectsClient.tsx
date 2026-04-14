'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Project, User, Paginated, ProjectStatus } from '@/types';
import { PROJECT_TRANSITIONS } from '@/types';
import { Badge, Button, Select, Alert, Input, Textarea, Modal, EmptyState } from '@/components/ui';
import { PageShell, ListHeader, EmptyDetail, DetailHeader, DetailBody, Section } from '@/components/modules/PageShell';
import { relTime, money, shortDate, fullDate } from '@/lib/utils';
import { patchProjectAction, deleteProjectAction, createProjectAction } from '@/app/actions';
import Link from 'next/link';

const STATUS_BAR: Record<string,string> = { DRAFT:'#484F58', PLANNING:'#388bfd', ONBOARDING:'#a371f7', IN_PROGRESS:'#F0883E', ON_HOLD:'#e08040', REVIEW:'#26d9b7', COMPLETED:'#3fb950', CANCELLED:'#f85149' };
const PRIS = ['LOW','MEDIUM','HIGH','URGENT'] as const;

export function ProjectsClient({ projects, employees, currentUser }: { projects: Paginated<Project>; employees: User[]; currentUser: User }) {
  const router = useRouter();
  const [sel, setSel]       = useState<Project|null>(null);
  const [isPend, startTrans]= useTransition();
  const [err, setErr]       = useState('');
  const [ok,  setOk]        = useState('');
  const [sfStatus, setSfStatus]= useState('');
  const [showCreate, setShowCreate]= useState(false);
  const [cf, setCf] = useState({ title:'', description:'', client_id:'', priority:'HIGH', budget:'', start_date:'', end_date:'' });
  const isEmp = currentUser.role !== 'client';
  const isAdmin = currentUser.role === 'admin';
  const notify = (m:string,t:'ok'|'err') => { t==='ok'?(setOk(m),setErr('')):(setErr(m),setOk('')); setTimeout(()=>{setOk('');setErr('');},5000); };

  async function moveTo(s: ProjectStatus) {
    if (!sel) return;
    startTrans(async () => { const r = await patchProjectAction(sel.id,{status:s}); if(r.ok){setSel(r.data as Project);notify(`→ ${s}`,'ok');router.refresh();}else notify(r.error,'err'); });
  }
  async function doDelete() {
    if (!sel||!confirm('Delete project?')) return;
    startTrans(async () => { const r = await deleteProjectAction(sel.id); if(r.ok){setSel(null);notify('Deleted.','ok');router.refresh();}else notify(r.error,'err'); });
  }
  async function doCreate() {
    if (!cf.title||!cf.client_id) return setErr('Title and Client ID required.');
    const p: Record<string,unknown> = { title:cf.title, client_id:cf.client_id, priority:cf.priority };
    if (cf.description) p.description=cf.description; if (cf.budget) p.budget=parseFloat(cf.budget);
    if (cf.start_date) p.start_date=cf.start_date; if (cf.end_date) p.end_date=cf.end_date;
    startTrans(async () => { const r = await createProjectAction(p); if(r.ok){setShowCreate(false);notify('Created!','ok');router.refresh();}else notify(r.error,'err'); });
  }

  const filtered = projects.items.filter(p => !sfStatus||p.status===sfStatus);
  const nextStates = sel ? PROJECT_TRANSITIONS[sel.status] ?? [] : [];

  return (
    <>
      <PageShell
        list={
          <>
            <ListHeader title="Projects" count={projects.total}
              filters={<Select value={sfStatus} onChange={e=>setSfStatus(e.target.value)} style={{ width:'auto', height:28, padding:'0 8px', fontSize:11 }}>
                <option value="">All Status</option>
                {['DRAFT','PLANNING','ONBOARDING','IN_PROGRESS','ON_HOLD','REVIEW','COMPLETED','CANCELLED'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </Select>}
              actions={isEmp && <button onClick={()=>setShowCreate(true)} style={{ width:28, height:28, borderRadius:7, border:'1px solid rgba(255,255,255,.1)', background:'transparent', cursor:'pointer', color:'#F0883E', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>}
            />
            <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,.06) transparent' }}>
              {filtered.length===0&&<EmptyState title="No projects found" />}
              {filtered.map((p,i) => {
                const active = sel?.id===p.id;
                return (
                  <motion.button key={p.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*0.02}}
                    onClick={()=>setSel(p)} style={{ width:'100%', textAlign:'left', display:'flex', border:'none', borderBottom:'1px solid rgba(255,255,255,0.04)', background:active?'rgba(255,255,255,0.04)':'transparent', cursor:'pointer', padding:0 }}>
                    <div style={{ width:3, flexShrink:0, background:active?STATUS_BAR[p.status]:'transparent', transition:'background 0.2s' }}/>
                    <div style={{ flex:1, padding:'11px 14px', minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:3 }}>
                        <span style={{ fontSize:13, fontWeight:active?500:400, color:active?'var(--s-text)':'var(--s-sub)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</span>
                        <span style={{ fontSize:10, color:'var(--s-dim)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{relTime(p.created_at)}</span>
                      </div>
                      {p.budget&&<div style={{ fontSize:11, color:'var(--s-dim)', marginBottom:4, fontFamily:'var(--font-mono)' }}>{money(p.budget)}</div>}
                      <div style={{ display:'flex', gap:5 }}><Badge status={p.priority}/><Badge status={p.status}/></div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </>
        }
        detail={
          !sel ? <EmptyDetail text="Select a project" /> : (
            <>
              <DetailHeader
                title={sel.title} sub={`Client: ${sel.client_id.slice(0,20)}…`}
                badges={<><Badge status={sel.priority}/><Badge status={sel.status}/></>}
                actions={
                  <>
                    <Link href={`/milestones?project=${sel.id}`} style={{ display:'inline-flex', alignItems:'center', padding:'0 10px', height:30, borderRadius:7, border:'1px solid var(--s-border)', background:'var(--s-raised)', color:'var(--s-sub)', fontSize:12, textDecoration:'none', fontWeight:500 }}>Milestones</Link>
                    <Link href={`/onboarding?project=${sel.id}`} style={{ display:'inline-flex', alignItems:'center', padding:'0 10px', height:30, borderRadius:7, border:'1px solid var(--s-border)', background:'var(--s-raised)', color:'var(--s-sub)', fontSize:12, textDecoration:'none', fontWeight:500 }}>Onboarding</Link>
                    {isAdmin&&<Button variant="danger" size="sm" onClick={doDelete} disabled={isPend}>Delete</Button>}
                  </>
                }
              />
              <DetailBody>
                {(err||ok)&&<Alert type={err?'error':'success'} message={err||ok}/>}
                {sel.description&&<Section label="Description"><p style={{ fontSize:13, lineHeight:1.65, color:'var(--s-sub)' }}>{sel.description}</p></Section>}
                <Section label="Details">
                  <table style={{ width:'100%', borderCollapse:'collapse' }}><tbody>
                    {[['Budget',sel.budget?money(sel.budget):'—'],['Start',shortDate(sel.start_date)],['End',shortDate(sel.end_date)],['Created',fullDate(sel.created_at)]].map(([l,v])=>(
                      <tr key={l} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding:'7px 12px 7px 0', fontSize:11, color:'var(--s-dim)', width:80 }}>{l}</td>
                        <td style={{ padding:'7px 0', fontSize:12, color:'var(--s-text)', fontFamily:'var(--font-mono)' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody></table>
                </Section>
                {isEmp && nextStates.length > 0 && (
                  <Section label="Move to Next Stage">
                    {sel.status==='ONBOARDING'&&<p style={{ fontSize:11, color:'#F0883E', background:'rgba(240,136,62,.08)', border:'1px solid rgba(240,136,62,.2)', borderRadius:7, padding:'8px 12px', marginBottom:10 }}>⚠ IN_PROGRESS requires approved onboarding (backend enforced).</p>}
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {nextStates.map(n=><Button key={n} variant={n==='CANCELLED'?'danger':'secondary'} size="sm" onClick={()=>moveTo(n)} disabled={isPend}>→ {n.replace('_',' ')}</Button>)}
                    </div>
                  </Section>
                )}
              </DetailBody>
            </>
          )
        }
      />
      {showCreate&&(
        <Modal title="Create New Project" onClose={()=>setShowCreate(false)}>
          {err&&<Alert type="error" message={err}/>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Input label="Title *" value={cf.title} onChange={e=>setCf({...cf,title:e.target.value})}/>
            <Input label="Client ID *" placeholder="UUID" value={cf.client_id} onChange={e=>setCf({...cf,client_id:e.target.value})}/>
            <Textarea label="Description" rows={2} value={cf.description} onChange={e=>setCf({...cf,description:e.target.value})}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Select label="Priority" value={cf.priority} onChange={e=>setCf({...cf,priority:e.target.value})} style={{ width:'100%' }}>{PRIS.map(p=><option key={p} value={p}>{p}</option>)}</Select>
              <Input label="Budget" type="number" value={cf.budget} onChange={e=>setCf({...cf,budget:e.target.value})}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Input label="Start Date" type="date" value={cf.start_date} onChange={e=>setCf({...cf,start_date:e.target.value})}/>
              <Input label="End Date" type="date" value={cf.end_date} onChange={e=>setCf({...cf,end_date:e.target.value})}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <Button variant="primary" onClick={doCreate} loading={isPend} style={{ flex:1, justifyContent:'center' }}>Create Project</Button>
            <Button variant="ghost" onClick={()=>setShowCreate(false)}>Cancel</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
