'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PageShell
   • Desktop (≥768px): fixed 288px list | flex-1 detail — side by side
   • Mobile  (<768px): tab switcher — list OR detail, never both
   The `hasDetail` prop tells the shell whether something is selected
   so it can auto-switch to the detail tab.
───────────────────────────────────────────────────────────────── */
export function PageShell({
  list,
  detail,
  hasDetail = false,
  detailTitle = 'Detail',
}: {
  list: ReactNode;
  detail: ReactNode;
  hasDetail?: boolean;
  detailTitle?: string;
}) {
  const [tab, setTab] = useState<'list' | 'detail'>('list');

  // Auto-switch to detail on mobile when something gets selected
  useEffect(() => {
    if (hasDetail) setTab('detail');
  }, [hasDetail]);

  // Reset to list when detail is cleared
  useEffect(() => {
    if (!hasDetail) setTab('list');
  }, [hasDetail]);

  return (
    <>
      {/* ── Desktop: side-by-side ── */}
      <div className="hide-mobile" style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <div style={{ width:288, flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid var(--s-border)', background:'var(--s-surface)' }}>
          {list}
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, background:'var(--s-bg)' }}>
          {detail}
        </div>
      </div>

      {/* ── Mobile: full-screen tabs ── */}
      <div className="show-mobile" style={{ display:'none', flex:1, flexDirection:'column', overflow:'hidden' }}>
        <AnimatePresence mode="wait" initial={false}>
          {tab === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity:0, x:-20 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-20 }}
              transition={{ duration:0.2, ease:'easeOut' }}
              style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--s-surface)' }}>
              {list}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity:0, x:20 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:20 }}
              transition={{ duration:0.2, ease:'easeOut' }}
              style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--s-bg)' }}>
              {/* Back bar */}
              <button
                onClick={() => setTab('list')}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'var(--s-surface)', border:'none', borderBottom:'1px solid var(--s-border)', cursor:'pointer', color:'#F0883E', fontSize:13, fontWeight:500, flexShrink:0, width:'100%', textAlign:'left' }}>
                <BackIcon />
                Back to {detailTitle}
              </button>
              {detail}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ListHeader
───────────────────────────────────────────────────────────────── */
export function ListHeader({ title, count, actions, filters }: {
  title: string; count?: number; actions?: ReactNode; filters?: ReactNode;
}) {
  return (
    <div style={{ flexShrink:0, borderBottom:'1px solid var(--s-border)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 14px 10px' }}>
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--s-dim)' }}>
          {title}
        </span>
        {count !== undefined && (
          <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--s-dim)', background:'rgba(255,255,255,0.05)', padding:'1px 6px', borderRadius:4 }}>
            {count}
          </span>
        )}
        {actions && (
          <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>
            {actions}
          </div>
        )}
      </div>
      {filters && (
        <div style={{ padding:'0 10px 10px', display:'flex', gap:6, flexWrap:'wrap' }}>
          {filters}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   EmptyDetail
───────────────────────────────────────────────────────────────── */
export function EmptyDetail({ text = 'Select an item' }: { text?: string }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
      <div style={{ width:32, height:1, background:'rgba(255,255,255,0.06)' }} />
      <div style={{ fontSize:13, color:'var(--s-dim)' }}>{text}</div>
      <div style={{ width:32, height:1, background:'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DetailHeader — responsive: actions wrap on narrow screens
───────────────────────────────────────────────────────────────── */
export function DetailHeader({ title, sub, badges, actions }: {
  title: string; sub?: string; badges?: ReactNode; actions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity:0, y:-4 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.25 }}
      style={{ flexShrink:0, padding:'16px 18px', borderBottom:'1px solid var(--s-border)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:'var(--s-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>
            {title}
          </h2>
          {sub && (
            <p style={{ fontSize:12, color:'var(--s-sub)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:6 }}>
              {sub}
            </p>
          )}
          {badges && <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>{badges}</div>}
        </div>
        {actions && (
          <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DetailBody
───────────────────────────────────────────────────────────────── */
export function DetailBody({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      transition={{ duration:0.3, delay:0.05 }}
      style={{ flex:1, overflowY:'auto', padding:'16px 18px', display:'flex', flexDirection:'column', gap:18, scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.06) transparent' }}>
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Section
───────────────────────────────────────────────────────────────── */
export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--s-dim)', marginBottom:8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}
