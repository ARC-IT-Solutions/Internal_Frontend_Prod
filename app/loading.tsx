export default function Loading() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--canvas)' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'2px solid rgba(201,168,76,.2)', borderTopColor:'var(--gold)', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
