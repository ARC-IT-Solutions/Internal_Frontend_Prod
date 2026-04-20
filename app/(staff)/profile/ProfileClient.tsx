'use client';
import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import type { User } from '@/types';
import { Button, Input, Alert } from '@/components/ui';
import { updateMeAction, changePasswordAction } from '@/app/actions';
import { initials } from '@/lib/utils';

const RC: Record<string,{bg:string;color:string}> = { admin:{bg:'rgba(240,136,62,.2)',color:'#F0883E'}, employee:{bg:'rgba(56,139,253,.2)',color:'#388bfd'} };

export function ProfileClient({ currentUser }: { currentUser: User }) {
  const [isPend, startTrans] = useTransition();
  const [pm,  setPm]  = useState({type:'',text:''});
  const [pwm, setPwm] = useState({type:'',text:''});
  const [name,  setName]  = useState(currentUser.full_name);
  const [phone, setPhone] = useState(currentUser.phone??'');
  const [cur,  setCur]  = useState('');
  const [nw,   setNw]   = useState('');
  const [conf, setConf] = useState('');

  async function savePro() {
    if (!name.trim()) return setPm({type:'error',text:'Name required.'});
    startTrans(async () => { const r = await updateMeAction({full_name:name.trim(),phone:phone.trim()||undefined}); if(r.ok) setPm({type:'success',text:'Profile updated.'}); else setPm({type:'error',text:r.error}); });
  }
  async function changePw() {
    if (!cur) return setPwm({type:'error',text:'Current password required.'});
    if (nw!==conf) return setPwm({type:'error',text:"Passwords don't match."});
    if (nw.length<8) return setPwm({type:'error',text:'Minimum 8 characters.'});
    startTrans(async () => { const r = await changePasswordAction(cur,nw); if(r.ok){setPwm({type:'success',text:'Password changed.'});setCur('');setNw('');setConf('');}else setPwm({type:'error',text:r.error}); });
  }

  const rc = RC[currentUser.role]??{bg:'rgba(255,255,255,.1)',color:'var(--s-sub)'};

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', background:'var(--s-bg)' }}>
      <div style={{ flexShrink:0, padding:'12px 20px', borderBottom:'1px solid var(--s-border)', background:'var(--s-surface)' }}>
        <h1 style={{ fontSize:13, fontWeight:700, color:'var(--s-text)' }}>My Profile</h1>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'clamp(14px,3vw,24px)', scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,.06) transparent' }}>
        <div style={{ maxWidth:480, display:'flex', flexDirection:'column', gap:28 }}>

          {/* Identity */}
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
            style={{ display:'flex', alignItems:'center', gap:16, padding:'18px 20px', borderRadius:14, background:'var(--s-raised)', border:'1px solid var(--s-border)' }}>
            <div style={{ width:48, height:48, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, flexShrink:0, background:rc.bg, color:rc.color }}>{initials(currentUser.full_name)}</div>
            <div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--s-text)', marginBottom:3 }}>{currentUser.full_name}</div>
              <div style={{ fontSize:12, color:'var(--s-sub)', marginBottom:5 }}>{currentUser.email}</div>
              <span style={{ fontSize:9, fontFamily:'var(--font-mono)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', padding:'2px 8px', borderRadius:4, background:rc.bg, color:rc.color }}>{currentUser.role}</span>
            </div>
          </motion.div>

          {/* Personal info */}
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.05}}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--s-dim)', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:3, height:14, borderRadius:2, background:'#F0883E', display:'inline-block' }}/>
              Personal Information
            </div>
            {pm.text&&<Alert type={pm.type as 'error'|'success'} message={pm.text}/>}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <Input label="Full Name" value={name} onChange={e=>setName(e.target.value)}/>
              <Input label="Phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/>
              <Input label="Email" value={currentUser.email} disabled style={{ opacity:0.5 }}/>
            </div>
            <Button variant="primary" onClick={savePro} loading={isPend} style={{ marginTop:12 }}>Save Changes</Button>
          </motion.div>

          <div style={{ height:1, background:'rgba(255,255,255,0.06)' }}/>

          {/* Password */}
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.1}}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--s-dim)', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:3, height:14, borderRadius:2, background:'#F0883E', display:'inline-block' }}/>
              Change Password
            </div>
            {pwm.text&&<Alert type={pwm.type as 'error'|'success'} message={pwm.text}/>}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <Input label="Current Password" type="password" value={cur} onChange={e=>setCur(e.target.value)}/>
              <Input label="New Password" type="password" value={nw} onChange={e=>setNw(e.target.value)} placeholder="Min 8 chars"/>
              <Input label="Confirm New Password" type="password" value={conf} onChange={e=>setConf(e.target.value)}/>
            </div>
            <Button variant="secondary" onClick={changePw} loading={isPend} style={{ marginTop:12 }}>Update Password</Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
