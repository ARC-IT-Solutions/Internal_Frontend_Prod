'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { User, Paginated } from '@/types';
import { Badge, Button, Input, Select, Alert, Modal, EmptyState } from '@/components/ui';
import { PageShell, ListHeader, EmptyDetail, DetailHeader, DetailBody, Section } from '@/components/modules/PageShell';
import { initials, fullDate } from '@/lib/utils';
import { registerUserAction, updateUserAction } from '@/app/actions';

const ROLES = ['admin','employee','client'] as const;
const RC: Record<string,{bg:string;color:string}> = { admin:{bg:'rgba(240,136,62,.18)',color:'#F0883E'}, employee:{bg:'rgba(56,139,253,.18)',color:'#388bfd'}, client:{bg:'rgba(63,185,80,.18)',color:'#3fb950'} };

export function UsersClient({ users, currentUser }: { users: Paginated<User>; currentUser: User }) {
  const router = useRouter();
  const [sel, setSel]        = useState<User|null>(null);
  const [isPend, startTrans] = useTransition();
  const [err, setErr]        = useState('');
  const [ok,  setOk]         = useState('');
  const [showReg, setShowReg]= useState(false);
  const [rf, setRf] = useState({ full_name:'', email:'', phone:'', password:'', role:'client' });
  const notify = (m:string,t:'ok'|'err') => { t==='ok'?(setOk(m),setErr('')):(setErr(m),setOk('')); setTimeout(()=>{setOk('');setErr('');},6000); };

  async function doReg() {
    if (!rf.full_name||!rf.email||!rf.password) return setErr('Name, email and password required.');
    startTrans(async () => { const r = await registerUserAction({...rf,phone:rf.phone||undefined}); if(r.ok){notify(`Created! ID: ${(r.data as User).id}`,'ok');setShowReg(false);setRf({full_name:'',email:'',phone:'',password:'',role:'client'});router.refresh();}else notify(r.error,'err'); });
  }
  async function update(field:string,value:unknown) {
    if (!sel) return;
    startTrans(async () => { const r = await updateUserAction(sel.id,{[field]:value}); if(r.ok){setSel(r.data as User);notify('Updated.','ok');router.refresh();}else notify(r.error,'err'); });
  }

  return (
    <>
      <PageShell
        list={
          <>
            <ListHeader title="Users" count={users.total}
              actions={<button onClick={()=>setShowReg(true)} style={{ width:28, height:28, borderRadius:7, border:'1px solid rgba(255,255,255,.1)', background:'transparent', cursor:'pointer', color:'#F0883E', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>}
            />
            <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,.06) transparent' }}>
              {users.items.length===0&&<EmptyState title="No users"/>}
              {users.items.map((u,i) => {
                const active = sel?.id===u.id;
                const rc = RC[u.role]??{bg:'rgba(255,255,255,.1)',color:'var(--s-sub)'};
                return (
                  <motion.button key={u.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*0.02}}
                    onClick={()=>setSel(u)} style={{ width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', border:'none', borderBottom:'1px solid rgba(255,255,255,0.04)', background:active?'rgba(255,255,255,0.04)':'transparent', cursor:'pointer' }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, background:rc.bg, color:rc.color }}>{initials(u.full_name)}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:active?500:400, color:active?'var(--s-text)':'var(--s-sub)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.full_name}</div>
                      <div style={{ fontSize:11, color:'var(--s-dim)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                      <div style={{ display:'flex', gap:5, marginTop:3 }}>
                        <span style={{ fontSize:9, fontFamily:'var(--font-mono)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:rc.color }}>{u.role}</span>
                        {!u.is_active&&<span style={{ fontSize:9, fontFamily:'var(--font-mono)', color:'#f85149', textTransform:'uppercase' }}>inactive</span>}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </>
        }
        detail={
          !sel ? <EmptyDetail text="Select a user"/> : (
            <>
              <DetailHeader
                title={sel.full_name} sub={sel.email}
                badges={<span style={{ fontSize:9, fontFamily:'var(--font-mono)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', padding:'2px 8px', borderRadius:4, background:(RC[sel.role]??{bg:'rgba(255,255,255,.1)'}).bg, color:(RC[sel.role]??{color:'var(--s-sub)'}).color }}>{sel.role}</span>}
              />
              <DetailBody>
                {(err||ok)&&<Alert type={err?'error':'success'} message={err||ok}/>}
                <Section label="Account Info">
                  <table style={{ width:'100%', borderCollapse:'collapse' }}><tbody>
                    {[['ID',sel.id],['Phone',sel.phone??'—'],['Active',sel.is_active?'Yes':'No'],['Verified',sel.is_verified?'Yes':'No'],['Created',fullDate(sel.created_at)]].map(([l,v])=>(
                      <tr key={l} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding:'7px 12px 7px 0', fontSize:11, color:'var(--s-dim)', width:80 }}>{l}</td>
                        <td style={{ padding:'7px 0', fontSize:11, fontFamily:'var(--font-mono)', color:'var(--s-text)', wordBreak:'break-all' }}>{v as string}</td>
                      </tr>
                    ))}
                  </tbody></table>
                </Section>
                <Section label="Manage">
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                    <Select label="Role" value={sel.role} onChange={e=>update('role',e.target.value)} style={{ width:'100%' }} disabled={isPend}>{ROLES.map(r=><option key={r} value={r}>{r}</option>)}</Select>
                    <Select label="Active" value={String(sel.is_active)} onChange={e=>update('is_active',e.target.value==='true')} style={{ width:'100%' }} disabled={isPend}><option value="true">Active</option><option value="false">Inactive</option></Select>
                    <Select label="Verified" value={String(sel.is_verified)} onChange={e=>update('is_verified',e.target.value==='true')} style={{ width:'100%' }} disabled={isPend}><option value="true">Verified</option><option value="false">Unverified</option></Select>
                  </div>
                  <p style={{ fontSize:10, color:'var(--s-dim)', marginTop:6 }}>Changes save immediately on selection.</p>
                </Section>
              </DetailBody>
            </>
          )
        }
      />
      {showReg&&(
        <Modal title="Register New User" sub="Client accounts get access to the client portal" onClose={()=>setShowReg(false)}>
          {err&&<Alert type="error" message={err}/>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Input label="Full Name *" value={rf.full_name} onChange={e=>setRf({...rf,full_name:e.target.value})}/>
            <Input label="Email *" type="email" value={rf.email} onChange={e=>setRf({...rf,email:e.target.value})}/>
            <Input label="Phone" type="tel" value={rf.phone} onChange={e=>setRf({...rf,phone:e.target.value})}/>
            <Input label="Password *" type="password" placeholder="Min 8 chars" value={rf.password} onChange={e=>setRf({...rf,password:e.target.value})}/>
            <Select label="Role" value={rf.role} onChange={e=>setRf({...rf,role:e.target.value})} style={{ width:'100%' }}>
              <option value="client">Client — portal access</option>
              <option value="employee">Employee — console access</option>
              <option value="admin">Admin — full access</option>
            </Select>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}><Button variant="primary" onClick={doReg} loading={isPend} style={{ flex:1, justifyContent:'center' }}>Create Account</Button><Button variant="ghost" onClick={()=>setShowReg(false)}>Cancel</Button></div>
        </Modal>
      )}
    </>
  );
}
