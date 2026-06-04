import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const COLORS = [
  { bg:'rgba(91,141,239,.15)',  fill:'#5b8def', icon:'📋' },
  { bg:'rgba(52,211,153,.15)',  fill:'#34d399', icon:'🚀' },
  { bg:'rgba(167,139,250,.15)', fill:'#a78bfa', icon:'⚡' },
  { bg:'rgba(251,191,36,.15)',  fill:'#fbbf24', icon:'🎯' },
  { bg:'rgba(248,113,113,.15)', fill:'#f87171', icon:'🔥' },
  { bg:'rgba(34,211,238,.15)',  fill:'#22d3ee', icon:'💎' },
];

export default function DashboardPage() {
  const { user }      = useAuth();
  const { socket }    = useSocket();
  const navigate      = useNavigate();

  const [boards, setBoards]       = useState([]);
  const [stats, setStats]         = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName]     = useState('');
  const [creating, setCreating]   = useState(false);
  const [toastMsg, setToastMsg]   = useState('');

  const toast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  const loadAll = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([
        api.get('/boards'),
        api.get('/users/dashboard-stats'),
      ]);
      setBoards(b.data);
      setStats(s.data);
    } catch {}
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!socket) return;
    socket.on('refresh-dashboard', loadAll);
    return () => socket.off('refresh-dashboard', loadAll);
  }, [socket, loadAll]);

  const createBoard = async e => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/boards', { name: newName });
      setBoards(prev => [data, ...prev]);
      setStats(s => s ? { ...s, total: s.total } : s);
      setNewName(''); setShowModal(false);
      navigate(`/board/${data.id}`);
    } catch (err) {
      toast(err.response?.data?.error || 'Could not create board');
    } finally { setCreating(false); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-enter">
      {/* Banner */}
      <div className="welcome-banner">
        <div className="banner-emoji">👋</div>
        <div className="banner-body">
          <h3>{greeting}, {user?.name?.split(' ')[0]}!</h3>
          <p>
            {stats
              ? `${stats.dueToday} task${stats.dueToday !== 1 ? 's' : ''} due today${stats.overdue > 0 ? `, ${stats.overdue} overdue` : ''}.`
              : 'Loading your workspace…'}
          </p>
        </div>
        <div className="banner-sp" />
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <i className="ti ti-plus"></i> New Board
        </button>
      </div>

      {/* Stats — real data */}
      <div className="stats-grid">
        {[
          { label:'Total Tasks',  val: stats?.total     ?? '—', color:'var(--accent)', icon:'ti-checklist',     bg:'rgba(91,141,239,.12)',  trend: stats ? `Across ${boards.length} board${boards.length!==1?'s':''}` : '' },
          { label:'Completed',    val: stats?.completed ?? '—', color:'var(--green)',  icon:'ti-circle-check',  bg:'rgba(52,211,153,.12)',  trend: stats?.total ? `${Math.round((stats.completed/stats.total)*100)||0}% done rate` : '' },
          { label:'Due Today',    val: stats?.dueToday  ?? '—', color:'var(--yellow)', icon:'ti-calendar-event',bg:'rgba(251,191,36,.12)',  trend: 'Needs attention today' },
          { label:'Overdue',      val: stats?.overdue   ?? '—', color:'var(--red)',    icon:'ti-alert-circle',  bg:'rgba(248,113,113,.12)', trend: stats?.overdue > 0 ? 'Action required' : 'All on track' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-top">
              <div>
                <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div className="stat-icon" style={{ background: s.bg }}>
                <i className={`ti ${s.icon}`} style={{ fontSize:16, color: s.color }}></i>
              </div>
            </div>
            <div className="stat-trend" style={{ color: s.color === 'var(--red)' && stats?.overdue > 0 ? 'var(--red)' : 'var(--text3)' }}>
              {s.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Boards */}
      <div className="sec-hdr">
        <span className="sec-title">Your Boards <span style={{ color:'var(--text3)', fontWeight:400 }}>({boards.length})</span></span>
        <button className="sec-action" onClick={() => setShowModal(true)}>+ New board</button>
      </div>

      {boards.length === 0 && !showModal ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <p className="empty-title">No boards yet</p>
          <p className="empty-sub">Create your first board to start organizing tasks</p>
          <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => setShowModal(true)}>
            Create a board
          </button>
        </div>
      ) : (
        <div className="boards-grid">
          {boards.map((board, i) => {
            const c   = COLORS[i % COLORS.length];
            const pct = board.task_count > 0
              ? Math.round((board.done_count / board.task_count) * 100)
              : 0;
            return (
              <Link key={board.id} to={`/board/${board.id}`} className="board-card">
                <div className="board-icon" style={{ background: c.bg }}>{c.icon}</div>
                <div className="board-name">{board.name}</div>
                <div className="board-meta">
                  {board.task_count} task{board.task_count !== 1 ? 's' : ''} · {board.member_count} member{board.member_count !== 1 ? 's' : ''}
                </div>
                <div className="board-progress">
                  <div className="board-fill" style={{ width:`${pct}%`, background: c.fill }}></div>
                </div>
                <div className="board-pct">{pct}% complete</div>
              </Link>
            );
          })}
          <div className="new-board-card" onClick={() => setShowModal(true)}>
            <i className="ti ti-plus"></i>
            New Board
          </div>
        </div>
      )}

      {/* Recent activity — real data */}
      {stats?.recentActivity?.length > 0 && (
        <>
          <div className="sec-hdr" style={{ marginTop: 8 }}>
            <span className="sec-title">Recent Activity</span>
          </div>
          <div className="activity-card">
            {stats.recentActivity.map((item, i) => (
              <div key={item.id || i} className="act-item">
                <div className="act-avatar" style={{
                  background: COLORS[i % COLORS.length].fill
                }}>
                  {item.creator_name?.[0]?.toUpperCase() || 'T'}
                </div>
                <div className="act-body">
                  <div className="act-text">
                    Task <strong>{item.title}</strong> added to{' '}
                    <strong>{item.board_name}</strong> → {item.column_name}
                  </div>
                  <div className="act-time">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* New board modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-hdr">
              <span className="modal-title">Create a new board</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="ti ti-x" style={{ fontSize:15 }}></i>
              </button>
            </div>
            <form onSubmit={createBoard}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Board name</label>
                  <input className="input" autoFocus
                    placeholder="e.g. Product Roadmap"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost"
                  onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="toast error">
          <i className="ti ti-alert-circle" style={{ fontSize:15 }}></i>
          {toastMsg}
        </div>
      )}
    </div>
  );
}