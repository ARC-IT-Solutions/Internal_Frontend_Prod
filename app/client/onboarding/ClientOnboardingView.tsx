'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Project, OnboardingData } from '@/types';
import { ArcBadge, ArcButton, ArcCard, ArcInput, ArcTextarea, ArcAlert, ArcPageHeader, ArcEmpty } from '@/components/ui/ArcUI';
import { submitOnboardingAction } from '@/app/actions';

type Rich = Project & { onboarding: OnboardingData | null };
interface Form { business_name:string; business_details:string; requirements:string; target_audience:string; additional_notes:string; assets:Record<string,boolean>; creds:Array<{key:string;val:string}>; }
const ASSETS = [{key:'logo',label:'Logo files (.png, .svg)'},{key:'brand_guidelines',label:'Brand guidelines'},{key:'existing_data_export',label:'Data for migration'},{key:'api_credentials',label:'API credentials'}];
const BLANK: Form = { business_name:'', business_details:'', requirements:'', target_audience:'', additional_notes:'', assets:Object.fromEntries(ASSETS.map(a=>[a.key,false])), creds:[{key:'',val:''},{key:'',val:''},{key:'',val:''}] };

function Step({ n, active }: { n:number; active?:boolean }) {
  return <div style={{ width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, background:active?'var(--c-gold)':'rgba(201,168,76,.12)', color:active?'var(--c-bg)':'var(--c-gold)' }}>{n}</div>;
}

export function ClientOnboardingView({ projects }: { projects: Rich[] }) {
  const router = useRouter();
  const [sel, setSel]            = useState<Rich|null>(projects.find(p=>!p.onboarding||p.onboarding.status==='REJECTED')??projects[0]??null);
  const [form, setForm]          = useState<Form>(BLANK);
  const [isPend, startTrans]     = useTransition();
  const [err, setErr]            = useState('');
  const [done, setDone]          = useState(false);

  if (projects.length===0) return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <ArcPageHeader eyebrow="ARC IT Solutions" title="Client" italic="Onboarding"/>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><ArcEmpty message="No projects require onboarding at this time." /></div>
    </div>
  );

  const onb      = sel?.onboarding;
  const isLocked = !!onb && onb.status !== 'REJECTED';

  function updateCred(i:number, f:'key'|'val', v:string) {
    setForm(prev => { const creds=[...prev.creds]; creds[i]={...creds[i],[f]:v}; return {...prev,creds}; });
  }

  async function submit() {
    if (!sel) return;
    if (!form.business_name.trim()) return setErr('Business name is required.');
    if (!form.requirements.trim())  return setErr('Project requirements are required.');
    const creds: Record<string,string>={};
    form.creds.forEach(({key,val})=>{ if(key.trim()&&val.trim()) creds[key.trim()]=val.trim(); });
    const payload: Record<string,unknown> = { business_name:form.business_name.trim(), requirements:form.requirements.trim(), assets_provided:form.assets };
    if(form.business_details.trim()) payload.business_details=form.business_details.trim();
    if(form.target_audience.trim())  payload.target_audience=form.target_audience.trim();
    if(form.additional_notes.trim()) payload.additional_notes=form.additional_notes.trim();
    if(Object.keys(creds).length)    payload.credentials=creds;
    setErr('');
    startTrans(async () => { const r = await submitOnboardingAction(sel.id, payload); if(r.ok){setDone(true);router.refresh();}else setErr(r.error); });
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <ArcPageHeader eyebrow="ARC IT Solutions" title="Client" italic="Onboarding" sub="Complete this form so your team can deliver the best possible results." />

      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(201,168,76,.12) transparent' }}>
        <div style={{ maxWidth:680, margin:'0 auto', padding:'28px 24px', display:'flex', flexDirection:'column', gap:20 }}>

          {/* Project picker */}
          {projects.length > 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>Select Project</div>
              {projects.map(p=>(
                <button key={p.id} onClick={()=>setSel(p)}
                  style={{ textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderRadius:12, border:`1px solid ${sel?.id===p.id?'rgba(201,168,76,.35)':'var(--c-border)'}`, background:sel?.id===p.id?'rgba(201,168,76,.07)':'var(--c-card)', cursor:'pointer' }}>
                  <span style={{ fontSize:13, fontWeight:500, color:'var(--c-cream)' }}>{p.title}</span>
                  <ArcBadge status={p.onboarding?.status??'PENDING'}/>
                </button>
              ))}
            </div>
          )}

          {/* Status banner */}
          {onb&&(
            <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
              style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 18px', borderRadius:14, background:onb.status==='APPROVED'?'rgba(77,158,110,.07)':onb.status==='REJECTED'?'rgba(192,80,80,.07)':'rgba(201,168,76,.07)', border:`1px solid ${onb.status==='APPROVED'?'rgba(77,158,110,.25)':onb.status==='REJECTED'?'rgba(192,80,80,.25)':'rgba(201,168,76,.25)'}`, color:onb.status==='APPROVED'?'#4CAF7D':onb.status==='REJECTED'?'#C05050':'var(--c-gold)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <p style={{ fontSize:13, fontWeight:600, marginBottom:onb.rejection_reason?6:0 }}>
                  {onb.status==='SUBMITTED'?'Under review — your project manager will respond shortly.':onb.status==='APPROVED'?'Approved! Your project is now being set up.':'Needs corrections — please update and resubmit.'}
                </p>
                {onb.rejection_reason&&<p style={{ fontSize:12, padding:'8px 12px', borderRadius:7, background:'rgba(192,80,80,.08)', color:'#C05050', marginTop:4 }}>{onb.rejection_reason}</p>}
                {onb.status==='APPROVED'&&<Link href="/client/projects" style={{ fontSize:12, color:'#4CAF7D', textDecoration:'underline', textUnderlineOffset:3, marginTop:4, display:'inline-block' }}>View your project →</Link>}
              </div>
            </motion.div>
          )}

          {/* Success */}
          {done&&(
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:32, borderRadius:16, background:'var(--c-card)', border:'1px solid rgba(77,158,110,.25)' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#4CAF7D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>
              <p style={{ fontFamily:'var(--font-serif)', fontWeight:600, fontSize:'1.05rem', color:'#4CAF7D', marginTop:14, marginBottom:6 }}>Onboarding submitted!</p>
              <p style={{ fontSize:13, color:'var(--c-sub)' }}>Your project manager will review it shortly.</p>
            </div>
          )}

          {/* Form */}
          {!isLocked&&!done&&(
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {err&&<ArcAlert type="error" message={err}/>}

              {/* Step 1 */}
              <ArcCard>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}><Step n={1} active/><h3 style={{ fontFamily:'var(--font-serif)', fontWeight:600, color:'var(--c-cream)' }}>About Your Business</h3></div>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <ArcInput label="Business Name *" value={form.business_name} onChange={e=>setForm(f=>({...f,business_name:e.target.value}))} placeholder="e.g. TechStartup Pvt Ltd"/>
                  <ArcTextarea label="Business Description" rows={3} value={form.business_details} onChange={e=>setForm(f=>({...f,business_details:e.target.value}))} placeholder="Industry, team size, current workflow, problem you're solving…"/>
                  <ArcInput label="Target Audience" value={form.target_audience} onChange={e=>setForm(f=>({...f,target_audience:e.target.value}))} placeholder="e.g. Small manufacturing companies"/>
                </div>
              </ArcCard>

              {/* Step 2 */}
              <ArcCard>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}><Step n={2} active/><h3 style={{ fontFamily:'var(--font-serif)', fontWeight:600, color:'var(--c-cream)' }}>Project Requirements *</h3></div>
                <p style={{ fontSize:12, color:'var(--c-sub)', marginBottom:12 }}>Be as detailed as possible — features, integrations, platforms, user roles, timeline, constraints.</p>
                <ArcTextarea rows={5} value={form.requirements} onChange={e=>setForm(f=>({...f,requirements:e.target.value}))} placeholder="Web app + mobile. Must integrate with Tally. Need barcode scanning. MVP in 3 months…"/>
              </ArcCard>

              {/* Step 3 */}
              <ArcCard>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}><Step n={3} active/><h3 style={{ fontFamily:'var(--font-serif)', fontWeight:600, color:'var(--c-cream)' }}>Assets &amp; Access</h3></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                  {ASSETS.map(({key,label}) => {
                    const checked = form.assets[key]??false;
                    return (
                      <button key={key} type="button" onClick={()=>setForm(f=>({...f,assets:{...f.assets,[key]:!checked}}))}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, border:`1px solid ${checked?'rgba(77,158,110,.35)':'var(--c-border)'}`, background:checked?'rgba(77,158,110,.07)':'var(--c-bg)', cursor:'pointer', textAlign:'left' }}>
                        <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${checked?'#4CAF7D':'var(--c-dim)'}`, background:checked?'#4CAF7D':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {checked&&<svg viewBox="0 0 10 8" width="10" height="8"><path d="M1 4l3 3 5-6" stroke="#0B0907" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span style={{ fontSize:12, color:checked?'#4CAF7D':'var(--c-sub)', lineHeight:1.3 }}>{label}</span>
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize:11, color:'var(--c-sub)', marginBottom:8 }}>Technical credentials / access info (optional):</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {form.creds.map((c,i)=>(
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      <ArcInput value={c.key} onChange={e=>updateCred(i,'key',e.target.value)} placeholder={['e.g. Tally version','e.g. Hosting provider','Key'][i]??'Key'}/>
                      <ArcInput value={c.val} onChange={e=>updateCred(i,'val',e.target.value)} placeholder={['Tally Prime 2.1','AWS India','Value'][i]??'Value'}/>
                    </div>
                  ))}
                </div>
              </ArcCard>

              {/* Step 4 */}
              <ArcCard>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}><Step n={4} active/><h3 style={{ fontFamily:'var(--font-serif)', fontWeight:600, color:'var(--c-cream)' }}>Anything else?</h3></div>
                <ArcTextarea rows={3} value={form.additional_notes} onChange={e=>setForm(f=>({...f,additional_notes:e.target.value}))} placeholder="Deadlines, preferences, references, constraints…"/>
              </ArcCard>

              <div style={{ display:'flex', alignItems:'center', gap:16, paddingBottom:16 }}>
                <ArcButton variant="gold" onClick={submit} loading={isPend} size="lg">Submit Onboarding</ArcButton>
                <p style={{ fontSize:11, color:'var(--c-dim)', fontStyle:'italic' }}>All information is kept strictly confidential.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
