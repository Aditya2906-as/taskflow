import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPasswordPage() {
  const [step, setStep]       = useState('email');   // 'email' | 'otp' | 'password'
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // ── Step 1: send OTP ──
  const sendOTP = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Check your email.');
    } finally { setLoading(false); }
  };

  // ── Step 2: verify OTP ──
  const verifyOTP = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setStep('password');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP');
    } finally { setLoading(false); }
  };

  // ── Step 3: reset password ──
  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPass !== confirm) return setError('Passwords do not match');
    setError(''); setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword: newPass });
      setSuccess('Password reset successfully! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Please start over.');
    } finally { setLoading(false); }
  };

  const steps = ['email', 'otp', 'password'];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="auth-page">
      <div className="auth-card page-enter">

        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon">T</div> TaskFlow
        </div>

        <h1 className="auth-title">Reset password</h1>
        <p className="auth-sub">
          {step === 'email'    && 'Enter your email and we\'ll send a 6-digit code'}
          {step === 'otp'      && `Enter the 6-digit code sent to ${email}`}
          {step === 'password' && 'Choose a new password for your account'}
        </p>

        {/* Step indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 20
        }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600,
                background: stepIdx > i ? 'var(--green)'
                          : stepIdx === i ? 'var(--accent)'
                          : 'var(--bg4)',
                color: stepIdx >= i ? '#fff' : 'var(--text3)',
                transition: 'all 0.2s'
              }}>
                {stepIdx > i ? '✓' : i + 1}
              </div>
              {i < 2 && (
                <div style={{
                  width: 28, height: 2, borderRadius: 2,
                  background: stepIdx > i ? 'var(--green)' : 'var(--border)',
                  transition: 'all 0.2s'
                }} />
              )}
            </div>
          ))}
          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text2)' }}>
            {step === 'email' ? 'Enter email' : step === 'otp' ? 'Verify code' : 'New password'}
          </span>
        </div>

        {/* Error / Success banners */}
        {error && (
          <div style={{
            padding: '10px 13px', borderRadius: 8, marginBottom: 14,
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            color: 'var(--red)', fontSize: 13
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            padding: '10px 13px', borderRadius: 8, marginBottom: 14,
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
            color: 'var(--green)', fontSize: 13
          }}>
            {success}
          </div>
        )}

        {/* ── STEP 1: Email ── */}
        {step === 'email' && (
          <form className="auth-form" onSubmit={sendOTP}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 'otp' && (
          <form className="auth-form" onSubmit={verifyOTP}>
            <div className="form-group">
              <label className="form-label">6-digit code</label>
              <input
                className="input"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                autoFocus
                style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8, fontWeight: 600 }}
              />
            </div>
            <button className="btn btn-primary w-full" disabled={loading || otp.length < 6}>
              {loading ? 'Verifying…' : 'Verify Code'}
            </button>
            <button
              type="button"
              className="btn btn-ghost w-full"
              style={{ marginTop: 4 }}
              onClick={() => { setStep('email'); setOtp(''); setError(''); }}
            >
              ← Use different email
            </button>
          </form>
        )}

        {/* ── STEP 3: New password ── */}
        {step === 'password' && (
          <form className="auth-form" onSubmit={resetPassword}>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input
                className="input"
                type="password"
                placeholder="Min. 8 characters"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                minLength={8}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm new password</label>
              <input
                className="input"
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="auth-footer" style={{ marginTop: 18 }}>
          <Link to="/login">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}