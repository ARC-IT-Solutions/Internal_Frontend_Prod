'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Project, Ticket, Invoice, User } from '@/types';
import { money, shortDate, relTime } from '@/lib/utils';

const STATUS: Record<string,{bg:string;color:string}> = {
  IN_PROGRESS:{bg:'rgba(201,168,76,.14)',color:'#C9A84C'}, ONBOARDING:{bg:'rgba(201,168,76,.12)',color:'#C9A84C'},
  PLANNING:{bg:'rgba(74,126,192,.12)',color:'#4A7EC0'}, COMPLETED:{bg:'rgba(77,158,110,.12)',color:'#4CAF7D'},
  ON_HOLD:{bg:'rgba(192,80,80,.12)',color:'#C05050'}, REVIEW:{bg:'rgba(201,168,76,.14)',color:'#E8C96A'},
  DRAFT:{bg:'rgba(90,80,64,.18)',color:'#8A7D65'}, CANCELLED:{bg:'rgba(90,80,64,.18)',color:'#5A5040'},
  PAID:{bg:'rgba(77,158,110,.12)',color:'#4CAF7D'}, PARTIALLY_PAID:{bg:'rgba(201,168,76,.14)',color:'#C9A84C'},
  SENT:{bg:'rgba(74,126,192,.12)',color:'#4A7EC0'}, OVERDUE:{bg:'rgba(192,80,80,.14)',color:'#C05050'},
  OPEN:{bg:'rgba(192,80,80,.14)',color:'#C05050'}, RESOLVED:{bg:'rgba(77,158,110,.12)',color:'#4CAF7D'},
  CLOSED:{bg:'rgba(90,80,64,.18)',color:'#5A5040'}, WAITING_CLIENT:{bg:'rgba(201,168,76,.12)',color:'#C9A84C'},
};

function Pill({ status }: { status: string }) {
  const s = STATUS[status] ?? {bg:'rgba(90,80,64,.18)',color:'#5A5040'};
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:5, fontSize:10, fontFamily:'var(--font-mono)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', background:s.bg, color:s.color }}>{status.replace(/_/g,' ')}</span>;
}

const PCT: Record<string,number> = { DRAFT:5, PLANNING:15, ONBOARDING:30, IN_PROGRESS:60, ON_HOLD:55, REVIEW:85, COMPLETED:100, CANCELLED:0 };



export function ClientOverview({ user, projects, tickets, invoices }: {
  user: User; projects: Project[]; tickets: Ticket[]; invoices: Invoice[];
}) {
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user.full_name.split(' ')[0];

  const activeProjects  = projects.filter(p => p.status === 'IN_PROGRESS');
  const openTickets     = tickets.filter(t => !['RESOLVED','CLOSED'].includes(t.status));
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE');
  const pendingAmount   = invoices.filter(i => ['SENT','PARTIALLY_PAID','OVERDUE'].includes(i.status)).reduce((s,i) => s + i.total_amount, 0);
  const activeProject   = activeProjects[0] ?? projects.find(p => p.status === 'ONBOARDING') ?? projects[0];

  return (
    <motion.div initial="hidden" animate="visible"
      style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(201,168,76,.15) transparent' }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ padding:'clamp(16px,4vw,36px) clamp(16px,5vw,36px) clamp(16px,3vw,28px)', borderBottom:'1px solid var(--c-border)' }}>
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5,ease:[0.22,1,0.36,1]}} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <span style={{ fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>Client Portal</span>
          <div style={{ height:1, width:36, background:'var(--c-gold)', opacity:0.3 }}/>
        </motion.div>
        <motion.h1 initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5,ease:[0.22,1,0.36,1]}} style={{ fontFamily:'var(--font-serif)', fontWeight:700, fontSize:'2.15rem', letterSpacing:'-0.025em', lineHeight:1.15, color:'var(--c-cream)', marginBottom:8 }}>
          {greeting},{' '}
          <em style={{ color:'var(--c-gold)', fontStyle:'italic' }}>{firstName}.</em>
        </motion.h1>
        <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5,ease:[0.22,1,0.36,1]}} style={{ fontSize:14, color:'var(--c-sub)' }}>
          Here's the current status of your engagement with ARC IT Solutions.
        </motion.p>
      </div>

      <div style={{ padding:'clamp(16px,4vw,36px)', display:'flex', flexDirection:'column', gap:'clamp(20px,4vw,32px)' }}>

        {/* ── Overdue alert ────────────────────────────────── */}
        {overdueInvoices.length > 0 && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5,ease:[0.22,1,0.36,1]}}
            style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 18px', borderRadius:14, background:'rgba(192,80,80,.07)', border:'1px solid rgba(192,80,80,.22)', color:'#C05050' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div>
              <p style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>
                {overdueInvoices.length} overdue invoice{overdueInvoices.length>1?'s':''} — {money(overdueInvoices.reduce((s,i)=>s+i.total_amount,0))} outstanding
              </p>
              <Link href="/client/invoices" style={{ fontSize:12, color:'#C05050', textDecoration:'underline', textUnderlineOffset:3 }}>View invoices →</Link>
            </div>
          </motion.div>
        )}

        {/* ── Stat cards ───────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'clamp(10px,2vw,16px)' }}>
          {[
            { label:'Active Projects', value:String(activeProjects.length), href:'/client/projects', italic:true },
            { label:'Open Tickets',    value:String(openTickets.length),    href:'/client/tickets',  italic:true },
            { label:'Pending Amount',  value:money(pendingAmount),           href:'/client/invoices', italic:false },
          ].map(({ label, value, href, italic }, i) => (
            <motion.div key={label} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5,ease:[0.22,1,0.36,1]}} style={{ animationDelay: `${i*0.08}s` }}>
              <Link href={href} style={{ textDecoration:'none', display:'block' }}>
                <motion.div whileHover={{ borderColor:'rgba(201,168,76,.35)', y:-2 }} transition={{ duration:0.2 }}
                  style={{ padding:'20px 22px', borderRadius:16, background:'var(--c-card)', border:'1px solid var(--c-border)', cursor:'pointer' }}>
                  <div style={{ fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)', marginBottom:12 }}>{label}</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontStyle:italic?'italic':'normal', fontWeight:700, fontSize:'2rem', lineHeight:1, color:'var(--c-gold)' }}>
                    {value}
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Active project ───────────────────────────────── */}
        {activeProject && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5,ease:[0.22,1,0.36,1]}}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <h2 style={{ fontFamily:'var(--font-serif)', fontWeight:600, fontSize:'1.05rem', color:'var(--c-cream)', letterSpacing:'-0.01em' }}>Your Project</h2>
                <div style={{ height:1, width:28, background:'var(--c-gold)', opacity:0.3 }}/>
              </div>
              <Link href="/client/projects" style={{ fontSize:11, fontWeight:500, color:'var(--c-gold)', textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>
                View all <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
            <div style={{ padding:'22px 24px', borderRadius:16, background:'var(--c-card)', border:'1px solid var(--c-border)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:18 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <h3 style={{ fontFamily:'var(--font-serif)', fontWeight:600, fontSize:'1.05rem', color:'var(--c-cream)', letterSpacing:'-0.01em', marginBottom:5 }}>{activeProject.title}</h3>
                  {activeProject.description&&<p style={{ fontSize:13, color:'var(--c-sub)', lineHeight:1.6 }}>{activeProject.description.slice(0,90)}{activeProject.description.length>90?'…':''}</p>}
                </div>
                <Pill status={activeProject.status}/>
              </div>
              {/* Progress */}
              {(() => {
                const pct = PCT[activeProject.status]??0;
                const done = activeProject.status==='COMPLETED';
                return (
                  <div style={{ marginBottom:18 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                      <span style={{ fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>Progress</span>
                      <span style={{ fontSize:12, fontFamily:'var(--font-mono)', fontWeight:600, color:done?'#4CAF7D':'var(--c-gold)' }}>{pct}%</span>
                    </div>
                    <div style={{ height:3, borderRadius:3, overflow:'hidden', background:'var(--c-hover)' }}>
                      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8,ease:[0.22,1,0.36,1]}}
                        style={{ height:'100%', borderRadius:3, background:done?'#4CAF7D':'linear-gradient(90deg,var(--c-gold),var(--c-gold2))' }}/>
                    </div>
                  </div>
                );
              })()}
              {/* Meta */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:'clamp(8px,2vw,14px)', paddingTop:16, borderTop:'1px solid var(--c-border)' }}>
                {[['Budget',activeProject.budget?money(activeProject.budget):'—'],['Start',shortDate(activeProject.start_date)],['Delivery',shortDate(activeProject.end_date)]].map(([l,v])=>(
                  <div key={l}>
                    <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.14em', fontFamily:'var(--font-mono)', color:'var(--c-dim)', marginBottom:4 }}>{l}</div>
                    <div style={{ fontSize:13, fontWeight:500, fontFamily:'var(--font-mono)', color:'var(--c-cream)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Two-col bottom ───────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'clamp(12px,2vw,20px)' }}>
          {/* Tickets */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5,ease:[0.22,1,0.36,1]}}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <h2 style={{ fontFamily:'var(--font-serif)', fontWeight:600, fontSize:'1rem', color:'var(--c-cream)' }}>Support Tickets</h2>
              <Link href="/client/tickets" style={{ fontSize:11, color:'var(--c-gold)', textDecoration:'none', fontWeight:500 }}>View all →</Link>
            </div>
            <div style={{ borderRadius:14, overflow:'hidden', background:'var(--c-card)', border:'1px solid var(--c-border)' }}>
              {tickets.length===0
                ? <div style={{ padding:'28px 20px', textAlign:'center', fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:13, color:'var(--c-sub)' }}>No open tickets.</div>
                : tickets.slice(0,4).map((t,i) => (
                    <div key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', borderBottom:i<Math.min(3,tickets.length-1)?'1px solid var(--c-border)':'none' }}>
                      <div style={{ flex:1, minWidth:0, marginRight:10 }}>
                        <p style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--c-cream)', marginBottom:2 }}>{t.title}</p>
                        <p style={{ fontSize:11, color:'var(--c-dim)', fontFamily:'var(--font-mono)' }}>{relTime(t.created_at)}</p>
                      </div>
                      <Pill status={t.status}/>
                    </div>
                  ))
              }
            </div>
          </motion.div>

          {/* Invoices */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5,ease:[0.22,1,0.36,1]}}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <h2 style={{ fontFamily:'var(--font-serif)', fontWeight:600, fontSize:'1rem', color:'var(--c-cream)' }}>Recent Invoices</h2>
              <Link href="/client/invoices" style={{ fontSize:11, color:'var(--c-gold)', textDecoration:'none', fontWeight:500 }}>View all →</Link>
            </div>
            <div style={{ borderRadius:14, overflow:'hidden', background:'var(--c-card)', border:'1px solid var(--c-border)' }}>
              {invoices.length===0
                ? <div style={{ padding:'28px 20px', textAlign:'center', fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:13, color:'var(--c-sub)' }}>No invoices yet.</div>
                : invoices.slice(0,4).map((inv,i) => (
                    <div key={inv.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', borderBottom:i<Math.min(3,invoices.length-1)?'1px solid var(--c-border)':'none' }}>
                      <div style={{ flex:1, minWidth:0, marginRight:10 }}>
                        <p style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--c-cream)', marginBottom:2 }}>{inv.title}</p>
                        <p style={{ fontSize:11, color:'var(--c-dim)', fontFamily:'var(--font-mono)' }}>{inv.invoice_number} · Due {shortDate(inv.due_date)}</p>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <p style={{ fontSize:12, fontWeight:600, fontFamily:'var(--font-mono)', color:'var(--c-cream)', marginBottom:3 }}>{money(inv.total_amount,inv.currency)}</p>
                        <Pill status={inv.status}/>
                      </div>
                    </div>
                  ))
              }
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5,ease:[0.22,1,0.36,1]}} style={{ textAlign:'center', paddingBottom:8 }}>
          <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,.25) 30%,rgba(201,168,76,.25) 70%,transparent)', marginBottom:16 }}/>
          <p style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:12, color:'var(--c-muted)' }}>
            ARC IT Solutions — crafting software and design that endures.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
