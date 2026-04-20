'use client';

import React, { forwardRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Status badge ──────────────────────────────────────────────────────────── */
const S: Record<string,{bg:string;color:string}> = {
  PAID:           { bg:'rgba(77,158,110,.12)',  color:'#4CAF7D' },
  PARTIALLY_PAID: { bg:'rgba(201,168,76,.14)',  color:'#C9A84C' },
  SENT:           { bg:'rgba(74,126,192,.12)',  color:'#4A7EC0' },
  OVERDUE:        { bg:'rgba(192,80,80,.14)',   color:'#C05050' },
  DRAFT:          { bg:'rgba(90,80,64,.18)',    color:'#8A7D65' },
  CANCELLED:      { bg:'rgba(90,80,64,.18)',    color:'#5A5040' },
  IN_PROGRESS:    { bg:'rgba(201,168,76,.14)',  color:'#C9A84C' },
  PLANNING:       { bg:'rgba(74,126,192,.12)',  color:'#4A7EC0' },
  ONBOARDING:     { bg:'rgba(201,168,76,.12)',  color:'#C9A84C' },
  COMPLETED:      { bg:'rgba(77,158,110,.12)',  color:'#4CAF7D' },
  ON_HOLD:        { bg:'rgba(192,80,80,.12)',   color:'#C05050' },
  REVIEW:         { bg:'rgba(201,168,76,.14)',  color:'#E8C96A' },
  OPEN:           { bg:'rgba(192,80,80,.14)',   color:'#C05050' },
  RESOLVED:       { bg:'rgba(77,158,110,.12)',  color:'#4CAF7D' },
  CLOSED:         { bg:'rgba(90,80,64,.18)',    color:'#5A5040' },
  WAITING_CLIENT: { bg:'rgba(201,168,76,.12)',  color:'#C9A84C' },
  PENDING:        { bg:'rgba(90,80,64,.16)',    color:'#8A7D65' },
  SUBMITTED:      { bg:'rgba(74,126,192,.12)',  color:'#4A7EC0' },
  APPROVED:       { bg:'rgba(77,158,110,.12)',  color:'#4CAF7D' },
  REJECTED:       { bg:'rgba(192,80,80,.14)',   color:'#C05050' },
  INVOICED:       { bg:'rgba(74,126,192,.12)',  color:'#4A7EC0' },
  LOW:            { bg:'rgba(90,80,64,.18)',    color:'#8A7D65' },
  MEDIUM:         { bg:'rgba(74,126,192,.10)',  color:'#4A7EC0' },
  HIGH:           { bg:'rgba(201,168,76,.12)',  color:'#C9A84C' },
  URGENT:         { bg:'rgba(192,80,80,.14)',   color:'#C05050' },
};

export function ArcBadge({ status, className='' }: { status:string; className?:string }) {
  const s = S[status] ?? { bg:'rgba(90,80,64,.18)', color:'#5A5040' };
  return (
    <span className={className}
      style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:5, fontSize:10, fontFamily:'var(--font-mono)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', background:s.bg, color:s.color }}>
      {status.replace(/_/g,' ')}
    </span>
  );
}

/* ── Page header ───────────────────────────────────────────────────────────── */
export function ArcPageHeader({ eyebrow, title, italic, sub, action }: {
  eyebrow?:string; title:string; italic?:string; sub?:string; action?:ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity:0, y:-8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.4, ease:[0.22,1,0.36,1] }}
      style={{ flexShrink:0, padding:'clamp(16px,4vw,32px) clamp(16px,5vw,36px) clamp(14px,3vw,24px)', borderBottom:'1px solid var(--c-border)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
        <div>
          {eyebrow && (
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <span style={{ fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>{eyebrow}</span>
              <div style={{ height:1, width:32, background:'var(--c-gold)', opacity:0.35 }} />
            </div>
          )}
          <h1 style={{ fontFamily:'var(--font-serif)', fontWeight:700, fontSize:'1.65rem', letterSpacing:'-0.025em', lineHeight:1.15, color:'var(--c-cream)' }}>
            {title}
            {italic && <> <em style={{ color:'var(--c-gold)', fontStyle:'italic' }}>{italic}</em></>}
          </h1>
          {sub && <p style={{ fontSize:13, color:'var(--c-sub)', marginTop:6 }}>{sub}</p>}
        </div>
        {action && <div style={{ flexShrink:0 }}>{action}</div>}
      </div>
    </motion.div>
  );
}

/* ── Card ──────────────────────────────────────────────────────────────────── */
export function ArcCard({ children, style={}, className='', padding=true }: {
  children:ReactNode; style?:React.CSSProperties; className?:string; padding?:boolean;
}) {
  return (
    <div className={className}
      style={{ borderRadius:14, background:'var(--c-card)', border:'1px solid var(--c-border)', padding: padding?'18px 20px':0, ...style }}>
      {children}
    </div>
  );
}

/* ── Button ────────────────────────────────────────────────────────────────── */
type AV = 'gold'|'outline'|'ghost'|'danger';
const AV_STYLE: Record<AV, React.CSSProperties> = {
  gold:    { background:'var(--c-gold)',      color:'var(--c-bg)',    border:'none',                          fontWeight:600 },
  outline: { background:'transparent',         color:'var(--c-gold)', border:'1px solid var(--c-border)',                    },
  ghost:   { background:'transparent',         color:'var(--c-sub)',  border:'1px solid var(--c-border)',                    },
  danger:  { background:'rgba(192,80,80,.1)', color:'#C05050',        border:'1px solid rgba(192,80,80,.25)'                 },
};
interface ABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:AV; size?:'sm'|'md'|'lg'; loading?:boolean; children:ReactNode;
}
export const ArcButton = forwardRef<HTMLButtonElement,ABProps>(
  ({ variant='ghost', size='md', loading, children, disabled, style={}, ...rest }, ref) => {
    const h = size==='sm'?34:size==='lg'?48:40;
    const px = size==='sm'?12:size==='lg'?24:16;
    const fs = size==='sm'?12:13;
    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        whileHover={!disabled&&!loading?{ scale:1.02 }:{}}
        whileTap={!disabled&&!loading?{ scale:0.97 }:{}}
        {...(rest as Record<string,unknown>)}
        disabled={disabled||loading}
        style={{ display:'inline-flex', alignItems:'center', gap:8, height:h, padding:`0 ${px}px`, borderRadius:10, fontSize:fs, cursor:disabled||loading?'not-allowed':'pointer', opacity:disabled||loading?.45:1, transition:'all 0.15s', fontFamily:'var(--font-sans)', ...AV_STYLE[variant], ...style }}>
        {loading && <ArcSpinner size={14} />}
        {children}
      </motion.button>
    );
  }
);
ArcButton.displayName = 'ArcButton';

/* ── Input ─────────────────────────────────────────────────────────────────── */
const ARC_INP: React.CSSProperties = { background:'var(--c-card)', border:'1px solid var(--c-border)', color:'var(--c-cream)', borderRadius:10, outline:'none', fontFamily:'var(--font-sans)', fontSize:14, width:'100%', transition:'border-color 0.15s, box-shadow 0.15s' };

export const ArcInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?:string; error?:string }>(
  ({ label, error, style={}, ...props }, ref) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>{label}</label>}
      <input ref={ref} {...props}
        style={{ ...ARC_INP, height:44, padding:'0 14px', borderColor:error?'rgba(192,80,80,.5)':'var(--c-border)', ...style }}
        onFocus={e=>{ e.currentTarget.style.borderColor='rgba(201,168,76,.4)'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(201,168,76,.08)'; }}
        onBlur={e=>{ e.currentTarget.style.borderColor=error?'rgba(192,80,80,.5)':'var(--c-border)'; e.currentTarget.style.boxShadow='none'; }}
      />
      {error && <p style={{ fontSize:11, color:'#C05050' }}>{error}</p>}
    </div>
  )
);
ArcInput.displayName = 'ArcInput';

export const ArcTextarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?:string }>(
  ({ label, style={}, ...props }, ref) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>{label}</label>}
      <textarea ref={ref} {...props}
        style={{ ...ARC_INP, padding:'12px 14px', resize:'none', ...style }}
        onFocus={e=>{ e.currentTarget.style.borderColor='rgba(201,168,76,.4)'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(201,168,76,.08)'; }}
        onBlur={e=>{ e.currentTarget.style.borderColor='var(--c-border)'; e.currentTarget.style.boxShadow='none'; }}
      />
    </div>
  )
);
ArcTextarea.displayName = 'ArcTextarea';

export const ArcSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?:string }>(
  ({ label, style={}, children, ...props }, ref) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>{label}</label>}
      <select ref={ref} {...props} style={{ ...ARC_INP, height:44, padding:'0 14px', cursor:'pointer', ...style }}>{children}</select>
    </div>
  )
);
ArcSelect.displayName = 'ArcSelect';

/* ── Alert ─────────────────────────────────────────────────────────────────── */
export function ArcAlert({ type, message }: { type:'error'|'success'|'info'; message:string }) {
  if (!message) return null;
  const s = { error:{bg:'rgba(192,80,80,.09)',border:'rgba(192,80,80,.25)',color:'#C05050'}, success:{bg:'rgba(77,158,110,.09)',border:'rgba(77,158,110,.25)',color:'#4CAF7D'}, info:{bg:'rgba(201,168,76,.09)',border:'rgba(201,168,76,.25)',color:'var(--c-gold)'} }[type];
  return (
    <motion.div initial={{ opacity:0,y:-4 }} animate={{ opacity:1,y:0 }}
      style={{ padding:'10px 14px', borderRadius:10, border:`1px solid ${s.border}`, background:s.bg, color:s.color, fontSize:13, marginBottom:12 }}>
      {message}
    </motion.div>
  );
}

/* ── Modal ─────────────────────────────────────────────────────────────────── */
export function ArcModal({ title, sub, onClose, children }: { title:string; sub?:string; onClose:()=>void; children:ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(11,9,7,0.88)', backdropFilter:'blur(10px)' }}
        onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
        <motion.div initial={{ scale:0.94, opacity:0, y:12 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.94, opacity:0 }}
          transition={{ type:'spring', stiffness:420, damping:30 }}
          style={{ width:'100%', maxWidth:520, maxHeight:'88vh', display:'flex', flexDirection:'column', borderRadius:18, overflow:'hidden', background:'var(--c-card)', border:'1px solid var(--c-border)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'20px 22px 16px', borderBottom:'1px solid var(--c-border)', flexShrink:0 }}>
            <div>
              <h3 style={{ fontFamily:'var(--font-serif)', fontSize:15, fontWeight:600, color:'var(--c-cream)', marginBottom:3 }}>{title}</h3>
              {sub && <p style={{ fontSize:12, color:'var(--c-sub)' }}>{sub}</p>}
            </div>
            <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} onClick={onClose}
              style={{ width:30, height:30, borderRadius:9, border:'1px solid var(--c-border)', background:'transparent', cursor:'pointer', color:'var(--c-dim)', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
              ×
            </motion.button>
          </div>
          <div style={{ overflowY:'auto', flex:1, padding:22 }}>{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Spinner ───────────────────────────────────────────────────────────────── */
export function ArcSpinner({ size=16 }: { size?:number }) {
  return <div style={{ width:size, height:size, borderRadius:'50%', border:'2px solid rgba(201,168,76,.2)', borderTopColor:'var(--c-gold)', animation:'spin 0.7s linear infinite', flexShrink:0 }} />;
}

/* ── Empty ─────────────────────────────────────────────────────────────────── */
export function ArcEmpty({ message }: { message:string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 20px' }}>
      <p style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', color:'var(--c-sub)', fontSize:14 }}>{message}</p>
    </div>
  );
}

/* ── Gold divider ──────────────────────────────────────────────────────────── */
export function ArcDivider() {
  return <div className="gold-rule" style={{ margin:'8px 0' }} />;
}
