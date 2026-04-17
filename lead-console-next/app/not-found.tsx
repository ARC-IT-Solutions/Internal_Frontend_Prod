import Link from 'next/link';
export default function NotFound() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'var(--canvas)', fontFamily:'var(--font-sans)', gap:20 }}>
      <div style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:'5rem', fontWeight:700, color:'var(--gold)', lineHeight:1 }}>404</div>
      <p style={{ color:'var(--text-secondary)', fontSize:16 }}>This page does not exist.</p>
      <Link href="/" style={{ color:'var(--gold)', textDecoration:'underline', textUnderlineOffset:4 }}>← Back to dashboard</Link>
    </div>
  );
}
