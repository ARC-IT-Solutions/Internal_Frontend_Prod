'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import type { User } from '@/types';
import { ArcButton, ArcCard, ArcInput, ArcAlert, ArcPageHeader } from '@/components/ui/ArcUI';
import { updateMeAction, changePasswordAction } from '@/app/actions';
import { initials } from '@/lib/utils';

export function ClientProfileView({ user }: { user: User }) {
  const [isPend, startTrans] = useTransition();
  const [pm,  setPm]  = useState({type:'',text:''});
  const [pwm, setPwm] = useState({type:'',text:''});
  const [name,  setName]  = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone??'');
  const [cur,  setCur]  = useState('');
  const [nw,   setNw]   = useState('');
  const [conf, setConf] = useState('');

  async function savePro() {
    if (!name.trim()) return setPm({type:'error',text:'Name required.'});
    startTrans(async () => { const r = await updateMeAction({full_name:name.trim(),phone:phone.trim()||undefined}); if(r.ok) setPm({type:'success',text:'Profile updated successfully.'}); else setPm({type:'error',text:r.error}); });
  }
  async function changePw() {
    if (!cur)           return setPwm({type:'error',text:'Current password required.'});
    if (nw!==conf)      return setPwm({type:'error',text:"Passwords don't match."});
    if (nw.length<8)    return setPwm({type:'error',text:'Minimum 8 characters.'});
    startTrans(async () => { const r = await changePasswordAction(cur,nw); if(r.ok){setPwm({type:'success',text:'Password changed.'});setCur('');setNw('');setConf('');}else setPwm({type:'error',text:r.error}); });
  }



  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <ArcPageHeader eyebrow="ARC IT Solutions" title="Your" italic="Profile" sub="Manage your account details and security settings." />

      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(201,168,76,.12) transparent' }}>
        <motion.div style={{ maxWidth:520, margin:"0 auto", padding:"28px 24px", display:"flex", flexDirection:"column", gap:24 }} >

          {/* Identity card */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.4,ease:[0.22,1,0.36,1]}}>
            <ArcCard>
              <div style={{ display:'flex', alignItems:'center', gap:18 }}>
                <motion.div whileHover={{ scale:1.06 }}
                  style={{ width:60, height:60, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontFamily:'var(--font-serif)', fontWeight:700, flexShrink:0, background:'rgba(201,168,76,.15)', color:'var(--c-gold)' }}>
                  {initials(user.full_name)}
                </motion.div>
                <div>
                  <h2 style={{ fontFamily:'var(--font-serif)', fontWeight:600, fontSize:'1.1rem', color:'var(--c-cream)', marginBottom:4 }}>{user.full_name}</h2>
                  <p style={{ fontSize:13, color:'var(--c-sub)', marginBottom:6 }}>{user.email}</p>
                  <span style={{ fontSize:9, fontFamily:'var(--font-mono)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', padding:'2px 8px', borderRadius:4, background:'rgba(201,168,76,.12)', color:'var(--c-gold)' }}>Client</span>
                </div>
              </div>
            </ArcCard>
          </motion.div>

          {/* Gold divider */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.4,ease:[0.22,1,0.36,1]}} style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,.25) 30%,rgba(201,168,76,.25) 70%,transparent)' }}/>

          {/* Personal info */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.4,ease:[0.22,1,0.36,1]}}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:3, height:16, borderRadius:2, background:'var(--c-gold)', flexShrink:0 }}/>
              <h3 style={{ fontFamily:'var(--font-serif)', fontWeight:600, color:'var(--c-cream)', fontSize:'0.95rem' }}>Personal Information</h3>
            </div>
            {pm.text&&<ArcAlert type={pm.type as 'error'|'success'} message={pm.text}/>}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <ArcInput label="Full Name" value={name} onChange={e=>setName(e.target.value)}/>
              <ArcInput label="Phone Number" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91…"/>
              <div>
                <ArcInput label="Email Address" value={user.email} disabled style={{ opacity:0.5, cursor:'not-allowed' }}/>
                <p style={{ fontSize:11, color:'var(--c-dim)', marginTop:5, fontStyle:'italic' }}>Email cannot be changed. Contact your project manager if needed.</p>
              </div>
            </div>
            <ArcButton variant="gold" onClick={savePro} loading={isPend} size="md" style={{ marginTop:16 }}>Save Changes</ArcButton>
          </motion.div>

          {/* Divider */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.4,ease:[0.22,1,0.36,1]}} style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,.25) 30%,rgba(201,168,76,.25) 70%,transparent)' }}/>

          {/* Password */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.4,ease:[0.22,1,0.36,1]}}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:3, height:16, borderRadius:2, background:'var(--c-gold)', flexShrink:0 }}/>
              <h3 style={{ fontFamily:'var(--font-serif)', fontWeight:600, color:'var(--c-cream)', fontSize:'0.95rem' }}>Change Password</h3>
            </div>
            {pwm.text&&<ArcAlert type={pwm.type as 'error'|'success'} message={pwm.text}/>}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <ArcInput label="Current Password" type="password" value={cur} onChange={e=>setCur(e.target.value)} placeholder="Your current password"/>
              <ArcInput label="New Password" type="password" value={nw} onChange={e=>setNw(e.target.value)} placeholder="At least 8 characters"/>
              <ArcInput label="Confirm New Password" type="password" value={conf} onChange={e=>setConf(e.target.value)} placeholder="Repeat new password"/>
            </div>
            <ArcButton variant="outline" onClick={changePw} loading={isPend} size="md" style={{ marginTop:16 }}>Update Password</ArcButton>
          </motion.div>

          {/* Footer */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.4,ease:[0.22,1,0.36,1]}} style={{ textAlign:'center', paddingBottom:8 }}>
            <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,.25) 30%,rgba(201,168,76,.25) 70%,transparent)', marginBottom:16 }}/>
            <p style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:12, color:'var(--c-muted)' }}>ARC IT Solutions — crafting software and design that endures.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
