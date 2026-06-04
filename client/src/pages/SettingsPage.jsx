import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  // Profile state
  const [name, setName]         = useState(user?.name || '');
  const [email, setEmail]       = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [pwForm, setPwForm]     = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg]       = useState('');
  const [pwErr, setPwErr]       = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // Notification prefs state
  const [notifPrefs, setNotifPrefs] = useState({
    chat: true, invite: true, invite_accepted: true
  });
  const [notifMsg, setNotifMsg] = useState('');

  // Danger zone
  const [confirmDelete, setConfirmDelete] = useState('');
  const [deleting, setDeleting] = useState(false);

  const toast = (setMsg, msg, delay = 3000) => {
    setMsg(msg);
    setTimeout(() => setMsg(''), delay);
  };

  // Load profile
  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      setName(data.name);
      setEmail(data.email);
    }).catch(() => {});
  }, []);

  // Save profile
  const saveProfile = async e => {
    e.preventDefault();
    setProfileErr(''); setSavingProfile(true);
    try {
      await api.patch('/users/profile', { name, email });
      localStorage.setItem('user', JSON.stringify({ ...user, name, email }));
      toast(setProfileMsg, 'Profile updated successfully!');
    } catch (err) {
      setProfileErr(err.response?.data?.error || 'Could not update profile');
    } finally { setSavingProfile(false); }
  };

  // Change password
  const changePassword = async e => {
    e.preventDefault();
    setPwErr('');
    if (pwForm.newPw !== pwForm.confirm) {
      setPwErr('New passwords do not match');
      return;
    }
    if (pwForm.newPw.length < 8) {
      setPwErr('Password must be at least 8 characters');
      return;
    }
    setSavingPw(true);
    try {
      await api.patch('/users/password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw
      });
      setPwForm({ current: '', newPw: '', confirm: '' });
      toast(setPwMsg, 'Password changed successfully!');
    } catch (err) {
      setPwErr(err.response?.data?.error || 'Could not change password');
    } finally { setSavingPw(false); }
  };

  // Delete account
  const deleteAccount = async () => {
    if (confirmDelete !== user?.email) return;
    setDeleting(true);
    try {
      await api.delete('/users/account');
      logout();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="page-enter" style={{ maxWidth: 640 }}>
      <div className="page-hdr">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Manage your account and preferences</p>
        </div>
      </div>

      {/* ── Profile ── */}
      <div className="settings-card">
        <div className="settings-card-hdr">
          <i className="ti ti-user" style={{ fontSize: 16, color: 'var(--accent)' }}></i>
          <span className="settings-card-title">Profile</span>
        </div>
        <form onSubmit={saveProfile}>
          <div className="settings-body">
            {/* Avatar preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div className="avatar" style={{ width: 52, height: 52, fontSize: 18 }}>
                {name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{name}</p>
                <p style={{ fontSize: 12, color: 'var(--text2)' }}>{email}</p>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="input" value={name}
                onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Email address</label>
              <input className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          {profileErr && <p className="form-error" style={{ padding: '0 20px 12px' }}>{profileErr}</p>}
          {profileMsg && <p className="settings-success">{profileMsg}</p>}
          <div className="settings-footer">
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Password ── */}
      <div className="settings-card">
        <div className="settings-card-hdr">
          <i className="ti ti-lock" style={{ fontSize: 16, color: 'var(--accent)' }}></i>
          <span className="settings-card-title">Change Password</span>
        </div>
        <form onSubmit={changePassword}>
          <div className="settings-body">
            <div className="form-group">
              <label className="form-label">Current password</label>
              <input className="input" type="password" value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                placeholder="••••••••" required />
            </div>
            <div className="form-row" style={{ marginTop: 12 }}>
              <div className="form-group">
                <label className="form-label">New password</label>
                <input className="input" type="password" value={pwForm.newPw}
                  onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                  placeholder="Min. 8 characters" required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm new password</label>
                <input className="input" type="password" value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repeat password" required />
              </div>
            </div>
          </div>
          {pwErr && <p className="form-error" style={{ padding: '0 20px 12px' }}>{pwErr}</p>}
          {pwMsg && <p className="settings-success">{pwMsg}</p>}
          <div className="settings-footer">
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingPw}>
              {savingPw ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Notification prefs ── */}
      <div className="settings-card">
        <div className="settings-card-hdr">
          <i className="ti ti-bell" style={{ fontSize: 16, color: 'var(--accent)' }}></i>
          <span className="settings-card-title">Notification Preferences</span>
        </div>
        <div className="settings-body">
          {[
            { key: 'chat',            label: 'Chat messages',      desc: 'Get notified when someone sends a message in a board you are part of' },
            { key: 'invite',          label: 'Board invitations',   desc: 'Get notified when someone invites you to a board' },
            { key: 'invite_accepted', label: 'Invite accepted',     desc: 'Get notified when someone accepts your board invitation' },
          ].map(pref => (
            <div key={pref.key} className="notif-pref-row">
              <div>
                <p className="notif-pref-label">{pref.label}</p>
                <p className="notif-pref-desc">{pref.desc}</p>
              </div>
              <div
                className={`toggle-track ${notifPrefs[pref.key] ? 'on' : ''}`}
                onClick={() => {
                  setNotifPrefs(p => ({ ...p, [pref.key]: !p[pref.key] }));
                  toast(setNotifMsg, 'Preferences saved');
                }}
              >
                <div className="toggle-thumb"></div>
              </div>
            </div>
          ))}
        </div>
        {notifMsg && <p className="settings-success">{notifMsg}</p>}
      </div>

      {/* ── Account info ── */}
      <div className="settings-card">
        <div className="settings-card-hdr">
          <i className="ti ti-info-circle" style={{ fontSize: 16, color: 'var(--accent)' }}></i>
          <span className="settings-card-title">Account Info</span>
        </div>
        <div className="settings-body">
          {[
            { label: 'User ID',       val: user?.id },
            { label: 'Account email', val: user?.email },
            { label: 'Member since',  val: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : '—' },
          ].map(row => (
            <div key={row.label} className="info-row">
              <span className="info-label">{row.label}</span>
              <span className="info-val">{row.val || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div className="settings-card danger-card">
        <div className="settings-card-hdr">
          <i className="ti ti-alert-triangle" style={{ fontSize: 16, color: 'var(--red)' }}></i>
          <span className="settings-card-title" style={{ color: 'var(--red)' }}>Danger Zone</span>
        </div>
        <div className="settings-body">
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
            Deleting your account will permanently remove all your boards, tasks, and data.
            This action cannot be undone.
          </p>
          <div className="form-group">
            <label className="form-label">
              Type your email <strong style={{ color: 'var(--text)' }}>{user?.email}</strong> to confirm
            </label>
            <input className="input" placeholder={user?.email}
              value={confirmDelete}
              onChange={e => setConfirmDelete(e.target.value)} />
          </div>
        </div>
        <div className="settings-footer">
          <button
            className="btn btn-danger btn-sm"
            disabled={confirmDelete !== user?.email || deleting}
            onClick={deleteAccount}
          >
            {deleting ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </div>
  );
}