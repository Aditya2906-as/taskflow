import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: '✨', title: 'AI Project Generator', desc: 'Describe your idea — AI builds a full board with tasks and due dates instantly.' },
  { icon: '📋', title: 'Kanban Boards',        desc: 'Drag-and-drop tasks across columns. Real-time sync with your whole team.' },
  { icon: '📚', title: 'Project Wiki',          desc: 'Keep notes, docs, FAQs and guidelines organised inside every project.' },
  { icon: '💬', title: 'Team Chat',             desc: 'Chat with teammates right inside the board. No context switching.' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(form.email, form.password); }
    catch (err) { setError(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="lp-root">
      <style>{`
        /* ── Root layout ── */
        .lp-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg);
        }

        /* ── Left branding panel ── */
        .lp-left {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 48px;
          background: var(--bg2);
          border-right: 1px solid var(--border);
          overflow: hidden;
          min-height: 100vh;
        }

        /* ── Right form panel ── */
        .lp-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
          position: relative;
          min-height: 100vh;
          overflow-y: auto;
        }

        /* Feature cards */
        .lp-feat {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 11px 13px;
          border-radius: 10px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border);
          transition: border-color 0.2s, background 0.2s;
        }
        .lp-feat:hover {
          border-color: var(--border2);
          background: rgba(255,255,255,0.04);
        }

        /* Register button */
        .lp-reg-btn {
          width: 100%;
          padding: 11px;
          border-radius: 10px;
          border: 1px solid var(--border2);
          background: transparent;
          color: var(--text2);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-decoration: none;
          font-family: var(--font);
        }
        .lp-reg-btn:hover {
          background: var(--bg3);
          color: var(--text);
          border-color: var(--accent);
        }

        /* Show/hide password */
        .lp-eye {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text3); padding: 4px;
          display: flex; align-items: center;
          transition: color 0.15s;
        }
        .lp-eye:hover { color: var(--text2); }

        /* Decorative orbs */
        .lp-orb-1 {
          position: absolute; top: -120px; right: -120px;
          width: 380px; height: 380px; border-radius: 50%;
          background: radial-gradient(circle, rgba(91,141,239,0.16) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-orb-2 {
          position: absolute; bottom: -80px; left: -80px;
          width: 260px; height: 260px; border-radius: 50%;
          background: radial-gradient(circle, rgba(167,139,250,0.13) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-orb-3 {
          position: absolute; top: -60px; right: -60px;
          width: 220px; height: 220px; border-radius: 50%;
          background: radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Mobile logo (shown only on mobile/tablet) */
        .lp-mobile-logo { display: none; }

        /* ── TABLET (769px – 1024px): stack but keep branding ── */
        @media (max-width: 1024px) and (min-width: 769px) {
          .lp-root {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
          }
          .lp-left {
            min-height: unset;
            padding: 28px 32px;
            justify-content: flex-start;
            gap: 20px;
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          /* Hide feature cards and bottom badge on tablet, keep logo + hero text */
          .lp-feat-list { display: none; }
          .lp-bottom-badge { display: none; }
          .lp-hero-desc { display: none; }
          .lp-hero h1 { font-size: 26px; margin-bottom: 0; }
          .lp-right {
            min-height: unset;
            padding: 32px 32px 40px;
            justify-content: flex-start;
          }
          .lp-mobile-logo { display: none; }
        }

        /* ── MOBILE (≤ 768px): single column, hide left panel ── */
        @media (max-width: 768px) {
          .lp-root {
            grid-template-columns: 1fr;
          }
          .lp-left {
            display: none;
          }
          .lp-right {
            min-height: 100vh;
            padding: 32px 20px 40px;
            justify-content: flex-start;
            align-items: stretch;
          }
          .lp-mobile-logo {
            display: flex;
            align-items: center;
            gap: 9px;
            margin-bottom: 32px;
          }
          .lp-form-wrap {
            width: 100% !important;
            max-width: 100% !important;
          }
        }

        /* ── Small mobile (≤ 400px) ── */
        @media (max-width: 400px) {
          .lp-right { padding: 24px 16px 32px; }
        }
      `}</style>

      {/* ══ LEFT — Branding ══ */}
      <div className="lp-left">
        <div className="lp-orb-1" />
        <div className="lp-orb-2" />

        {/* Grid texture */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%',
          opacity:0.03, pointerEvents:'none' }}>
          <defs>
            <pattern id="lpgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dce3f5" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lpgrid)" />
        </svg>

        {/* Logo */}
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Logo — left panel */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="40" height="40" viewBox="0 0 36 36" fill="none"
                  xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                  <rect width="36" height="36" rx="9" fill="#1c2235"/>
                  <rect x="5"  y="7" width="6" height="16" rx="2" fill="#5b8def"/>
                  <rect x="13" y="7" width="6" height="11" rx="2" fill="#a78bfa"/>
                  <rect x="21" y="7" width="6" height="7"  rx="2" fill="#34d399"/>
                  <path d="M6 28 L27 28" stroke="#5b8def" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M23.5 24.5 L27 28 L23.5 31.5" stroke="#5b8def" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
                <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>
                  TaskFlow
                </span>
              </div>
            </div>
            <span style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.3px' }}>
              TaskFlow
            </span>
          </div>
        </div>

        {/* Hero text */}
        <div className="lp-hero" style={{ position:'relative', zIndex:1 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'3px 11px', borderRadius:20,
            background:'rgba(91,141,239,0.1)',
            border:'1px solid rgba(91,141,239,0.22)',
            marginBottom:16,
          }}>
            <span style={{ fontSize:10, color:'var(--accent)', fontWeight:600,
              letterSpacing:'0.07em', textTransform:'uppercase' }}>
              ✦ AI-Powered Project Management
            </span>
          </div>

          <h1 style={{
            fontSize:34, fontWeight:800, lineHeight:1.15,
            letterSpacing:'-0.8px', marginBottom:12,
            background:'linear-gradient(145deg, var(--text) 50%, var(--text2) 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>
            Ship projects<br />faster, together.
          </h1>

          <p className="lp-hero-desc" style={{
            fontSize:13, color:'var(--text2)', lineHeight:1.75,
            maxWidth:340, marginBottom:28,
          }}>
            TaskFlow combines AI-powered planning, real-time collaboration,
            and intuitive kanban boards — so your team always knows what's next.
          </p>

          <div className="lp-feat-list" style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feat">
                <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:1 }}>{f.title}</div>
                  <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="lp-bottom-badge" style={{ position:'relative', zIndex:1 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'9px 13px', borderRadius:8,
            background:'rgba(52,211,153,0.06)',
            border:'1px solid rgba(52,211,153,0.18)',
          }}>
            <div style={{ width:6, height:6, borderRadius:'50%',
              background:'var(--green)', flexShrink:0 }} />
            <span style={{ fontSize:11, color:'var(--text2)' }}>
              Free to use · No credit card required · Deploy anywhere
            </span>
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Form ══ */}
      <div className="lp-right">
        <div className="lp-orb-3" />

        <div className="lp-form-wrap" style={{
          width:'100%', maxWidth:380,
          position:'relative', zIndex:1,
        }}>

          {/* Mobile-only logo */}
          <div className="lp-mobile-logo">
            <div style={{
              width:32, height:32, borderRadius:9,
              background:'linear-gradient(135deg, var(--accent), var(--purple))',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:16, fontWeight:800, color:'#fff',
              flexShrink:0,
            }}>T</div>
            <span style={{ fontSize:18, fontWeight:700 }}>TaskFlow</span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom:24 }}>
            <h2 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.4px', marginBottom:4 }}>
              Welcome back
            </h2>
            <p style={{ fontSize:13, color:'var(--text2)' }}>
              Sign in to continue to your workspace
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'10px 13px', borderRadius:8, marginBottom:16,
              background:'rgba(248,113,113,0.1)',
              border:'1px solid rgba(248,113,113,0.28)',
              color:'var(--red)', fontSize:13,
            }}>
              <i className="ti ti-alert-circle" style={{ fontSize:14, flexShrink:0 }} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div style={{ position:'relative' }}>
                <i className="ti ti-mail" style={{
                  position:'absolute', left:11, top:'50%', transform:'translateY(-50%)',
                  fontSize:14, color:'var(--text3)', pointerEvents:'none',
                }} />
                <input className="input" type="email" name="email"
                  placeholder="you@example.com" value={form.email}
                  onChange={handle} required
                  style={{ paddingLeft:34 }} />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:3 }}>
                <label className="form-label" style={{ marginBottom:0 }}>Password</label>
                <Link to="/forgot-password" style={{
                  fontSize:12, color:'var(--accent)', textDecoration:'none',
                }}>Forgot password?</Link>
              </div>
              <div style={{ position:'relative' }}>
                <i className="ti ti-lock" style={{
                  position:'absolute', left:11, top:'50%', transform:'translateY(-50%)',
                  fontSize:14, color:'var(--text3)', pointerEvents:'none',
                }} />
                <input className="input" type={showPass ? 'text' : 'password'}
                  name="password" placeholder="••••••••"
                  value={form.password} onChange={handle} required
                  style={{ paddingLeft:34, paddingRight:38 }} />
                <button type="button" className="lp-eye"
                  onClick={() => setShowPass(v => !v)}>
                  <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`}
                    style={{ fontSize:14 }} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button className="btn btn-primary" disabled={loading} style={{
              width:'100%', justifyContent:'center',
              padding:'12px', fontSize:14, fontWeight:600,
              marginTop:4, borderRadius:10,
              boxShadow: loading ? 'none' : '0 4px 18px rgba(91,141,239,0.28)',
            }}>
              {loading
                ? <><span className="spinner" style={{ width:13, height:13 }} /> Signing in…</>
                : <>Sign in <i className="ti ti-arrow-right" style={{ fontSize:13 }} /></>
              }
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0' }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
            <span style={{ fontSize:12, color:'var(--text3)', whiteSpace:'nowrap' }}>
              New to TaskFlow?
            </span>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
          </div>

          {/* Register */}
          <Link to="/register" className="lp-reg-btn">
            Create a free account
            <i className="ti ti-user-plus" style={{ fontSize:13 }} />
          </Link>

          {/* Mobile feature pills */}
          <div style={{
            display:'none', flexWrap:'wrap', gap:8, marginTop:28,
          }} className="lp-mobile-pills">
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'5px 10px', borderRadius:20,
                background:'var(--bg3)', border:'1px solid var(--border)',
                fontSize:12, color:'var(--text2)',
              }}>
                <span>{f.icon}</span>
                <span>{f.title}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Mobile pills show style */}
      <style>{`
        @media (max-width: 768px) {
          .lp-mobile-pills { display: flex !important; }
        }
      `}</style>
    </div>
  );
}