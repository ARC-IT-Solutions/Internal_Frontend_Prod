'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { logoutAction } from '@/app/actions';
import type { User } from '@/types';
import { initials } from '@/lib/utils';

const Ic = {
  overview:   (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'var(--c-gold)':'var(--c-dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="9" height="9" rx="1.5"/><rect x="13" y="3" width="9" height="9" rx="1.5"/><rect x="2" y="14" width="9" height="9" rx="1.5"/><rect x="13" y="14" width="9" height="9" rx="1.5"/></svg>,
  projects:   (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'var(--c-gold)':'var(--c-dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7a1 1 0 011-1h6l2 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1z"/></svg>,
  onboarding: (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'var(--c-gold)':'var(--c-dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  tickets:    (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'var(--c-gold)':'var(--c-dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  invoices:   (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'var(--c-gold)':'var(--c-dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  profile:    (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'var(--c-gold)':'var(--c-dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-dim)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const NAV = [
  { href:'/client',            label:'Overview',    key:'overview'   as const, exact:true  },
  { href:'/client/projects',   label:'My Projects', key:'projects'   as const, exact:false },
  { href:'/client/onboarding', label:'Onboarding',  key:'onboarding' as const, exact:false },
  { href:'/client/tickets',    label:'Support',     key:'tickets'    as const, exact:false },
  { href:'/client/invoices',   label:'Invoices',    key:'invoices'   as const, exact:false },
  { href:'/client/profile',    label:'Profile',     key:'profile'    as const, exact:false },
];

export function ClientShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden c-scroll" style={{ background: 'var(--c-bg)', fontFamily: 'var(--font-sans)' }}>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0,   opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--c-surface)', borderRight: '1px solid var(--c-border)', position: 'relative', overflow: 'hidden' }}>

        {/* Subtle ambient glow at bottom */}
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Wordmark */}
        <div style={{ height: 62, display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
          <motion.div
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.4 }}
            style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--c-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--c-bg)', cursor: 'default', boxShadow: '0 2px 12px rgba(201,168,76,0.25)' }}>
            A
          </motion.div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-serif)', color: 'var(--c-cream)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>ARC IT</div>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--c-dim)', letterSpacing: '0.14em', marginTop: 2 }}>CLIENT PORTAL</div>
          </div>
        </div>

        {/* Section label */}
        <div style={{ padding: '14px 18px 6px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--c-muted)' }}>Navigation</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 10px', overflowY: 'auto', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ href, label, key, exact }, i) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <motion.div
                key={href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 + 0.1, duration: 0.35 }}>
                <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
                  <motion.div
                    whileHover={{ x: active ? 0 : 3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{
                      display:     'flex',
                      alignItems:  'center',
                      gap:         10,
                      padding:     '9px 12px',
                      borderRadius: 10,
                      fontSize:    13,
                      fontWeight:  active ? 500 : 400,
                      color:       active ? 'var(--c-cream)' : 'var(--c-sub)',
                      background:  active ? 'rgba(201,168,76,0.09)' : 'transparent',
                      borderLeft:  active ? '2px solid var(--c-gold)' : '2px solid transparent',
                      cursor:      'pointer',
                      transition:  'all 0.15s ease',
                    }}>
                    {Ic[key](active)}
                    <span style={{ flex: 1 }}>{label}</span>
                    {active && (
                      <motion.div
                        layoutId="client-pip"
                        style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--c-gold)' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Gold divider */}
        <div className="gold-rule" style={{ margin: '8px 14px' }} />

        {/* User footer */}
        <div style={{ padding: '8px 12px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div
              whileHover={{ scale: 1.08 }}
              style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(201,168,76,0.15)', color: 'var(--c-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, cursor: 'default' }}>
              {initials(user.full_name)}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--c-dim)', letterSpacing: '0.08em' }}>CLIENT</div>
            </div>
            <form action={logoutAction}>
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.88 }}
                type="submit"
                title="Sign out"
                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--c-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {Ic.logout()}
              </motion.button>
            </form>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 c-scroll">
        {children}
      </main>
    </div>
  );
}
