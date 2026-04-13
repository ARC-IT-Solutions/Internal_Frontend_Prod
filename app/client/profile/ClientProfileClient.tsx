'use client';

import { useState, useTransition } from 'react';
import type { User } from '@/types';
import { ArcPageHeader, ArcLabel, ArcInput, ArcBtn, ArcAlert, ArcRule } from '@/components/arc-ui';
import { updateMeAction, changePasswordAction } from '@/app/actions';
import { KeyRound, UserCircle2, Save } from 'lucide-react';

export function ClientProfileClient({ currentUser }: { currentUser: User }) {
  const [isPending, startTransition] = useTransition();
  const [profileMsg, setProfileMsg]  = useState({ type: '', text: '' });
  const [pwMsg,      setPwMsg]       = useState({ type: '', text: '' });

  const [name,   setName]   = useState(currentUser.full_name);
  const [phone,  setPhone]  = useState(currentUser.phone ?? '');
  const [curPw,  setCurPw]  = useState('');
  const [newPw,  setNewPw]  = useState('');
  const [confPw, setConfPw] = useState('');

  function initials(n: string) { return n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(); }

  async function saveProfile() {
    if (!name.trim()) return setProfileMsg({ type: 'error', text: 'Name is required.' });
    startTransition(async () => {
      const r = await updateMeAction({ full_name: name.trim(), phone: phone.trim() || undefined });
      if (r.ok) setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
      else      setProfileMsg({ type: 'error',   text: r.error });
    });
  }

  async function changePassword() {
    if (newPw !== confPw) return setPwMsg({ type: 'error', text: "New passwords don't match." });
    if (newPw.length < 8) return setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
    if (!curPw)           return setPwMsg({ type: 'error', text: 'Please enter your current password.' });
    startTransition(async () => {
      const r = await changePasswordAction(curPw, newPw);
      if (r.ok) { setPwMsg({ type: 'success', text: 'Password changed.' }); setCurPw(''); setNewPw(''); setConfPw(''); }
      else        setPwMsg({ type: 'error', text: r.error });
    });
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ArcPageHeader title="Your" italic="Profile" sub="Manage your account details and security settings." />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8 space-y-8">

          {/* Avatar + identity card */}
          <div className="flex items-center gap-5 px-6 py-5 rounded-2xl"
            style={{ background: 'var(--arc-bg-card)', border: '1px solid var(--arc-border)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold flex-shrink-0"
              style={{ background: 'rgba(201,168,76,.15)', color: 'var(--arc-gold)', fontFamily: 'var(--font-serif)' }}>
              {initials(currentUser.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--arc-ivory)', fontWeight: 600, fontSize: '1.1rem' }}>
                {currentUser.full_name}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--arc-mute)' }}>{currentUser.email}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider mt-1.5"
                style={{ background: 'rgba(201,168,76,.12)', color: 'var(--arc-gold)' }}>
                CLIENT
              </span>
            </div>
          </div>

          <ArcRule />

          {/* Personal info */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <UserCircle2 size={15} style={{ color: 'var(--arc-gold)' }} />
              <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--arc-cream)', fontWeight: 600 }}>Personal Information</h3>
            </div>

            {profileMsg.text && <ArcAlert type={profileMsg.type as 'error' | 'success'} message={profileMsg.text} />}

            <div className="space-y-4">
              <div>
                <ArcLabel>Full Name</ArcLabel>
                <ArcInput className="w-full mt-1.5" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <ArcLabel>Phone Number</ArcLabel>
                <ArcInput className="w-full mt-1.5" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 …" />
              </div>
              <div>
                <ArcLabel>Email Address</ArcLabel>
                <ArcInput className="w-full mt-1.5" value={currentUser.email} disabled style={{ opacity: 0.45, cursor: 'not-allowed' }} />
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--arc-mute)', fontStyle: 'italic' }}>
                  Email cannot be changed. Contact your project manager if needed.
                </p>
              </div>
            </div>

            <ArcBtn variant="gold" onClick={saveProfile} loading={isPending} className="mt-5 h-10 px-6 text-sm">
              <Save size={14} /> Save Profile
            </ArcBtn>
          </div>

          <ArcRule />

          {/* Change password */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <KeyRound size={15} style={{ color: 'var(--arc-gold)' }} />
              <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--arc-cream)', fontWeight: 600 }}>Change Password</h3>
            </div>

            {pwMsg.text && <ArcAlert type={pwMsg.type as 'error' | 'success'} message={pwMsg.text} />}

            <div className="space-y-4">
              <div>
                <ArcLabel>Current Password</ArcLabel>
                <ArcInput className="w-full mt-1.5" type="password" value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="Your current password" />
              </div>
              <div>
                <ArcLabel>New Password</ArcLabel>
                <ArcInput className="w-full mt-1.5" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 8 characters" />
              </div>
              <div>
                <ArcLabel>Confirm New Password</ArcLabel>
                <ArcInput className="w-full mt-1.5" type="password" value={confPw} onChange={e => setConfPw(e.target.value)} placeholder="Repeat new password" />
              </div>
            </div>

            <ArcBtn variant="outline" onClick={changePassword} loading={isPending} className="mt-5 h-10 px-6 text-sm">
              <KeyRound size={14} /> Update Password
            </ArcBtn>
          </div>

          <ArcRule />
          <p className="text-center text-[11px] pb-4" style={{ color: 'var(--arc-dim)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            ARC IT Solutions — crafting software and design that endures.
          </p>
        </div>
      </div>
    </div>
  );
}
