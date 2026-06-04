import { useState } from 'react';
import api from '../api/axios';

export default function InviteModal({ boardId, onClose }) {
  const [email, setEmail]     = useState('');
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const send = async e => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      await api.post('/invites', { boardId, receiverEmail: email });
      setResult(`Invitation sent to ${email}!`);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send invite');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hdr">
          <span className="modal-title">
            <i className="ti ti-user-plus" style={{ marginRight:8, color:'var(--accent)' }}></i>
            Invite Member
          </span>
          <button className="modal-close" onClick={onClose}>
            <i className="ti ti-x" style={{ fontSize:15 }}></i>
          </button>
        </div>

        <form onSubmit={send}>
          <div className="modal-body">
            <p style={{ fontSize:13, color:'var(--text2)', marginBottom:4 }}>
              Enter the email address of an existing TaskFlow user.
              They'll receive a notification to accept or decline.
            </p>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="teammate@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error  && <p className="form-error">{error}</p>}
            {result && (
              <p style={{ fontSize:13, color:'var(--green)', display:'flex', alignItems:'center', gap:6 }}>
                <i className="ti ti-circle-check"></i> {result}
              </p>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !email}>
              {loading ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}