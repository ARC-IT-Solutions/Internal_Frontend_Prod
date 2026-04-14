'use client';
import { useState, useTransition } from 'react';
import type { Project, OnboardingData, User } from '@/types';
import { Badge, Button, Select, Alert, Textarea } from '@/components/ui';
import { reviewOnboardingAction } from '@/app/actions';
import { fullDate } from '@/lib/utils';

export function OnboardingClient({ projects, initialOnboarding, initialProjectId, currentUser }: {
  projects: Project[]; initialOnboarding: OnboardingData|null; initialProjectId: string|null; currentUser: User;
}) {
  const [pid, setPid]         = useState(initialProjectId??'');
  const [onb, setOnb]         = useState(initialOnboarding);
  const [loading, setLoading] = useState(false);
  const [isPend, startTrans]  = useTransition();
  const [err, setErr]         = useState('');
  const [ok,  setOk]          = useState('');
  const [reason, setReason]   = useState('');
  const [showReject, setShowReject] = useState(false);
  const isEmp = currentUser.role !== 'client';

  async function load(id: string) {
    if (!id) { setOnb(null); return; }
    setLoading(true);
    const r = await fetch(`/api/proxy?path=projects/${id}/onboarding`);
    setOnb(await r.json().catch(()=>null));
    setLoading(false);
  }
  async function review(status: 'APPROVED'|'REJECTED') {
    if (status==='REJECTED'&&!reason) return setErr('Rejection reason required.');
    startTrans(async () => {
      const r = await reviewOnboardingAction(pid, status, reason||undefined);
      if (r.ok) { setOnb(r.data as OnboardingData); setOk(`${status}.`); setShowReject(false); }
      else setErr(r.error);
    });
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', background:'var(--s-bg)' }}>
      <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:16, padding:'12px 20px', borderBottom:'1px solid var(--s-border)', background:'var(--s-surface)' }}>
        <h1 style={{ fontSize:13, fontWeight:700, color:'var(--s-text)' }}>Client Onboarding</h1>
        <Select value={pid} onChange={e=>{setPid(e.target.value);load(e.target.value);}} style={{ marginLeft:'auto', width:280 }}>
          <option value="">Select a project…</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.title} ({p.status})</option>)}
        </Select>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:24, scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,.06) transparent' }}>
        {!pid&&<p style={{ textAlign:'center', padding:64, fontSize:13, color:'var(--s-dim)' }}>Select a project to view its onboarding data</p>}
        {pid&&loading&&<p style={{ fontSize:13, color:'var(--s-dim)' }}>Loading…</p>}
        {pid&&!loading&&!onb&&<p style={{ textAlign:'center', padding:64, fontSize:13, color:'var(--s-dim)' }}>No onboarding submitted yet.</p>}
        {pid&&!loading&&onb&&(
          <div style={{ maxWidth:640, display:'flex', flexDirection:'column', gap:20 }}>
            {err&&<Alert type="error" message={err}/>}{ok&&<Alert type="success" message={ok}/>}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, borderRadius:12, background:'var(--s-raised)', border:'1px solid var(--s-border)' }}>
              <div>
                <p style={{ fontSize:13, fontWeight:500, color:'var(--s-text)' }}>Onboarding Status</p>
                <p style={{ fontSize:11, color:'var(--s-dim)', marginTop:2 }}>Submitted {fullDate(onb.submitted_at)}</p>
              </div>
              <Badge status={onb.status}/>
            </div>
            {onb.rejection_reason&&<div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(248,81,73,.08)', border:'1px solid rgba(248,81,73,.2)', color:'#f85149', fontSize:13 }}>{onb.rejection_reason}</div>}
            {[['Business Name',onb.business_name],['Business Details',onb.business_details],['Requirements',onb.requirements],['Target Audience',onb.target_audience],['Additional Notes',onb.additional_notes]].filter(([,v])=>v).map(([l,v])=>(
              <div key={l as string}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--s-dim)', marginBottom:6 }}>{l}</div>
                <p style={{ fontSize:13, lineHeight:1.7, color:'var(--s-sub)', whiteSpace:'pre-wrap' }}>{v}</p>
              </div>
            ))}
            {isEmp&&onb.status==='SUBMITTED'&&(
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {showReject&&<Textarea label="Rejection Reason *" rows={2} value={reason} onChange={e=>setReason(e.target.value)} style={{ width:'100%' }}/>}
                <div style={{ display:'flex', gap:8 }}>
                  <Button variant="success" onClick={()=>review('APPROVED')} loading={isPend}>Approve</Button>
                  {!showReject?<Button variant="danger" onClick={()=>setShowReject(true)}>Reject</Button>
                  :<><Button variant="danger" onClick={()=>review('REJECTED')} loading={isPend}>Confirm Rejection</Button><Button variant="ghost" onClick={()=>setShowReject(false)}>Cancel</Button></>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
