'use client';

import { useState, useTransition } from 'react';
import type { User } from '@/types';
import { Btn, Input, Alert, SectionLabel } from '@/components/ui';
import { updateMeAction, changePasswordAction } from '@/app/actions';
import { Save, KeyRound, UserCircle2 } from 'lucide-react';

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const ROLE_BG: Record<string, string> = {
  admin:    'bg-[#854F0B] text-[#f0883e]',
  employee: 'bg-[#185FA5] text-white',
};

export function StaffProfileClient({ currentUser }: { currentUser: User }) {
  const [isPending, startTransition] = useTransition();
  const [profileMsg, setProfileMsg]  = useState({ type: '', text: '' });
  const [pwMsg,      setPwMsg]       = useState({ type: '', text: '' });

  const [name,   setName]   = useState(currentUser.full_name);
  const [phone,  setPhone]  = useState(currentUser.phone ?? '');
  const [curPw,  setCurPw]  = useState('');
  const [newPw,  setNewPw]  = useState('');
  const [confPw, setConfPw] = useState('');

  async function saveProfile() {
    if (!name.trim()) return setProfileMsg({ type: 'error', text: 'Name is required.' });
    startTransition(async () => {
      const r = await updateMeAction({ full_name: name.trim(), phone: phone.trim() || undefined });
      if (r.ok) setProfileMsg({ type: 'success', text: 'Profile updated.' });
      else      setProfileMsg({ type: 'error',   text: r.error });
    });
  }

  async function changePassword() {
    if (newPw !== confPw) return setPwMsg({ type: 'error', text: "New passwords don't match." });
    if (newPw.length < 8) return setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
    if (!curPw)           return setPwMsg({ type: 'error', text: 'Current password is required.' });
    startTransition(async () => {
      const r = await changePasswordAction(curPw, newPw);
      if (r.ok) { setPwMsg({ type: 'success', text: 'Password changed successfully.' }); setCurPw(''); setNewPw(''); setConfPw(''); }
      else        setPwMsg({ type: 'error', text: r.error });
    });
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-[#161b22] border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <UserCircle2 size={16} className="text-[#f0883e]" />
          <div>
            <h1 className="text-sm font-semibold text-[#e6edf3]">My Profile</h1>
            <p className="text-[11px] text-[#484f58] mt-0.5">Manage your account details and password</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-lg mx-auto space-y-8">

          {/* Identity card */}
          <div className="flex items-center gap-4 bg-[#161b22] border border-white/[0.08] rounded-xl px-5 py-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-semibold flex-shrink-0 ${ROLE_BG[currentUser.role] ?? 'bg-[#21262d] text-[#8b949e]'}`}>
              {initials(currentUser.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#e6edf3]">{currentUser.full_name}</div>
              <div className="text-[12px] text-[#8b949e] mt-0.5">{currentUser.email}</div>
              <div className="mt-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>

          {/* Personal info */}
          <div>
            <h2 className="text-sm font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-[#f0883e] inline-block" />
              Personal Information
            </h2>

            {profileMsg.text && <Alert type={profileMsg.type as 'error' | 'success'} message={profileMsg.text} />}

            <div className="space-y-4">
              <div>
                <SectionLabel>Full Name</SectionLabel>
                <Input className="w-full" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <SectionLabel>Phone</SectionLabel>
                <Input className="w-full" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 …" />
              </div>
              <div>
                <SectionLabel>Email</SectionLabel>
                <Input className="w-full" value={currentUser.email} disabled />
                <p className="text-[11px] text-[#484f58] mt-1">Email cannot be changed here. Contact an admin if needed.</p>
              </div>
            </div>

            <Btn variant="primary" onClick={saveProfile} loading={isPending} className="mt-4">
              <Save size={13} /> Save Changes
            </Btn>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* Change password */}
          <div>
            <h2 className="text-sm font-semibold text-[#e6edf3] mb-4 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-[#f0883e] inline-block" />
              Change Password
            </h2>

            {pwMsg.text && <Alert type={pwMsg.type as 'error' | 'success'} message={pwMsg.text} />}

            <div className="space-y-4">
              <div>
                <SectionLabel>Current Password</SectionLabel>
                <Input className="w-full" type="password" value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="Current password" />
              </div>
              <div>
                <SectionLabel>New Password</SectionLabel>
                <Input className="w-full" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Minimum 8 characters" />
              </div>
              <div>
                <SectionLabel>Confirm New Password</SectionLabel>
                <Input className="w-full" type="password" value={confPw} onChange={e => setConfPw(e.target.value)} placeholder="Repeat new password" />
              </div>
            </div>

            <Btn variant="secondary" onClick={changePassword} loading={isPending} className="mt-4">
              <KeyRound size={13} /> Update Password
            </Btn>
          </div>

        </div>
      </div>
    </div>
  );
}
