'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project, Milestone, OnboardingData } from '@/types';
import { ArcBadge, ArcCard, ArcPageHeader, ArcEmpty } from '@/components/ui/ArcUI';
import { money, shortDate } from '@/lib/utils';

type Rich = Project & { milestones: Milestone[]; onboarding: OnboardingData | null };

const PCT: Record<string,number> = { DRAFT:5, PLANNING:15, ONBOARDING:30, IN_PROGRESS:60, ON_HOLD:55, REVIEW:85, COMPLETED:100, CANCELLED:0 };
const STAGE_LABEL: Record<string,string> = {
  DRAFT:'Getting started', PLANNING:'In planning', ONBOARDING:'Awaiting your input',
  IN_PROGRESS:'Actively in progress', ON_HOLD:'Temporarily paused',
  REVIEW:'Under final review', COMPLETED:'Successfully delivered', CANCELLED:'Cancelled',
};
const STAGES = ['PLANNING','ONBOARDING','IN_PROGRESS','REVIEW','COMPLETED'];
const MS_COLOR: Record<string,string> = { PAID:'#4CAF7D', INVOICED:'#4A7EC0', PENDING:'rgba(90,80,64,.4)', ACTIVATED:'#C9A84C' };

export function ClientProjectsView({ projects }: { projects: Rich[] }) {
  const [sel, setSel] = useState<Rich | null>(projects[0] ?? null);

  if (projects.length === 0) return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <ArcPageHeader eyebrow="ARC IT Solutions" title="My" italic="Projects" />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><ArcEmpty message="No projects yet. Your project manager will set this up." /></div>
    </div>
  );

  const pct    = sel ? PCT[sel.status] ?? 0 : 0;
  const isDone = sel?.status === 'COMPLETED';
  const ms     = sel?.milestones ?? [];
  const onb    = sel?.onboarding;
  const needsOnb = sel && ['PLANNING','ONBOARDING'].includes(sel.status) && (!onb || onb.status === 'REJECTED');

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <ArcPageHeader eyebrow="ARC IT Solutions" title="My" italic="Projects" sub="Track the progress of your ongoing work." />

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Desktop project list sidebar */}
        {projects.length > 1 && (
          <div className="hide-mobile" style={{ width:224, flexShrink:0, borderRight:'1px solid var(--c-border)', background:'var(--c-surface)', overflowY:'auto', scrollbarWidth:'none' }}>
            <div style={{ padding:'14px 16px 6px', fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--c-muted)' }}>Projects</div>
            {projects.map(p => {
              const active = sel?.id === p.id;
              return (
                <motion.button key={p.id} onClick={() => setSel(p)} whileHover={{ x: active ? 0 : 2 }}
                  style={{ width:'100%', textAlign:'left', padding:'11px 16px', border:'none', borderBottom:'1px solid var(--c-border)', borderLeft:`2px solid ${active?'var(--c-gold)':'transparent'}`, background:active?'rgba(201,168,76,.07)':'transparent', cursor:'pointer', display:'block' }}>
                  <p style={{ fontSize:13, fontWeight:active?500:400, color:active?'var(--c-cream)':'var(--c-sub)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{p.title}</p>
                  <p style={{ fontSize:10, color:'var(--c-dim)', fontFamily:'var(--font-mono)' }}>{STAGE_LABEL[p.status]}</p>
                </motion.button>
              );
            })}
          </div>
        )}
        {/* Mobile project dropdown */}
        {projects.length > 1 && (
          <div className="show-mobile" style={{ display:'none', flexShrink:0, padding:'10px 14px', borderBottom:'1px solid var(--c-border)', background:'var(--c-surface)' }}>
            <select
              value={sel?.id ?? ''}
              onChange={e => setSel(projects.find(p => p.id === e.target.value) ?? null)}
              style={{ width:'100%', height:40, padding:'0 12px', background:'var(--c-card)', border:'1px solid var(--c-border)', color:'var(--c-cream)', borderRadius:10, fontSize:13, fontFamily:'var(--font-sans)', outline:'none', cursor:'pointer' }}>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title} — {STAGE_LABEL[p.status]}</option>
              ))}
            </select>
          </div>
        )}

        {/* Detail */}
        <AnimatePresence mode="wait">
          {sel && (
            <motion.div key={sel.id} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-8}} transition={{duration:0.25}}
              style={{ flex:1, overflowY:'auto', padding:'clamp(16px,4vw,32px)', display:'flex', flexDirection:'column', gap:20, scrollbarWidth:'thin', scrollbarColor:'rgba(201,168,76,.15) transparent' }}>

              {/* Title */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                <div>
                  <ArcBadge status={sel.status} />
                  <h2 style={{ fontFamily:'var(--font-serif)', fontWeight:700, fontSize:'1.4rem', letterSpacing:'-0.02em', color:'var(--c-cream)', marginTop:8, marginBottom:6 }}>{sel.title}</h2>
                  {sel.description&&<p style={{ fontSize:13, color:'var(--c-sub)', lineHeight:1.65, maxWidth:'55ch' }}>{sel.description}</p>}
                </div>
              </div>

              {/* Progress card */}
              <ArcCard>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
                  <div>
                    <div style={{ fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)', marginBottom:5 }}>Project Progress</div>
                    <p style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', fontWeight:700, fontSize:'1.15rem', color:isDone?'#4CAF7D':'var(--c-gold)' }}>{STAGE_LABEL[sel.status]}</p>
                  </div>
                  <p style={{ fontFamily:'var(--font-serif)', fontWeight:700, fontSize:'1.75rem', color:isDone?'#4CAF7D':'var(--c-gold)', lineHeight:1 }}>{pct}%</p>
                </div>

                {/* Stage track */}
                <div style={{ display:'flex', borderRadius:8, overflow:'auto', border:'1px solid var(--c-border)', marginBottom:14, scrollbarWidth:'none' }}>
                  {STAGES.map((stage, i) => {
                    const sp    = PCT[stage]??0;
                    const done  = pct >= sp;
                    const curr  = sel.status === stage;
                    return (
                      <div key={stage} style={{ flex:1, padding:'7px 4px', textAlign:'center', fontSize:9, fontFamily:'var(--font-mono)', fontWeight:curr?700:400, letterSpacing:'0.06em', textTransform:'uppercase', background:curr?'rgba(201,168,76,.12)':done?'rgba(77,158,110,.06)':'transparent', color:curr?'var(--c-gold)':done?'#4CAF7D':'var(--c-muted)', borderRight:i<STAGES.length-1?'1px solid var(--c-border)':'none', transition:'all 0.2s' }}>
                        {stage.replace('_',' ')}
                      </div>
                    );
                  })}
                </div>

                {/* Bar */}
                <div style={{ height:3, borderRadius:2, overflow:'hidden', background:'var(--c-hover)' }}>
                  <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8,ease:[0.22,1,0.36,1]}}
                    style={{ height:'100%', borderRadius:2, background:isDone?'#4CAF7D':'linear-gradient(90deg,var(--c-gold),var(--c-gold2))' }}/>
                </div>
              </ArcCard>

              {/* Onboarding gate */}
              {needsOnb && (
                <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
                  style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 18px', borderRadius:14, background:'rgba(201,168,76,.07)', border:'1px solid rgba(201,168,76,.25)', color:'var(--c-gold)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, marginBottom:5 }}>
                      {onb?.status==='REJECTED'?'Onboarding needs corrections':'Action required — complete your onboarding'}
                    </p>
                    {onb?.rejection_reason&&<p style={{ fontSize:12, color:'#C05050', marginBottom:6 }}>{onb.rejection_reason}</p>}
                    <Link href="/client/onboarding" style={{ fontSize:12, color:'var(--c-gold)', textDecoration:'underline', textUnderlineOffset:3 }}>
                      {onb?.status==='REJECTED'?'Resubmit onboarding →':'Complete onboarding →'}
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Details grid */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <span style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>Project Details</span>
                  <div style={{ height:1, flex:1, background:'var(--c-border)' }}/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10 }}>
                  {[['Budget',sel.budget?money(sel.budget):'—'],['Priority',sel.priority],['Start',shortDate(sel.start_date)],['Delivery',shortDate(sel.end_date)]].map(([l,v])=>(
                    <div key={l} style={{ padding:'14px 16px', borderRadius:12, background:'var(--c-card)', border:'1px solid var(--c-border)' }}>
                      <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.14em', fontFamily:'var(--font-mono)', color:'var(--c-dim)', marginBottom:5 }}>{l}</div>
                      <div style={{ fontSize:13, fontWeight:500, fontFamily:'var(--font-mono)', color:'var(--c-cream)', textTransform:'capitalize' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              {ms.length > 0 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                    <span style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>
                      Billing Milestones — {ms.filter(m=>m.status==='PAID').length}/{ms.length} paid
                    </span>
                    <div style={{ height:1, flex:1, background:'var(--c-border)' }}/>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {ms.sort((a,b)=>a.order_index-b.order_index).map((m,i) => (
                      <motion.div key={m.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderRadius:12, background:'var(--c-card)', border:'1px solid var(--c-border)', borderLeft:`3px solid ${MS_COLOR[m.status]??'rgba(90,80,64,.4)'}` }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                            <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>#{m.order_index}</span>
                            <span style={{ fontSize:13, fontWeight:500, color:'var(--c-cream)' }}>{m.title}</span>
                          </div>
                          <p style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--c-sub)' }}>
                            {m.percentage?`${m.percentage}% of budget`:m.amount?money(m.amount):'—'}{m.due_date?` · Due ${shortDate(m.due_date)}`:''}
                          </p>
                        </div>
                        <ArcBadge status={m.status}/>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,.25) 30%,rgba(201,168,76,.25) 70%,transparent)' }}/>
              <p style={{ textAlign:'center', fontSize:12, paddingBottom:8 }}>
                <span style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', color:'var(--c-sub)' }}>Questions? </span>
                <Link href="/client/tickets" style={{ color:'var(--c-gold)', textDecoration:'underline', textUnderlineOffset:3, fontSize:12 }}>Raise a support ticket →</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
