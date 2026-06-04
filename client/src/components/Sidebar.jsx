import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

const COLORS = ['#5b8def','#34d399','#a78bfa','#fbbf24','#f87171','#22d3ee'];

export default function Sidebar({ open, onClose }) {
  const { pathname } = useLocation();
  const { socket }   = useSocket();
  const [boards, setBoards] = useState([]);

  const load = () =>
    api.get('/boards').then(({ data }) => setBoards(data)).catch(() => {});

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('refresh-dashboard', load);
    return () => socket.off('refresh-dashboard', load);
  }, [socket]);

  const isActive = (path) => pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        {/* Mobile close button */}
        <button className="sidebar-close-btn" onClick={onClose}>
          <i className="ti ti-x"></i>
        </button>

        <div className="sidebar-section">Menu</div>
        <Link to="/" className={`sidebar-item ${isActive('/') ? 'active' : ''}`}
          onClick={onClose}>
          <i className="ti ti-layout-dashboard"></i> Dashboard
        </Link>
        <Link to="/settings" className={`sidebar-item ${isActive('/settings') ? 'active' : ''}`}
          onClick={onClose}>
          <i className="ti ti-settings"></i> Settings
        </Link>

        <div className="sidebar-section">Boards</div>
        {boards.map((b, i) => (
          <Link key={b.id} to={`/board/${b.id}`}
            className={`sidebar-item ${isActive(`/board/${b.id}`) ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar-board-dot"
              style={{ background: COLORS[i % COLORS.length] }} />
            <span style={{
              flex:1, overflow:'hidden',
              textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13
            }}>
              {b.name}
            </span>
          </Link>
        ))}
        {boards.length === 0 && (
          <p style={{ fontSize:12, color:'var(--text3)', padding:'4px 8px' }}>
            No boards yet
          </p>
        )}

        <div className="sidebar-sp" />

        {/* Bottom nav */}
        <div className="sidebar-bottom">
          <Link to="/manual"
            className={`sidebar-item sidebar-bottom-item ${isActive('/manual') ? 'active' : ''}`}
            onClick={onClose}
          >
            <i className="ti ti-book"></i>
            <span>User Manual</span>
          </Link>
          <Link to="/ai"
            className={`sidebar-item sidebar-bottom-item ai-btn ${isActive('/ai') ? 'active' : ''}`}
            onClick={onClose}
          >
            <i className="ti ti-sparkles"></i>
            <span>AI Assistant</span>
            <span className="ai-badge">AI</span>
          </Link>
        </div>
      </aside>
    </>
  );
}