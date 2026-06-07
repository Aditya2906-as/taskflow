import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotificationContext';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';

export default function Navbar({ onMenuClick }) {
  const { user, logout }  = useAuth();
  const { notifications, unread, markRead, markAllRead } = useNotif();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef();
  const navigate = useNavigate();

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotif(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = async (notif) => {
    await markRead(notif.id);
    const data = typeof notif.data === 'string' ? JSON.parse(notif.data || '{}') : (notif.data || {});
    if ((notif.type === 'chat' || notif.type === 'invite_accepted') && data.boardId) {
      setShowNotif(false);
      navigate(`/board/${data.boardId}`);
    }
  };

  const handleInviteAction = async (e, notif, action) => {
    e.stopPropagation();
    try {
      const data = typeof notif.data === 'string' ? JSON.parse(notif.data || '{}') : (notif.data || {});
      await api.patch(`/invites/${data.inviteId}`, { action });
      await markRead(notif.id);
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const notifIcon = (type) => {
    if (type === 'invite')          return 'ti-user-plus';
    if (type === 'invite_accepted') return 'ti-circle-check';
    if (type === 'chat')            return 'ti-message-circle';
    return 'ti-bell';
  };

  const notifColor = (type) => {
    if (type === 'invite')          return 'type-invite';
    if (type === 'invite_accepted') return 'type-success';
    if (type === 'chat')            return 'type-chat';
    return 'type-info';
  };

  return (
    <nav className="navbar">
      {/* Hamburger — mobile only */}
      <button className="hamburger" onClick={onMenuClick} aria-label="Open menu">
        <i className="ti ti-menu-2" style={{ fontSize: 18 }}></i>
      </button>

      <Link to="/" className="navbar-logo">
        <Link to="/" className="navbar-logo">
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none"
            xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <rect width="36" height="36" rx="9" fill="#1c2235"/>
            <rect x="5"  y="7" width="6" height="16" rx="2" fill="#5b8def"/>
            <rect x="13" y="7" width="6" height="11" rx="2" fill="#a78bfa"/>
            <rect x="21" y="7" width="6" height="7"  rx="2" fill="#34d399"/>
            <path d="M6 28 L27 28" stroke="#5b8def" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M23.5 24.5 L27 28 L23.5 31.5" stroke="#5b8def" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </Link>
        <span className="navbar-logo-text">TaskFlow</span>
      </Link>
      <div className="navbar-sp" />

      {user && (
        <div className="navbar-actions">
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => setShowNotif(v => !v)} title="Notifications">
              <i className="ti ti-bell" style={{ fontSize: 15 }}></i>
              {unread > 0 && (
                <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>
              )}
            </button>

            {showNotif && (
              <div className="notif-dropdown">
                <div className="notif-hdr">
                  <span className="notif-hdr-title">
                    Notifications {unread > 0 && <span className="notif-count-pill">{unread}</span>}
                  </span>
                  {unread > 0 && (
                    <button className="notif-mark-all" onClick={markAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">
                      <i className="ti ti-bell-off" style={{ fontSize: 24, display:'block', marginBottom: 8 }}></i>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => handleNotifClick(n)}
                      >
                        <div className={`notif-dot-type ${notifColor(n.type)}`}>
                          <i className={`ti ${notifIcon(n.type)}`} style={{ fontSize: 11 }}></i>
                        </div>
                        <div className="notif-body">
                          <p className="notif-title">{n.title}</p>
                          <p className="notif-text">{n.body}</p>
                          {n.type === 'invite' && !n.is_read && (() => {
                            const d = typeof n.data === 'string' ? JSON.parse(n.data||'{}') : (n.data||{});
                            return d.inviteId ? (
                              <div className="notif-actions">
                                <button className="btn btn-primary btn-sm"
                                  onClick={e => handleInviteAction(e, n, 'accepted')}>
                                  <i className="ti ti-check" style={{ fontSize:11 }}></i> Accept
                                </button>
                                <button className="btn btn-ghost btn-sm"
                                  onClick={e => handleInviteAction(e, n, 'declined')}>
                                  Decline
                                </button>
                              </div>
                            ) : null;
                          })()}
                          <p className="notif-time">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="nav-sep" />
          <div className="avatar" title={user.name}>{initials}</div>
          <span className="nav-name">{user.name?.split(' ')[0]}</span>
          <Link to="/settings" className="btn btn-ghost btn-sm">
            <i className="ti ti-settings" style={{ fontSize: 13 }}></i> Settings
          </Link>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
        </div>
      )}
    </nav>
  );
}