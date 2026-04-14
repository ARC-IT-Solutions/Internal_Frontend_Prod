'use client';
import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import type { Milestone, Project, User } from '@/types';
import { Badge, Button, Input, Textarea, Select, Alert, Modal, EmptyState } from '@/components/ui';
import { createMilestoneAction, activateMilestoneAction, deleteMilestoneAction } from '@/app/actions';
import { money, shortDate } from '@/lib/utils';
import Link from 'next/link';

export function MilestonesClient({ projects, initialMilestones, initialProjectId, currentUser }: {
  projects: Project[]; initialMilestones: Milestone[]; initialProjectId: string|null; currentUser: User;
}) {
  const [pid, setPid]         = useState(initialProjectId??'');
  const [ms, setMs]           = useState(initialMilestones);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [isPend, startTrans]  = useTransition();
  const [err, setErr]         = useState('');
  const [ok,  setOk]          = useState('');
  const [form, setForm] = useState({ title:'', description:'', usePct:true, pct:'', amount:'', due_date:'', order_index:String(initialMilestones.length+1) });
  const proj = projects.find(p => p.id === pid);
  const isEmp = currentUser.role !== 'client';
  const notify = (m:string,t:'ok'|'err') => { t==='ok'?(setOk(m),setErr('')):(setErr(m),setOk('')); setTimeout(()=>{setOk('');setErr('');},5000); };

  async function load(id: string) {
    if (!id) { setMs([]); return; }
    setLoading(true);
    const r = await fetch(`/api/proxy?path=projects/${id}/milestones`);
    const d = await r.json().catch(()=>[]);
    setMs(Array.isArray(d)?d:[]);
    setLoading(false);
  }
  async function activate(m: Milestone) {
    if (!pid||!confirm(`Activate "${m.title}"? Auto-generates invoice.`)) return;
    startTrans(async () => { const r = await activateMilestoneAction(pid,m.id); if(r.ok){notify('Activated — invoice generated!','ok');load(pid);}else notify(r.error,'err'); });
  }
  async function remove(m: Milestone) {
    if (!pid||!confirm('Delete?')) return;
    startTrans(async () => { const r = await deleteMilestoneAction(pid,m.id); if(r.ok){notify('Deleted.','ok');load(pid);}else notify(r.error,'err'); });
  }
  async function addMs() {
    if (!pid||!form.title) return setErr('Title required.');
    if (form.usePct&&!form.pct) return setErr('Percentage required.');
    if (!form.usePct&&!form.amount) return setErr('Amount required.');
    const p: Record<string,unknown> = { title:form.title, order_index:parseInt(form.order_index)||ms.length+1 };
    if (form.description) p.description=form.description; if (form.due_date) p.due_date=form.due_date;
    if (form.usePct) p.percentage=parseFloat(form.pct); else p.amount=parseFloat(form.amount);
    startTrans(async () => { const r = await createMilestoneAction(pid,p); if(r.ok){notify('Added.','ok');setShowAdd(false);load(pid);}else notify(r.error,'err'); });
  }
  const totalPct = ms.filter(m=>m.percentage).reduce((s,m)=>s+(m.percentage??0),0);

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', background:'var(--s-bg)' }}>
      <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid var(--s-border)', background:'var(--s-surface)' }}>
        <h1 style={{ fontSize:13, fontWeight:700, color:'var(--s-text)' }}>Billing Milestones</h1>
        <Select value={pid} onChange={e=>{setPid(e.target.value);load(e.target.value);}} style={{ width:260 }}>
          <option value="">Select project…</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
        </Select>
        {isEmp&&pid&&<Button variant="secondary" size="sm" onClick={()=>setShowAdd(true)} style={{ marginLeft:'auto' }}>+ Milestone</Button>}
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:20, scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,.06) transparent' }}>
        {!pid&&<p style={{ textAlign:'center', padding:60, fontSize:13, color:'var(--s-dim)' }}>Select a project</p>}
        {pid&&(
          <div style={{ maxWidth:700, display:'flex', flexDirection:'column', gap:16 }}>
            {(err||ok)&&<Alert type={err?'error':'success'} message={err||ok}/>}
            {proj&&<div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {[['Budget',proj.budget?money(proj.budget):'—'],['% Allocated',`${totalPct}%`],['Milestones',`${ms.filter(m=>m.status==='PAID').length}/${ms.length} paid`]].map(([l,v])=>(
                <div key={l as string} style={{ padding:'14px 16px', borderRadius:10, background:'var(--s-raised)', border:'1px solid var(--s-border)' }}>
                  <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--s-dim)', marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:'var(--s-text)', fontFamily:'var(--font-mono)' }}>{v}</div>
                </div>
              ))}
            </div>}
            {ms.length===0&&!loading&&<EmptyState title="No milestones yet" sub="Add billing milestones to get started"/>}
            {ms.sort((a,b)=>a.order_index-b.order_index).map((m,i) => (
              <motion.div key={m.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                style={{ padding:'14px 16px', borderRadius:10, background:'var(--s-raised)', border:'1px solid var(--s-border)', borderLeft:`3px solid ${m.status==='PAID'?'#3fb950':m.status==='INVOICED'?'#388bfd':'#484F58'}`, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:10, color:'var(--s-dim)', fontFamily:'var(--font-mono)' }}>#{m.order_index}</span>
                    <span style={{ fontSize:13, fontWeight:500, color:'var(--s-text)' }}>{m.title}</span>
                    <Badge status={m.status}/>
                  </div>
                  <div style={{ fontSize:11, color:'var(--s-dim)', fontFamily:'var(--font-mono)' }}>
                    {m.percentage?`${m.percentage}% of budget`:m.amount?money(m.amount):'—'}
                    {m.due_date?` · Due ${shortDate(m.due_date)}`:''}
                    {m.invoice_id&&<Link href={`/invoices?invoice=${m.invoice_id}`} style={{ marginLeft:8, color:'#388bfd' }}>Invoice</Link>}
                  </div>
                </div>
                {isEmp&&m.status==='PENDING'&&(
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <Button variant="success" size="sm" onClick={()=>activate(m)} disabled={isPend}>⚡ Activate</Button>
                    <Button variant="danger" size="sm" onClick={()=>remove(m)} disabled={isPend}>×</Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      {showAdd&&(
        <Modal title="Add Billing Milestone" onClose={()=>setShowAdd(false)}>
          {err&&<Alert type="error" message={err}/>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Input label="Title *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
            <Textarea label="Description" rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
            <div>
              <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                {[{l:'% of Budget',p:true},{l:'Fixed Amount',p:false}].map(o=>(
                  <Button key={o.l} variant={form.usePct===o.p?'primary':'secondary'} size="sm" onClick={()=>setForm({...form,usePct:o.p})}>{o.l}</Button>
                ))}
              </div>
              {form.usePct?<Input type="number" min="1" max="100" value={form.pct} onChange={e=>setForm({...form,pct:e.target.value})} placeholder="e.g. 25"/>
              :<Input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="Amount"/>}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Input label="Due Date" type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/>
              <Input label="Order" type="number" min="1" value={form.order_index} onChange={e=>setForm({...form,order_index:e.target.value})}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <Button variant="primary" onClick={addMs} loading={isPend} style={{ flex:1, justifyContent:'center' }}>Add Milestone</Button>
            <Button variant="ghost" onClick={()=>setShowAdd(false)}>Cancel</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
