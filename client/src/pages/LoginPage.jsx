import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(form.email, form.password); }
    catch (err) { setError(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card page-enter">
        <div className="auth-logo">
          <div className="logo-icon">T</div> TaskFlow
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your workspace</p>
        <form className="auth-form" onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" type="email" name="email"
              placeholder="you@example.com" value={form.email}
              onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" name="password"
              placeholder="••••••••" value={form.password}
              onChange={handle} required />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div style={{ textAlign: 'right', marginTop: -6 }}>
            <Link to="/forgot-password"
              style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-footer">
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}