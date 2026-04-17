'use client';
import { useEffect } from 'react';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'var(--canvas)', fontFamily:'var(--font-sans)', gap:16 }}>
      <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.5rem', fontWeight:700, color:'var(--text-primary)' }}>Something went wrong</div>
      <p style={{ color:'var(--text-muted)', fontSize:13, maxWidth:360, textAlign:'center' }}>{error.message}</p>
      <button onClick={reset} style={{ color:'var(--gold)', border:'1px solid var(--gold-border)', borderRadius:10, padding:'8px 20px', background:'transparent', cursor:'pointer', fontSize:13 }}>Try again</button>
    </div>
  );
}
