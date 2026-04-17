'use client';

import React, { type ReactNode, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Status badge ──────────────────────────────────────────────────────────── */
const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  NEW:            { bg:'rgba(240,136,62,.1)',  color:'#F0883E', border:'rgba(240,136,62,.2)' },
  CONTACTED:      { bg:'rgba(56,139,253,.1)',  color:'#388bfd', border:'rgba(56,139,253,.2)' },
  QUALIFIED:      { bg:'rgba(38,217,183,.1)',  color:'#26d9b7', border:'rgba(38,217,183,.2)' },
  CONVERTED:      { bg:'rgba(63,185,80,.1)',   color:'#3fb950', border:'rgba(63,185,80,.2)'  },
  REJECTED:       { bg:'rgba(72,79,88,.15)',   color:'#6e7681', border:'rgba(72,79,88,.2)'   },
  DRAFT:          { bg:'rgba(72,79,88,.12)',   color:'#6e7681', border:'rgba(72,79,88,.2)'   },
  PLANNING:       { bg:'rgba(56,139,253,.1)',  color:'#388bfd', border:'rgba(56,139,253,.2)' },
  ONBOARDING:     { bg:'rgba(163,113,247,.1)', color:'#a371f7', border:'rgba(163,113,247,.2)'},
  IN_PROGRESS:    { bg:'rgba(240,136,62,.1)',  color:'#F0883E', border:'rgba(240,136,62,.2)' },
  ON_HOLD:        { bg:'rgba(248,136,60,.1)',  color:'#e08040', border:'rgba(248,136,60,.2)' },
  REVIEW:         { bg:'rgba(38,217,183,.1)',  color:'#26d9b7', border:'rgba(38,217,183,.2)' },
  COMPLETED:      { bg:'rgba(63,185,80,.1)',   color:'#3fb950', border:'rgba(63,185,80,.2)'  },
  CANCELLED:      { bg:'rgba(248,81,73,.1)',   color:'#f85149', border:'rgba(248,81,73,.2)'  },
  OPEN:           { bg:'rgba(248,81,73,.1)',   color:'#f85149', border:'rgba(248,81,73,.2)'  },
  IN_PROGRESS_TK: { bg:'rgba(240,136,62,.1)',  color:'#F0883E', border:'rgba(240,136,62,.2)' },
  WAITING_CLIENT: { bg:'rgba(163,113,247,.1)', color:'#a371f7', border:'rgba(163,113,247,.2)'},
  RESOLVED:       { bg:'rgba(63,185,80,.1)',   color:'#3fb950', border:'rgba(63,185,80,.2)'  },
  CLOSED:         { bg:'rgba(72,79,88,.12)',   color:'#6e7681', border:'rgba(72,79,88,.2)'   },
  SENT:           { bg:'rgba(56,139,253,.1)',  color:'#388bfd', border:'rgba(56,139,253,.2)' },
  PARTIALLY_PAID: { bg:'rgba(240,136,62,.1)',  color:'#F0883E', border:'rgba(240,136,62,.2)' },
  PAID:           { bg:'rgba(63,185,80,.1)',   color:'#3fb950', border:'rgba(63,185,80,.2)'  },
  OVERDUE:        { bg:'rgba(248,81,73,.1)',   color:'#f85149', border:'rgba(248,81,73,.2)'  },
  PENDING:        { bg:'rgba(72,79,88,.12)',   color:'#6e7681', border:'rgba(72,79,88,.2)'   },
  INVOICED:       { bg:'rgba(56,139,253,.1)',  color:'#388bfd', border:'rgba(56,139,253,.2)' },
  SUBMITTED:      { bg:'rgba(56,139,253,.1)',  color:'#388bfd', border:'rgba(56,139,253,.2)' },
  APPROVED:       { bg:'rgba(63,185,80,.1)',   color:'#3fb950', border:'rgba(63,185,80,.2)'  },
  LOW:            { bg:'rgba(72,79,88,.12)',   color:'#6e7681', border:'rgba(72,79,88,.2)'   },
  MEDIUM:         { bg:'rgba(56,139,253,.1)',  color:'#388bfd', border:'rgba(56,139,253,.2)' },
  HIGH:           { bg:'rgba(240,136,62,.1)',  color:'#F0883E', border:'rgba(240,136,62,.2)' },
  URGENT:         { bg:'rgba(248,81,73,.1)',   color:'#f85149', border:'rgba(248,81,73,.2)'  },
};

export function Badge({ status, className = '' }: { status: string; className?: string }) {
  const s = STATUS_STYLES[status] ?? { bg:'rgba(72,79,88,.12)', color:'#6e7681', border:'rgba(72,79,88,.2)' };
  return (
    <span className={className}
      style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:5, fontSize:10, fontFamily:'var(--font-mono)', fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      {status.replace(/_/g,' ')}
    </span>
  );
}

/* ── Button ────────────────────────────────────────────────────────────────── */
type BtnVariant = 'primary'|'secondary'|'ghost'|'danger'|'success'|'warning';
const BTN: Record<BtnVariant,{bg:string;color:string;border:string;hover:string}> = {
  primary:   { bg:'#1a4f7a', color:'#e6edf3', border:'rgba(56,139,253,.3)',  hover:'#1d5a8a' },
  secondary: { bg:'rgba(255,255,255,.05)', color:'#8B949E', border:'rgba(255,255,255,.1)', hover:'rgba(255,255,255,.08)' },
  ghost:     { bg:'transparent', color:'#6e7681', border:'transparent', hover:'rgba(255,255,255,.04)' },
  danger:    { bg:'rgba(248,81,73,.1)',  color:'#f85149', border:'rgba(248,81,73,.2)',  hover:'rgba(248,81,73,.18)' },
  success:   { bg:'rgba(63,185,80,.1)', color:'#3fb950', border:'rgba(63,185,80,.2)',  hover:'rgba(63,185,80,.18)' },
  warning:   { bg:'rgba(240,136,62,.1)',color:'#F0883E', border:'rgba(240,136,62,.2)', hover:'rgba(240,136,62,.18)' },
};

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant; size?: 'sm'|'md'|'lg'; loading?: boolean; children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement,BtnProps>(
  ({ variant='secondary', size='md', loading, children, disabled, style={}, ...rest }, ref) => {
    const v = BTN[variant];
    const h = size==='sm' ? 28 : size==='lg' ? 40 : 32;
    const px = size==='sm' ? 10 : size==='lg' ? 18 : 12;
    const fs = size==='sm' ? 11 : 13;
    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        whileHover={!disabled && !loading ? { scale: 1.01 } : {}}
        whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
        {...(rest as Record<string,unknown>)}
        disabled={disabled||loading}
        style={{ display:'inline-flex', alignItems:'center', gap:6, height:h, padding:`0 ${px}px`, borderRadius:8, border:`1px solid ${v.border}`, background:v.bg, color:v.color, fontSize:fs, fontWeight:500, cursor:disabled||loading?'not-allowed':'pointer', opacity:disabled||loading?.45:1, transition:'background 0.15s, color 0.15s', fontFamily:'var(--font-sans)', ...style }}>
        {loading && <Spinner size={12} />}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

/* ── Input ─────────────────────────────────────────────────────────────────── */
const INP = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--s-text)', borderRadius:8, outline:'none', fontFamily:'var(--font-sans)', fontSize:13, width:'100%', transition:'border-color 0.15s, box-shadow 0.15s' };

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?:string; error?:string }>(
  ({ label, error, style={}, ...props }, ref) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--s-dim)' }}>{label}</label>}
      <input ref={ref} {...props}
        style={{ ...INP, height:34, padding:'0 10px', borderColor:error?'rgba(248,81,73,0.4)':'rgba(255,255,255,0.1)', ...style }}
        onFocus={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow='0 0 0 2px rgba(255,255,255,0.04)'; }}
        onBlur={e=>{ e.currentTarget.style.borderColor=error?'rgba(248,81,73,0.4)':'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow='none'; }}
      />
      {error && <p style={{ fontSize:11, color:'#f85149' }}>{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?:string }>(
  ({ label, style={}, ...props }, ref) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--s-dim)' }}>{label}</label>}
      <textarea ref={ref} {...props}
        style={{ ...INP, padding:'8px 10px', resize:'none', ...style }}
        onFocus={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow='0 0 0 2px rgba(255,255,255,0.04)'; }}
        onBlur={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow='none'; }}
      />
    </div>
  )
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?:string }>(
  ({ label, style={}, children, ...props }, ref) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--s-dim)' }}>{label}</label>}
      <select ref={ref} {...props}
        style={{ ...INP, height:34, padding:'0 10px', cursor:'pointer', ...style }}>
        {children}
      </select>
    </div>
  )
);
Select.displayName = 'Select';

/* ── Alert ─────────────────────────────────────────────────────────────────── */
export function Alert({ type, message }: { type:'error'|'success'|'info'|'warning'; message:string }) {
  if (!message) return null;
  const s = { error:{bg:'rgba(248,81,73,.09)',border:'rgba(248,81,73,.25)',color:'#f85149'}, success:{bg:'rgba(63,185,80,.09)',border:'rgba(63,185,80,.25)',color:'#3fb950'}, info:{bg:'rgba(56,139,253,.09)',border:'rgba(56,139,253,.25)',color:'#388bfd'}, warning:{bg:'rgba(240,136,62,.09)',border:'rgba(240,136,62,.25)',color:'#F0883E'} }[type];
  return (
    <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
      style={{ display:'flex', gap:10, padding:'10px 14px', borderRadius:10, border:`1px solid ${s.border}`, background:s.bg, color:s.color, fontSize:13, marginBottom:12 }}>
      <span style={{ flexShrink:0 }}>{ type==='error'?'⚠':type==='success'?'✓':'ℹ' }</span>
      <span>{message}</span>
    </motion.div>
  );
}

/* ── Modal ─────────────────────────────────────────────────────────────────── */
export function Modal({ title, sub, onClose, children }: { title:string; sub?:string; onClose:()=>void; children:ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(13,17,23,0.88)', backdropFilter:'blur(6px)' }}
        onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
        <motion.div
          initial={{ scale:0.95, opacity:0, y:10 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.95, opacity:0 }}
          transition={{ type:'spring', stiffness:400, damping:30 }}
          style={{ width:'100%', maxWidth:520, maxHeight:'88vh', display:'flex', flexDirection:'column', borderRadius:16, overflow:'hidden', background:'var(--s-raised)', border:'1px solid var(--s-border)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'18px 20px', borderBottom:'1px solid var(--s-border)', flexShrink:0 }}>
            <div>
              <h3 style={{ fontSize:14, fontWeight:600, color:'var(--s-text)', marginBottom:3 }}>{title}</h3>
              {sub && <p style={{ fontSize:12, color:'var(--s-sub)' }}>{sub}</p>}
            </div>
            <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} onClick={onClose}
              style={{ width:28, height:28, borderRadius:8, border:'1px solid var(--s-border)', background:'transparent', cursor:'pointer', color:'var(--s-dim)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
              ×
            </motion.button>
          </div>
          <div style={{ overflowY:'auto', flex:1, padding:20 }}>{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── EmptyState ────────────────────────────────────────────────────────────── */
export function EmptyState({ title, sub }: { title:string; sub?:string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 20px', gap:6 }}>
      <p style={{ fontSize:13, color:'var(--s-dim)' }}>{title}</p>
      {sub && <p style={{ fontSize:11, color:'rgba(72,79,88,.6)' }}>{sub}</p>}
    </div>
  );
}

/* ── Spinner ───────────────────────────────────────────────────────────────── */
export function Spinner({ size=16, color='currentColor' }: { size?:number; color?:string }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', border:`2px solid rgba(255,255,255,0.1)`, borderTopColor:color, animation:'spin 0.7s linear infinite', flexShrink:0 }} />
  );
}

/* ── SectionLabel ──────────────────────────────────────────────────────────── */
export function SectionLabel({ children }: { children:ReactNode }) {
  return <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--s-dim)', marginBottom:6 }}>{children}</div>;
}

/* ── InfoRow ───────────────────────────────────────────────────────────────── */
export function InfoRow({ label, children }: { label:string; children:ReactNode }) {
  return (
    <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <td style={{ padding:'7px 12px 7px 0', fontSize:11, color:'var(--s-dim)', width:110, verticalAlign:'top' }}>{label}</td>
      <td style={{ padding:'7px 0', fontSize:12, color:'var(--s-text)', verticalAlign:'top' }}>{children}</td>
    </tr>
  );
}
