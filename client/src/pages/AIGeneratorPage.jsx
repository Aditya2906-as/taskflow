import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const EXAMPLES = [
  'Build a food delivery app',
  'Create an e-commerce website',
  'Develop a fitness tracking mobile app',
  'Launch a SaaS invoice tool',
  'Build a real-time chat application',
  'Create a blog platform with CMS',
];

const COL_COLORS = {
  Planning:    { dot: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
  Design:      { dot: '#f472b6', bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.2)' },
  Development: { dot: '#5b8def', bg: 'rgba(91,141,239,0.08)',  border: 'rgba(91,141,239,0.2)'  },
  Testing:     { dot: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
};

// ─── Task Preview Modal ───────────────────────────────────
function TaskPreviewModal({ task, columnTitle, dayOffset, onClose }) {
  const dueDate = new Date(Date.now() + dayOffset * 86400000);
  const col     = COL_COLORS[columnTitle] || COL_COLORS.Planning;

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" style={{ maxWidth: 460, width: '100%' }}
        onMouseDown={e => e.stopPropagation()}>

        <div className="modal-hdr">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
              background: col.bg, border: `1px solid ${col.border}`, color: col.dot
            }}>
              {columnTitle}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="ti ti-x" style={{ fontSize: 13 }}></i>
          </button>
        </div>

        <div className="modal-body">
          <h2 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4, margin: 0 }}>
            {task.title}
          </h2>

          <div style={{
            fontSize: 13, color: 'var(--text2)', lineHeight: 1.7,
            background: 'var(--bg3)', borderRadius: 8, padding: '12px 14px',
            border: '1px solid var(--border)'
          }}>
            {task.description}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{
              background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Due Date
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {dueDate.toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric'
                })}
              </div>
            </div>
            <div style={{
              background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Days from now
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {dayOffset} days
              </div>
            </div>
          </div>

          <div style={{
            fontSize: 12, color: 'var(--text3)', fontStyle: 'italic',
            padding: '6px 0'
          }}>
            This task will be created when you click "Create Board".
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function AIGeneratorPage() {
  const [prompt, setPrompt]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [creating, setCreating]   = useState(false);
  const [error, setError]         = useState('');
  const [preview, setPreview]     = useState(null);   // generated JSON preview
  const [selectedTask, setSelTask]= useState(null);   // { task, columnTitle }
  const navigate = useNavigate();

  // Step 1: Ask Groq to generate the structure (preview only, no DB yet)
  const generatePreview = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setError(''); setLoading(true); setPreview(null);
    try {
      const { data } = await api.post('/ai/preview-project', { prompt: prompt.trim() });
      setPreview(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Generation failed. Please try again.');
    } finally { setLoading(false); }
  };

  // Step 2: User confirms → save to DB and go to board
  const createBoard = async () => {
    if (!preview) return;
    setCreating(true);
    try {
      const { data } = await api.post('/ai/create-project', { preview });
      navigate(`/board/${data.board.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create board.');
      setCreating(false);
    }
  };

  const totalTasks = preview?.columns?.reduce((s, c) => s + c.tasks.length, 0) || 0;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11,
          background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, marginBottom: 14
        }}>✨</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
          AI Project Generator
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>
          Describe what you want to build. AI generates a full project board —
          preview every task before creating it.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '11px 14px', borderRadius: 8, marginBottom: 18,
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
          color: 'var(--red)', fontSize: 13
        }}>
          {error}
        </div>
      )}

      {/* Input form — hide after preview */}
      {!preview && (
        <form onSubmit={generatePreview}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">What do you want to build?</label>
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. Build a food delivery app with user authentication, restaurant listings, and order tracking…"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={loading}
              style={{ fontSize: 13, lineHeight: 1.6 }}
            />
          </div>

          <button
            className="btn btn-primary"
            disabled={loading || !prompt.trim()}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14 }} />
                Generating preview…
              </>
            ) : '✨ Generate Preview'}
          </button>

          {/* Example chips */}
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Try an example
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {EXAMPLES.map(ex => (
                <button key={ex} type="button" onClick={() => setPrompt(ex)}
                  style={{
                    padding: '5px 11px', borderRadius: 20, fontSize: 12,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    color: 'var(--text2)', cursor: 'pointer'
                  }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* ── PREVIEW ── */}
      {preview && (
        <div>
          {/* Preview header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20, padding: '14px 16px',
            background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)'
          }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>📋 {preview.boardName}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                {preview.columns.length} lists · {totalTasks} tasks · click any task to preview it
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm"
                onClick={() => { setPreview(null); }}>
                ← Edit prompt
              </button>
              <button className="btn btn-primary btn-sm"
                onClick={createBoard} disabled={creating}>
                {creating ? (
                  <><span className="spinner" style={{ width: 12, height: 12 }} /> Creating…</>
                ) : '🚀 Create Board'}
              </button>
            </div>
          </div>

          {/* Column previews */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14
          }}>
            {preview.columns.map((col, ci) => {
              const cc = COL_COLORS[col.title] || COL_COLORS.Planning;
              return (
                <div key={ci} style={{
                  background: 'var(--bg2)', borderRadius: 10,
                  border: `1px solid ${cc.border}`, overflow: 'hidden'
                }}>
                  {/* Column header */}
                  <div style={{
                    padding: '10px 12px', borderBottom: `1px solid ${cc.border}`,
                    background: cc.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: cc.dot, flexShrink: 0
                      }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: cc.dot }}>
                        {col.title}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 10, background: 'var(--bg4)', color: 'var(--text3)',
                      borderRadius: 10, padding: '1px 6px'
                    }}>
                      {col.tasks.length}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {col.tasks.map((task, ti) => (
                      <button
                        key={ti}
                        onClick={() => setSelTask({ task, columnTitle: col.title })}
                        style={{
                          width: '100%', textAlign: 'left', padding: '9px 10px',
                          borderRadius: 7, border: '1px solid var(--border)',
                          background: 'var(--bg3)', cursor: 'pointer',
                          fontFamily: 'var(--font)', transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = cc.dot;
                          e.currentTarget.style.background  = cc.bg;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.background  = 'var(--bg3)';
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)',
                          lineHeight: 1.4, marginBottom: 5 }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)',
                          lineHeight: 1.4, marginBottom: 6,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {task.description}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <i className="ti ti-calendar" style={{ fontSize: 9, color: 'var(--text3)' }} />
                          <span style={{ fontSize: 10, color: 'var(--text3)' }}>
                            {new Date(Date.now() + task.daysFromNow * 86400000)
                              .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span style={{
                            marginLeft: 'auto', fontSize: 10, color: cc.dot,
                            background: cc.bg, padding: '1px 6px', borderRadius: 10
                          }}>
                            +{task.daysFromNow}d
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div style={{
            marginTop: 20, padding: '14px 16px',
            background: 'var(--bg2)', borderRadius: 10,
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              Happy with the preview? Click Create Board to save everything.
            </div>
            <button className="btn btn-primary"
              onClick={createBoard} disabled={creating}
              style={{ fontSize: 13 }}>
              {creating ? (
                <><span className="spinner" style={{ width: 13, height: 13 }} /> Creating…</>
              ) : '🚀 Create Board'}
            </button>
          </div>
        </div>
      )}

      {/* Task preview modal */}
      {selectedTask && (
        <TaskPreviewModal
          task={selectedTask.task}
          columnTitle={selectedTask.columnTitle}
          dayOffset={selectedTask.task.daysFromNow}
          onClose={() => setSelTask(null)}
        />
      )}
    </div>
  );
}