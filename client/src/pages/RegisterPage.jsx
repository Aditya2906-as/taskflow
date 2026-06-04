import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm]     = useState({ name:'', email:'', password:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await register(form.name, form.email, form.password); }
    catch (err) { setError(err.response?.data?.error || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card page-enter">
        <div className="auth-logo">
          <div className="logo-icon">T</div> TaskFlow
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Start managing tasks with your team</p>
        <form className="auth-form" onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="input" type="text" name="name"
              placeholder="John Doe" value={form.name}
              onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" type="email" name="email"
              placeholder="you@example.com" value={form.email}
              onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" name="password"
              placeholder="Min. 8 characters" value={form.password}
              onChange={handle} required minLength={8} />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}