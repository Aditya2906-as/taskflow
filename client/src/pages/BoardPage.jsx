import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, closestCorners, PointerSensor,
  useSensor, useSensors
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Column from '../components/Column';
import ChatPanel from '../components/ChatPanel';
import InviteModal from '../components/InviteModal';

export default function BoardPage() {
  const { id }       = useParams();
  const { user }     = useAuth();
  const { socket }   = useSocket();
  const navigate     = useNavigate();

  const [board, setBoard]     = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks]     = useState([]);
  const [members, setMembers] = useState([]);
  const [showChat, setShowChat]     = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 }
  }));

  const loadBoard = useCallback(async () => {
    try {
      const { data } = await api.get(`/boards/${id}`);
      setBoard(data.board);
      setColumns(data.columns);
      setTasks(data.tasks);
      setMembers(data.members);
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join-board', id);

    const onCreated  = (task) => setTasks(p => [...p, task]);
    const onUpdated  = (task) => setTasks(p => p.map(t => t.id === task.id ? task : t));
    const onDeleted  = (tid)  => setTasks(p => p.filter(t => t.id !== tid));
    const onMoved    = ({ taskId, columnId, position }) =>
      setTasks(p => p.map(t => t.id === taskId ? { ...t, column_id: columnId, position } : t));

    socket.on('task-created', onCreated);
    socket.on('task-updated', onUpdated);
    socket.on('task-deleted', onDeleted);
    socket.on('task-moved',   onMoved);

    return () => {
      socket.emit('leave-board', id);
      socket.off('task-created', onCreated);
      socket.off('task-updated', onUpdated);
      socket.off('task-deleted', onDeleted);
      socket.off('task-moved',   onMoved);
    };
  }, [socket, id]);

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const overTask     = tasks.find(t => t.id === over.id);
    const newColumnId  = overTask?.column_id || over.id;
    const colTasks     = tasks
      .filter(t => t.column_id === newColumnId)
      .sort((a, b) => a.position - b.position);

    const withActive   = colTasks.find(t => t.id === active.id)
      ? colTasks
      : [...colTasks, activeTask];
    const oldIdx = withActive.findIndex(t => t.id === active.id);
    const newIdx = overTask ? colTasks.findIndex(t => t.id === over.id) : colTasks.length;
    const reordered = arrayMove(withActive, oldIdx, newIdx < 0 ? withActive.length - 1 : newIdx);

    setTasks(prev =>
      prev.map(t => {
        const idx = reordered.findIndex(r => r.id === t.id);
        return idx !== -1 ? { ...t, column_id: newColumnId, position: idx } : t;
      })
    );

    try {
      await api.patch(`/tasks/${active.id}`, { columnId: newColumnId, position: newIdx < 0 ? colTasks.length : newIdx });
      socket?.emit('task-moved', { boardId: id, taskId: active.id, columnId: newColumnId, position: newIdx });
    } catch {}
  };

  const onTaskAdded = (task) => {
    setTasks(p => [...p, task]);
    socket?.emit('task-created', { boardId: id, task });
  };

  const onTaskDeleted = async (taskId) => {
    setTasks(p => p.filter(t => t.id !== taskId));
    try {
      await api.delete(`/tasks/${taskId}`);
      socket?.emit('task-deleted', { boardId: id, taskId });
    } catch {}
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 52px)' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="board-page">
      {/* Top bar */}
      <div className="board-topbar">
        <button className="icon-btn" onClick={() => navigate('/')}>
          <i className="ti ti-arrow-left" style={{ fontSize:15 }}></i>
        </button>
        <span className="board-topbar-title">{board?.name}</span>
        <div className="board-topbar-sp" />

        {/* Members avatars */}
        <div style={{ display:'flex', alignItems:'center', gap:4, marginRight:12 }}>
          {members.slice(0, 4).map((m, i) => (
            <div key={m.id} title={m.name} className="avatar" style={{
              width:26, height:26, fontSize:10,
              marginLeft: i > 0 ? -6 : 0,
              border:'2px solid var(--bg2)',
              zIndex: members.length - i
            }}>
              {m.name?.[0]?.toUpperCase()}
            </div>
          ))}
          {members.length > 4 && (
            <span style={{ fontSize:11, color:'var(--text3)', marginLeft:4 }}>
              +{members.length - 4}
            </span>
          )}
        </div>

        <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(true)}>
          <i className="ti ti-user-plus" style={{ fontSize:13 }}></i> Invite
        </button>
        <button
          className={`btn btn-sm ${showChat ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowChat(v => !v)}
        >
          <i className="ti ti-message-circle" style={{ fontSize:13 }}></i> Chat
        </button>
      </div>

      {/* Board + Chat layout */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Kanban columns */}
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="board-columns-wrap" style={{ flex:1 }}>
            {columns.map(col => (
              <SortableContext
                key={col.id}
                items={tasks.filter(t => t.column_id === col.id).map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <Column
                  column={col}
                  tasks={tasks
                    .filter(t => t.column_id === col.id)
                    .sort((a, b) => a.position - b.position)}
                  boardId={id}
                  socket={socket}
                  members={members}
                  onTaskAdded={onTaskAdded}
                  onTaskDeleted={onTaskDeleted}
                />
              </SortableContext>
            ))}
          </div>
        </DndContext>

        {/* Chat panel */}
        {showChat && (
          <ChatPanel
            boardId={id}
            socket={socket}
            user={user}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>

      {showInvite && (
        <InviteModal boardId={id} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}