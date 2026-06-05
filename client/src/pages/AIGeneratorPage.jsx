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

export default function AIGeneratorPage() {
  const [prompt, setPrompt]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  const generate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/ai/generate-project', { prompt: prompt.trim() });
      navigate(`/board/${data.board.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Generation failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, var(--accent), var(--purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, marginBottom: 16
        }}>✨</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
          AI Project Generator
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
          Describe what you want to build. AI will create a full board with
          Planning, Design, Development and Testing lists — each with tasks and due dates.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '11px 14px', borderRadius: 8, marginBottom: 20,
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
          color: 'var(--red)', fontSize: 13
        }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={generate}>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">What do you want to build?</label>
          <textarea
            className="input"
            rows={4}
            placeholder="e.g. Build a food delivery app with user authentication, restaurant listings, and order tracking…"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={loading}
            style={{ fontSize: 14, lineHeight: 1.6 }}
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
              Generating your project…
            </>
          ) : (
            <>✨ Generate Project</>
          )}
        </button>
      </form>

      {/* What gets created */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, marginTop: 24
      }}>
        {[
          { icon: '📋', title: '4 Lists', desc: 'Planning → Design → Development → Testing' },
          { icon: '✅', title: '16–24 Tasks', desc: 'Specific, actionable tasks per list' },
          { icon: '📅', title: 'Due Dates', desc: 'Realistically spread over 60 days' },
        ].map(f => (
          <div key={f.title} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '14px 12px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{f.title}</div>
            <div style={{ color: 'var(--text3)', fontSize: 11, lineHeight: 1.4 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Example prompts */}
      <div style={{ marginTop: 28 }}>
        <p style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Try an example
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              disabled={loading}
              style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text2)', cursor: 'pointer', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.target.style.color = 'var(--text)'; e.target.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={e => { e.target.style.color = 'var(--text2)'; e.target.style.borderColor = 'var(--border)'; }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}