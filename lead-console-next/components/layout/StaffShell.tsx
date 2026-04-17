'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { logoutAction } from '@/app/actions';
import type { User } from '@/types';
import { initials } from '@/lib/utils';

const Ic = {
  inquiries:  (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'#F0883E':'#484F58'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></svg>,
  tickets:    (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'#F0883E':'#484F58'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>,
  projects:   (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'#F0883E':'#484F58'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7a1 1 0 011-1h6l2 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1z"/></svg>,
  onboarding: (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'#F0883E':'#484F58'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  milestones: (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'#F0883E':'#484F58'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  invoices:   (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'#F0883E':'#484F58'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>,
  payments:   (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'#F0883E':'#484F58'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  users:      (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'#F0883E':'#484F58'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  audit:      (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'#F0883E':'#484F58'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  profile:    (a:boolean) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a?'#F0883E':'#484F58'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#484F58" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const BASE_NAV = [
  { href:'/inquiries',  label:'Inquiries',  key:'inquiries'  as const },
  { href:'/tickets',    label:'Tickets',    key:'tickets'    as const },
  { href:'/projects',   label:'Projects',   key:'projects'   as const },
  { href:'/onboarding', label:'Onboarding', key:'onboarding' as const },
  { href:'/milestones', label:'Milestones', key:'milestones' as const },
  { href:'/invoices',   label:'Invoices',   key:'invoices'   as const },
  { href:'/payments',   label:'Payments',   key:'payments'   as const },
];
const ADMIN_NAV = [
  { href:'/users', label:'Users',      key:'users' as const },
  { href:'/audit', label:'Audit Logs', key:'audit' as const },
];

export function StaffShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const nav      = user.role === 'admin' ? [...BASE_NAV, ...ADMIN_NAV] : BASE_NAV;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--s-bg)', fontFamily: 'var(--font-sans)' }}>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0,   opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: 212, flexShrink: 0, background: 'var(--s-surface)', borderRight: '1px solid var(--s-border)', display: 'flex', flexDirection: 'column' }}>

        {/* Brand */}
        <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: '1px solid var(--s-border)', flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(240,136,62,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: '#F0883E' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--s-text)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>Lead Console</div>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--s-dim)', letterSpacing: '0.1em', marginTop: 1 }}>
              {user.role.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Section label */}
        <div style={{ padding: '14px 16px 6px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--s-dim)' }}>Menu</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {nav.map(({ href, label, key }, i) => {
            const active = pathname === href || (href.length > 1 && pathname.startsWith(href + '/'));
            return (
              <motion.div
                key={href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 + 0.1, duration: 0.3 }}>
                <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      gap:            10,
                      padding:        '8px 12px',
                      borderRadius:   8,
                      fontSize:       13,
                      fontWeight:     active ? 500 : 400,
                      color:          active ? 'var(--s-text)' : 'var(--s-dim)',
                      background:     active ? 'rgba(240,136,62,0.08)' : 'transparent',
                      border:         active ? '1px solid rgba(240,136,62,0.12)' : '1px solid transparent',
                      position:       'relative',
                      cursor:         'pointer',
                      transition:     'background 0.15s, color 0.15s, border 0.15s',
                    }}>
                    {Ic[key](active)}
                    <span>{label}</span>
                    {active && (
                      <motion.div
                        layoutId="staff-pip"
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#F0883E', marginLeft: 'auto' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}

          {user.role === 'admin' && (
            <div style={{ margin: '8px 4px 4px', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--s-dim)' }}>
              Admin
            </div>
          )}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--s-border)', margin: '0 12px' }} />

        {/* Profile */}
        {(() => {
          const active = pathname === '/profile';
          return (
            <Link href="/profile" style={{ textDecoration: 'none', margin: '6px 8px 4px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, fontSize:13, fontWeight:active?500:400, color:active?'var(--s-text)':'var(--s-dim)', background:active?'rgba(240,136,62,0.08)':'transparent', border:active?'1px solid rgba(240,136,62,0.12)':'1px solid transparent', cursor:'pointer', transition:'all 0.15s' }}>
                {Ic.profile(active)}<span>Profile</span>
              </div>
            </Link>
          );
        })()}

        {/* User footer */}
        <div style={{ padding: '10px 12px 12px', borderTop: '1px solid var(--s-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div
              whileHover={{ scale: 1.08 }}
              style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: user.role === 'admin' ? 'rgba(240,136,62,0.18)' : 'rgba(56,139,253,0.18)', color: user.role === 'admin' ? '#F0883E' : '#388bfd', cursor: 'default' }}>
              {initials(user.full_name)}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--s-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: user.role === 'admin' ? '#F0883E' : '#388bfd', letterSpacing: '0.06em' }}>{user.role.toUpperCase()}</div>
            </div>
            <form action={logoutAction}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="submit"
                title="Sign out"
                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--s-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {Ic.logout()}
              </motion.button>
            </form>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: 'var(--s-bg)' }}>
        {children}
      </main>
    </div>
  );
}
