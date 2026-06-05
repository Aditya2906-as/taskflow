import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getWikiPages, createWikiPage, updateWikiPage, deleteWikiPage } from '../api/wiki';

const CATEGORIES = [
  { key: 'notes',         label: 'Notes',         icon: '📝' },
  { key: 'documentation', label: 'Documentation',  icon: '📖' },
  { key: 'faqs',          label: 'FAQs',           icon: '❓' },
  { key: 'guidelines',    label: 'Guidelines',     icon: '📌' },
];

export default function WikiPage() {
  const { id: boardId }     = useParams();
  const [pages, setPages]   = useState([]);
  const [selected, setSel]  = useState(null);
  const [editing, setEdit]  = useState(false);
  const [draft, setDraft]   = useState({ title: '', content: '', category: 'notes' });
  const [activeTab, setTab] = useState('notes');
  const [loading, setLoad]  = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getWikiPages(boardId);
      setPages(data);
      if (!selected && data.length > 0) setSel(data[0]);
    } finally { setLoad(false); }
  }, [boardId]);

  useEffect(() => { load(); }, [load]);

  const handleNew = async () => {
    const { data } = await createWikiPage(boardId, {
      title: 'Untitled', content: '', category: activeTab
    });
    setPages(p => [data, ...p]);
    setSel(data);
    setDraft({ title: data.title, content: data.content, category: data.category });
    setEdit(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateWikiPage(selected.id, draft);
      setPages(p => p.map(pg => pg.id === data.id ? data : pg));
      setSel(data);
      setEdit(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (pageId) => {
    if (!window.confirm('Delete this page? This cannot be undone.')) return;
    await deleteWikiPage(pageId);
    setPages(p => p.filter(pg => pg.id !== pageId));
    setSel(null);
    setEdit(false);
  };

  const filtered = pages.filter(p => p.category === activeTab);
  const catMeta  = CATEGORIES.find(c => c.key === activeTab);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100%', color:'var(--text3)' }}>
      Loading wiki…
    </div>
  );

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>

      {/* ── Left panel: categories + page list ── */}
      <div style={{
        width: 220, flexShrink: 0, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Title */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>📚 Project Wiki</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Notes, docs & guidelines</div>
        </div>

        {/* Category tabs */}
        <div style={{ padding: '8px 8px 0' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.key}
              onClick={() => setTab(cat.key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 8px', borderRadius: 7, border: 'none',
                background: activeTab === cat.key ? 'var(--bg3)' : 'transparent',
                color: activeTab === cat.key ? 'var(--text)' : 'var(--text2)',
                cursor: 'pointer', fontSize: 13, marginBottom: 2,
                fontFamily: 'var(--font)', transition: 'all 0.15s'
              }}
            >
              <span>{cat.icon} {cat.label}</span>
              <span style={{
                fontSize: 10, background: 'var(--bg4)', color: 'var(--text3)',
                borderRadius: 10, padding: '1px 6px'
              }}>
                {pages.filter(p => p.category === cat.key).length}
              </span>
            </button>
          ))}
        </div>

        {/* Page list for active tab */}
        <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid var(--border)', marginTop: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center',
              color: 'var(--text3)', fontSize: 12 }}>
              No {catMeta?.label.toLowerCase()} yet
            </div>
          ) : (
            filtered.map(page => (
              <button key={page.id}
                onClick={() => { setSel(page); setEdit(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 12px',
                  borderBottom: '1px solid var(--border)', border: 'none',
                  background: selected?.id === page.id ? 'rgba(91,141,239,0.08)' : 'transparent',
                  borderLeft: selected?.id === page.id ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer', display: 'block', fontFamily: 'var(--font)',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{
                  fontSize: 13, fontWeight: 500,
                  color: selected?.id === page.id ? 'var(--accent)' : 'var(--text)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {page.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {new Date(page.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>

        {/* New page button */}
        <div style={{ padding: 10, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button className="btn btn-primary" onClick={handleNew}
            style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '7px' }}>
            + New Page
          </button>
        </div>
      </div>

      {/* ── Right panel: editor / viewer ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!selected ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text3)', gap: 12
          }}>
            <div style={{ fontSize: 40 }}>📄</div>
            <p style={{ fontSize: 14 }}>Select a page or create a new one</p>
            <button className="btn btn-ghost btn-sm" onClick={handleNew}>
              + New Page
            </button>
          </div>
        ) : editing ? (
          // ── Edit mode ──
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
              <input
                value={draft.title}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                placeholder="Page title"
                style={{
                  flex: 1, fontSize: 20, fontWeight: 600,
                  background: 'transparent', border: 'none', borderBottom: '2px solid var(--border)',
                  color: 'var(--text)', padding: '4px 0', outline: 'none',
                  fontFamily: 'var(--font)'
                }}
                onFocus={e => e.target.style.borderBottomColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderBottomColor = 'var(--border)'}
              />
              <select
                className="input"
                value={draft.category}
                onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                style={{ width: 'auto', fontSize: 12 }}
              >
                {CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-ghost btn-sm"
                onClick={() => { setEdit(false); setDraft({}); }}>
                Cancel
              </button>
            </div>
            <textarea
              className="input"
              value={draft.content}
              onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
              placeholder="Write your content here… (plain text or Markdown)"
              style={{
                flex: 1, resize: 'none', fontFamily: 'var(--mono)',
                fontSize: 13, lineHeight: 1.8
              }}
            />
          </div>
        ) : (
          // ── View mode ──
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                  {selected.title}
                </h1>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    color: 'var(--text2)'
                  }}>
                    {catMeta?.icon} {catMeta?.label}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    Updated {new Date(selected.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  setDraft({ title: selected.title, content: selected.content, category: selected.category });
                  setEdit(true);
                }}>
                  ✏️ Edit
                </button>
                <button className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(selected.id)}>
                  🗑
                </button>
              </div>
            </div>
            {selected.content ? (
              <div style={{
                whiteSpace: 'pre-wrap', lineHeight: 1.8,
                fontSize: 14, color: 'var(--text)'
              }}>
                {selected.content}
              </div>
            ) : (
              <div style={{ color: 'var(--text3)', fontStyle: 'italic', marginTop: 40, textAlign: 'center' }}>
                No content yet. Click Edit to start writing.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}