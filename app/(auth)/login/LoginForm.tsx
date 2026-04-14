'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions';

function EyeIcon({ open }: { open: boolean }) {
  return open
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}

function Spinner() {
  return (
    <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid rgba(11,9,7,0.2)', borderTopColor:'#0B0907', animation:'spin 0.7s linear infinite', flexShrink:0 }} />
  );
}

function validate(email: string, password: string) {
  const errs: { email?: string; password?: string } = {};
  if (!email.trim()) errs.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
  if (!password) errs.password = 'Password is required';
  else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
  return errs;
}

export function LoginForm({ initialError }: { initialError: string }) {
  const router = useRouter();
  const emailRef    = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [apiError,  setApiError]  = useState(initialError);
  const [fieldErrs, setFieldErrs] = useState<{ email?: string; password?: string }>({});
  const [touched,   setTouched]   = useState<{ email?: boolean; password?: boolean }>({});

  function handleBlur(field: 'email' | 'password') {
    setTouched(t => ({ ...t, [field]: true }));
    setFieldErrs(validate(email, password));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(email, password);
    setFieldErrs(errs);
    setTouched({ email: true, password: true });
    if (Object.keys(errs).length) return;

    setLoading(true);
    setApiError('');
    const result = await loginAction(email.trim(), password);
    setLoading(false);

    if (!result.ok) {
      setApiError(result.error);
      setPassword('');
      passwordRef.current?.focus();
      return;
    }

    const { role } = result.data as { role: string };
    router.push(role === 'client' ? '/client' : '/');
  }

  const showEmailErr    = touched.email    && fieldErrs.email;
  const showPasswordErr = touched.password && fieldErrs.password;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .login-fade { animation: fadeIn 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .login-fade-2 { animation: fadeIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.12s both; }
        .login-fade-3 { animation: fadeIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.22s both; }
        input[type=password]::-ms-reveal,
        input[type=password]::-ms-clear { display: none; }
      `}</style>

      <div style={{ minHeight:'100vh', display:'flex', background:'var(--canvas)', fontFamily:'var(--font-sans)' }}>

        {/* ── LEFT — Brand panel ─────────────────────────────── */}
        <div
          className="hidden lg:flex flex-col"
          style={{
            width: 480,
            flexShrink: 0,
            background: 'var(--canvas-r)',
            borderRight: '1px solid var(--gold-border)',
            padding: '56px 52px',
            position: 'relative',
            overflow: 'hidden',
          }}>

          {/* Grid texture */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:'linear-gradient(rgba(201,168,76,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,.04) 1px, transparent 1px)',
            backgroundSize:'48px 48px',
          }} />

          {/* Ambient glow */}
          <div style={{ position:'absolute', bottom:-120, left:-120, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,.06) 0%, transparent 65%)', pointerEvents:'none' }} />

          {/* Top: logo */}
          <div style={{ position:'relative', zIndex:1, marginBottom:72 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-serif)', fontWeight:700, fontSize:18, color:'var(--canvas)', flexShrink:0 }}>
                A
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-serif)', fontWeight:700, fontSize:16, color:'var(--text-primary)', letterSpacing:'-.01em' }}>
                  ARC IT Solutions
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--text-muted)', marginTop:2 }}>
                  Est. 2012
                </div>
              </div>
            </div>
          </div>

          {/* Hero copy */}
          <div style={{ position:'relative', zIndex:1, flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--text-muted)' }}>
                Software & Design
              </span>
              <div style={{ height:1, width:40, background:'var(--gold)', opacity:.35 }} />
            </div>

            <h1 style={{
              fontFamily:'var(--font-serif)',
              fontWeight:700,
              fontSize:'2.75rem',
              lineHeight:1.1,
              letterSpacing:'-.02em',
              color:'var(--text-primary)',
              marginBottom:24,
            }}>
              We craft<br />
              software{' '}
              <em style={{ color:'var(--gold)', fontStyle:'italic' }}>and design</em>
              <br />that endures.
            </h1>

            <p style={{ fontSize:14, lineHeight:1.7, color:'var(--text-secondary)', marginBottom:48, maxWidth:'34ch' }}>
              Access your project dashboard, invoices, support tickets, and onboarding — all in one place.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { dot:'#4D9E6E', text:'Real-time project progress' },
                { dot:'var(--gold)', text:'Invoice & billing management' },
                { dot:'#4A7EC0', text:'Direct support ticketing' },
                { dot:'var(--gold-light)', text:'Structured client onboarding' },
              ].map(({ dot, text }) => (
                <div key={text} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:dot, flexShrink:0 }} />
                  <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ position:'relative', zIndex:1 }}>
            <div className="divider-gold" style={{ marginBottom:16 }} />
            <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-dim)' }}>
              arcit.in — internal portal
            </span>
          </div>
        </div>

        {/* ── RIGHT — Form panel ─────────────────────────────── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 24px' }}>

          {/* Mobile logo */}
          <div className="lg:hidden login-fade" style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-serif)', fontWeight:700, fontSize:15, color:'var(--canvas)' }}>A</div>
            <span style={{ fontFamily:'var(--font-serif)', fontWeight:600, fontSize:15, color:'var(--text-primary)' }}>ARC IT Solutions</span>
          </div>

          <div style={{ width:'100%', maxWidth:380 }}>

            {/* Heading */}
            <div className="login-fade" style={{ marginBottom:36 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--text-muted)' }}>Sign In</span>
                <div style={{ height:1, width:32, background:'var(--gold)', opacity:.35 }} />
              </div>
              <h2 style={{ fontFamily:'var(--font-serif)', fontWeight:700, fontSize:'1.75rem', letterSpacing:'-.02em', color:'var(--text-primary)', lineHeight:1.15 }}>
                Welcome back.
              </h2>
              <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:8 }}>
                Staff and clients share this entry point.
              </p>
            </div>

            {/* API error */}
            {apiError && (
              <div className="login-fade animate-scale-in" style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px', borderRadius:12, marginBottom:24, background:'rgba(192,80,80,.09)', border:'1px solid rgba(192,80,80,.25)', color:'#C05050', fontSize:13 }}>
                <span style={{ flexShrink:0, marginTop:1 }}>⚠</span>
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-fade-2" style={{ display:'flex', flexDirection:'column', gap:20 }} noValidate>

              {/* Email */}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color: showEmailErr ? '#C05050' : 'var(--text-muted)' }}>
                  Email Address
                </label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (touched.email) setFieldErrs(validate(e.target.value, password)); }}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@company.com"
                  autoComplete="email"
                  autoFocus
                  style={{
                    height:48, padding:'0 16px',
                    background:'var(--canvas-card)',
                    border:`1px solid ${showEmailErr ? 'rgba(192,80,80,.5)' : 'var(--gold-border)'}`,
                    borderRadius:12, color:'var(--text-primary)',
                    fontFamily:'var(--font-sans)', fontSize:14,
                    outline:'none', width:'100%',
                    transition:'all 0.15s ease',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor='rgba(201,168,76,.4)'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(201,168,76,.08)'; }}
                  onBlurCapture={e => { e.currentTarget.style.borderColor=showEmailErr?'rgba(192,80,80,.5)':'var(--gold-border)'; e.currentTarget.style.boxShadow='none'; }}
                />
                {showEmailErr && <span style={{ fontSize:11, color:'#C05050' }}>{fieldErrs.email}</span>}
              </div>

              {/* Password */}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color: showPasswordErr ? '#C05050' : 'var(--text-muted)' }}>
                  Password
                </label>
                <div style={{ position:'relative' }}>
                  <input
                    ref={passwordRef}
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (touched.password) setFieldErrs(validate(email, e.target.value)); }}
                    onBlur={() => handleBlur('password')}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{
                      height:48, padding:'0 48px 0 16px',
                      background:'var(--canvas-card)',
                      border:`1px solid ${showPasswordErr ? 'rgba(192,80,80,.5)' : 'var(--gold-border)'}`,
                      borderRadius:12, color:'var(--text-primary)',
                      fontFamily:'var(--font-sans)', fontSize:14,
                      outline:'none', width:'100%',
                      transition:'all 0.15s ease',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor='rgba(201,168,76,.4)'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(201,168,76,.08)'; }}
                    onBlurCapture={e => { e.currentTarget.style.borderColor=showPasswordErr?'rgba(192,80,80,.5)':'var(--gold-border)'; e.currentTarget.style.boxShadow='none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:4 }}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
                {showPasswordErr && <span style={{ fontSize:11, color:'#C05050' }}>{fieldErrs.password}</span>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  height:50, borderRadius:13,
                  background: loading ? 'rgba(201,168,76,.7)' : 'var(--gold)',
                  color:'#0B0907', border:'none',
                  fontFamily:'var(--font-sans)', fontWeight:700, fontSize:14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                  transition:'all 0.2s ease',
                  marginTop:4,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background='var(--gold-light)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = loading ? 'rgba(201,168,76,.7)' : 'var(--gold)'; }}>
                {loading ? <><Spinner /> Signing in…</> : 'Sign in →'}
              </button>
            </form>

            <p className="login-fade-3" style={{ textAlign:'center', fontSize:12, marginTop:28, fontFamily:'var(--font-serif)', fontStyle:'italic', color:'var(--text-dim)' }}>
              Forgot your password? Contact your project manager.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
