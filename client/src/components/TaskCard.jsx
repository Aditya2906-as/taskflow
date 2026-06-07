import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../api/axios';

// ─── Task Detail Modal ────────────────────────────────────
function TaskDetailModal({ task, members, onClose, onUpdate, onDelete }) {
  const [editing, setEditing]     = useState(false);
  const [title, setTitle]         = useState(task.title);
  const [description, setDesc]    = useState(task.description || '');
  const [priority, setPriority]   = useState(task.priority || 'medium');
  const [dueDate, setDueDate]     = useState(task.due_date?.split('T')[0] || '');
  const [assignee, setAssignee]   = useState(task.assignee_id || '');
  const [saving, setSaving]       = useState(false);

  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  const priorityColors = {
    high:   { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: 'rgba(248,113,113,0.3)' },
    medium: { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.3)'  },
    low:    { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', border: 'rgba(52,211,153,0.3)'  },
  };
  const pc = priorityColors[priority] || priorityColors.medium;

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/tasks/${task.id}`, {
        title:      title.trim(),
        description: description.trim(),
        priority,
        dueDate:    dueDate || null,
        assigneeId: assignee || null,
      });
      onUpdate(data);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    onDelete(task.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" style={{ maxWidth: 520, width: '100%' }}
        onMouseDown={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-hdr">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px',
              borderRadius: 20, border: `1px solid ${pc.border}`,
              background: pc.bg, color: pc.color, textTransform: 'capitalize'
            }}>
              {priority}
            </span>
            {isOverdue && !editing && (
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                background: 'rgba(248,113,113,0.12)', color: '#f87171',
                border: '1px solid rgba(248,113,113,0.3)'
              }}>
                Overdue
              </span>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="ti ti-x" style={{ fontSize: 13 }}></i>
          </button>
        </div>

        <div className="modal-body">
          {editing ? (
            /* ── Edit mode ── */
            <>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="input"
                  rows={4}
                  value={description}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Add a detailed description…"
                  style={{ resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="input" value={priority}
                    onChange={e => setPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="input" value={dueDate}
                    onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>

              {members?.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select className="input" value={assignee}
                    onChange={e => setAssignee(e.target.value)}>
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : (
            /* ── View mode ── */
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4, margin: 0 }}>
                {task.title}
              </h2>

              {task.description ? (
                <div style={{
                  fontSize: 13, color: 'var(--text2)', lineHeight: 1.7,
                  background: 'var(--bg3)', borderRadius: 8, padding: '12px 14px',
                  border: '1px solid var(--border)'
                }}>
                  {task.description}
                </div>
              ) : (
                <div style={{
                  fontSize: 13, color: 'var(--text3)', fontStyle: 'italic',
                  padding: '10px 0'
                }}>
                  No description yet. Click Edit to add one.
                </div>
              )}

              {/* Meta info grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 10, marginTop: 4
              }}>
                <div style={{
                  background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    Due Date
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    color: isOverdue ? '#f87171' : 'var(--text)'
                  }}>
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                        })
                      : <span style={{ color: 'var(--text3)', fontWeight: 400 }}>Not set</span>
                    }
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    Assignee
                  </div>
                  {task.assignee_name ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="avatar" style={{ width: 20, height: 20, fontSize: 9 }}>
                        {task.assignee_name[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{task.assignee_name}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 400 }}>
                      Unassigned
                    </span>
                  )}
                </div>

                <div style={{
                  background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    Priority
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                    color: pc.color
                  }}>
                    ● {priority}
                  </span>
                </div>

                <div style={{
                  background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    Created
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>
                    {task.created_at
                      ? new Date(task.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })
                      : '—'
                    }
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            <i className="ti ti-trash" style={{ fontSize: 12 }}></i> Delete
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {editing ? (
              <>
                <button className="btn btn-ghost btn-sm"
                  onClick={() => { setEditing(false); setTitle(task.title); setDesc(task.description || ''); }}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !title.trim()}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>
                <i className="ti ti-pencil" style={{ fontSize: 12 }}></i> Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────
export default function TaskCard({ task, members, onDelete, onUpdate }) {
  const [showDetail, setShowDetail] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  const initials  = task.assignee_name
    ?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const priorityDot = { high: '#f87171', medium: '#fbbf24', low: '#34d399' };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`task-card ${isDragging ? 'dragging' : ''}`}
        {...attributes}
        {...listeners}
        onClick={() => !isDragging && setShowDetail(true)}
        style={{ ...style, cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
          <div className="task-card-title">{task.title}</div>
          <button
            className="task-delete-btn"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            title="Delete task"
          >
            <i className="ti ti-x" style={{ fontSize: 11 }}></i>
          </button>
        </div>

        {task.description && (
          <div className="task-card-desc">{task.description}</div>
        )}

        <div className="task-card-footer">
          {task.priority && (
            <span className={`task-priority priority-${task.priority}`}>
              {task.priority}
            </span>
          )}
          {task.due_date && (
            <span className={`task-due-label ${isOverdue ? 'overdue' : ''}`}>
              <i className="ti ti-calendar" style={{ fontSize: 10 }}></i>
              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {initials && (
            <div className="task-assignee-mini" title={task.assignee_name}>{initials}</div>
          )}
        </div>
      </div>

      {showDetail && (
        <TaskDetailModal
          task={task}
          members={members}
          onClose={() => setShowDetail(false)}
          onUpdate={(updated) => { onUpdate?.(updated); setShowDetail(false); }}
          onDelete={(id) => { onDelete(id); }}
        />
      )}
    </>
  );
}