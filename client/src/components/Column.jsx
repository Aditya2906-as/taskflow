import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';
import api from '../api/axios';

const COL_COLORS = {
  'To Do': '#5b8def', 'In Progress': '#fbbf24', 'Done': '#34d399'
};

export default function Column({ column, tasks, boardId, socket, members, onTaskAdded, onTaskDeleted }) {
  const [adding, setAdding]     = useState(false);
  const [title, setTitle]       = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate]   = useState('');
  const [assignee, setAssignee] = useState('');
  const [loading, setLoading]   = useState(false);
  const { setNodeRef }          = useDroppable({ id: column.id });

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/tasks', {
        columnId: column.id, title: title.trim(),
        priority, dueDate: dueDate || undefined,
        assigneeId: assignee || undefined,
      });
      onTaskAdded(data);
      setTitle(''); setPriority('medium'); setDueDate(''); setAssignee('');
      setAdding(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating task');
    } finally { setLoading(false); }
  };

  const dotColor = COL_COLORS[column.title] || '#8892b0';

  return (
    <div ref={setNodeRef} className="k-col">
      <div className="k-col-header">
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div className="k-col-dot" style={{ background: dotColor }}></div>
          <span className="k-col-title">{column.title}</span>
        </div>
        <span className="k-col-count">{tasks.length}</span>
      </div>

      <div className="k-col-body">
        {tasks.length === 0 && !adding && (
          <div style={{ textAlign:'center', padding:'16px 0', color:'var(--text3)', fontSize:12 }}>
            Drop tasks here
          </div>
        )}
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onDelete={onTaskDeleted} />
        ))}
      </div>

      <div className="k-col-footer">
        {adding ? (
          <div className="add-task-form">
            <input
              className="add-task-input"
              autoFocus
              placeholder="Task title…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
                if (e.key === 'Escape') { setAdding(false); setTitle(''); }
              }}
            />
            <div style={{ display:'flex', gap:6 }}>
              <select className="input" value={priority} onChange={e => setPriority(e.target.value)}
                style={{ fontSize:12, padding:'5px 8px', flex:1 }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input type="date" className="input" value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ fontSize:12, padding:'5px 8px', flex:1 }} />
            </div>
            {members.length > 0 && (
              <select className="input" value={assignee} onChange={e => setAssignee(e.target.value)}
                style={{ fontSize:12, padding:'5px 8px' }}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}
            <div className="add-task-actions">
              <button className="btn btn-primary btn-sm" onClick={submit}
                disabled={loading || !title.trim()}>
                {loading ? '…' : 'Add task'}
              </button>
              <button className="btn btn-ghost btn-sm"
                onClick={() => { setAdding(false); setTitle(''); }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button className="add-task-trigger" onClick={() => setAdding(true)}>
            <i className="ti ti-plus" style={{ fontSize:13 }}></i> Add a task
          </button>
        )}
      </div>
    </div>
  );
}