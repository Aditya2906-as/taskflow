import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function TaskCard({ task, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  const initials  = task.assignee_name
    ?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div ref={setNodeRef} style={style}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      {...attributes} {...listeners}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:6 }}>
        <div className="task-card-title">{task.title}</div>
        <button
          className="task-delete-btn"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(task.id); }}
          title="Delete task"
        >
          <i className="ti ti-x" style={{ fontSize:11 }}></i>
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
            <i className="ti ti-calendar" style={{ fontSize:10 }}></i>
            {new Date(task.due_date).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
          </span>
        )}
        {initials && (
          <div className="task-assignee-mini" title={task.assignee_name}>{initials}</div>
        )}
      </div>
    </div>
  );
}