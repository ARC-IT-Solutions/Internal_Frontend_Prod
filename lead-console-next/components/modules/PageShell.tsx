'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

export function PageShell({ list, detail }: { list: ReactNode; detail: ReactNode }) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-col overflow-hidden" style={{ width: 288, flexShrink: 0, borderRight: '1px solid var(--s-border)', background: 'var(--s-surface)' }}>
        {list}
      </div>
      <div className="flex flex-col flex-1 overflow-hidden min-w-0" style={{ background: 'var(--s-bg)' }}>
        {detail}
      </div>
    </div>
  );
}

export function ListHeader({ title, count, actions, filters }: {
  title: string; count?: number; actions?: ReactNode; filters?: ReactNode;
}) {
  return (
    <div style={{ flexShrink: 0, borderBottom: '1px solid var(--s-border)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 14px 10px' }}>
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--s-dim)' }}>{title}</span>
        {count !== undefined && <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--s-dim)', background:'rgba(255,255,255,0.05)', padding:'1px 6px', borderRadius:4 }}>{count}</span>}
        {actions && <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>{actions}</div>}
      </div>
      {filters && <div style={{ padding:'0 10px 10px', display:'flex', gap:6, flexWrap:'wrap' }}>{filters}</div>}
    </div>
  );
}

export function EmptyDetail({ text = 'Select an item' }: { text?: string }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
      <div style={{ width:32, height:1, background:'rgba(255,255,255,0.06)' }} />
      <div style={{ fontSize:13, color:'var(--s-dim)' }}>{text}</div>
      <div style={{ width:32, height:1, background:'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

export function DetailHeader({ title, sub, badges, actions }: {
  title: string; sub?: string; badges?: ReactNode; actions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity:0, y:-4 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.25 }}
      style={{ flexShrink:0, padding:'18px 22px', borderBottom:'1px solid var(--s-border)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:'var(--s-text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:3 }}>{title}</h2>
          {sub && <p style={{ fontSize:12, color:'var(--s-sub)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:6 }}>{sub}</p>}
          {badges && <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>{badges}</div>}
        </div>
        {actions && <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0, flexWrap:'wrap' }}>{actions}</div>}
      </div>
    </motion.div>
  );
}

export function DetailBody({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      transition={{ duration:0.3, delay:0.05 }}
      style={{ flex:1, overflowY:'auto', padding:'20px 22px', display:'flex', flexDirection:'column', gap:20, scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.06) transparent' }}>
      {children}
    </motion.div>
  );
}

export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--s-dim)', marginBottom:8 }}>{label}</div>
      {children}
    </div>
  );
}
