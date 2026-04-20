'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { AuditLog, Paginated } from '@/types';
import { Select } from '@/components/ui';
import { relTime } from '@/lib/utils';

const AC: Record<string,{bg:string;color:string}> = {
  CREATE:        {bg:'rgba(63,185,80,.1)',   color:'#3fb950'},
  DELETE:        {bg:'rgba(248,81,73,.1)',   color:'#f85149'},
  LOGIN_FAILED:  {bg:'rgba(248,81,73,.1)',   color:'#f85149'},
  UPDATE:        {bg:'rgba(56,139,253,.1)',  color:'#388bfd'},
  STATUS_CHANGE: {bg:'rgba(56,139,253,.1)',  color:'#388bfd'},
  ASSIGN:        {bg:'rgba(56,139,253,.1)',  color:'#388bfd'},
  LOGIN:         {bg:'rgba(240,136,62,.1)',  color:'#F0883E'},
  LOGOUT:        {bg:'rgba(72,79,88,.12)',   color:'#6e7681'},
  FILE_UPLOAD:   {bg:'rgba(163,113,247,.1)', color:'#a371f7'},
  FILE_DOWNLOAD: {bg:'rgba(163,113,247,.1)', color:'#a371f7'},
  PASSWORD_CHANGE:{bg:'rgba(240,136,62,.1)', color:'#F0883E'},
};

export function AuditClient({ logs }: { logs: Paginated<AuditLog> }) {
  const router = useRouter();
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');

  function apply() {
    const p = new URLSearchParams();
    if (action) p.set('action', action);
    if (entity) p.set('entity_type', entity);
    router.push(`/audit?${p}`);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', background:'var(--s-bg)' }}>
      <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid var(--s-border)', background:'var(--s-surface)', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:13, fontWeight:700, color:'var(--s-text)' }}>Audit Logs</h1>
          <p style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--s-dim)', marginTop:1 }}>{logs.total.toLocaleString()} total records</p>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <Select value={action} onChange={e=>setAction(e.target.value)} style={{ width:'auto', height:30, padding:'0 8px', fontSize:11 }}>
            <option value="">All Actions</option>
            {['CREATE','UPDATE','DELETE','STATUS_CHANGE','ASSIGN','LOGIN','LOGOUT','LOGIN_FAILED','FILE_UPLOAD','FILE_DOWNLOAD','PASSWORD_CHANGE'].map(a=><option key={a} value={a}>{a}</option>)}
          </Select>
          <Select value={entity} onChange={e=>setEntity(e.target.value)} style={{ width:'auto', height:30, padding:'0 8px', fontSize:11 }}>
            <option value="">All Entities</option>
            {['user','project','inquiry','ticket','invoice','auth'].map(e=><option key={e} value={e}>{e}</option>)}
          </Select>
          <button onClick={apply} style={{ height:30, padding:'0 12px', borderRadius:7, border:'1px solid rgba(255,255,255,.1)', background:'transparent', cursor:'pointer', color:'var(--s-sub)', fontSize:12 }}>Apply</button>
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,.06) transparent' }}>
        {logs.items.length===0&&<p style={{ textAlign:'center', padding:64, fontSize:13, color:'var(--s-dim)' }}>No audit logs found.</p>}
        {logs.items.map((log,i) => {
          const ac = AC[log.action]??{bg:'rgba(72,79,88,.12)',color:'#6e7681'};
          return (
            <motion.div key={log.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.01}}
              style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.03)', flexWrap:'wrap' }}>
              <div style={{ width:100, flexShrink:0, paddingTop:1, minWidth:80 }}>
                <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, fontFamily:'var(--font-mono)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', background:ac.bg, color:ac.color }}>{log.action.replace('_',' ')}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, color:'var(--s-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>{log.description??'—'}</p>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <span style={{ fontSize:10, color:'var(--s-dim)', fontFamily:'var(--font-mono)' }}>{log.entity_type}</span>
                  {log.entity_id&&<span style={{ fontSize:10, color:'rgba(72,79,88,0.6)', fontFamily:'var(--font-mono)' }}>{log.entity_id.slice(0,14)}…</span>}
                  {log.ip_address&&<span style={{ fontSize:10, color:'rgba(72,79,88,0.6)', fontFamily:'var(--font-mono)' }}>{log.ip_address}</span>}
                </div>
              </div>
              <div style={{ flexShrink:0 }}>
                <p style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--s-dim)', textAlign:'right' }}>{relTime(log.timestamp)}</p>
              </div>
            </motion.div>
          );
        })}
        {logs.total_pages>1&&(
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, padding:20 }}>
            {logs.page>1&&<button onClick={()=>router.push(`/audit?page=${logs.page-1}`)} style={{ padding:'6px 14px', borderRadius:7, border:'1px solid rgba(255,255,255,.1)', background:'transparent', cursor:'pointer', color:'var(--s-sub)', fontSize:12 }}>← Previous</button>}
            <span style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--s-dim)' }}>Page {logs.page} / {logs.total_pages}</span>
            {logs.page<logs.total_pages&&<button onClick={()=>router.push(`/audit?page=${logs.page+1}`)} style={{ padding:'6px 14px', borderRadius:7, border:'1px solid rgba(255,255,255,.1)', background:'transparent', cursor:'pointer', color:'var(--s-sub)', fontSize:12 }}>Next →</button>}
          </div>
        )}
      </div>
    </div>
  );
}
