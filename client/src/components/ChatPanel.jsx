import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';

const AVATAR_COLORS = ['#5b8def','#34d399','#a78bfa','#fbbf24','#f87171','#22d3ee'];
const colorFor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

export default function ChatPanel({ boardId, socket, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [typing, setTyping]     = useState('');
  const bottomRef = useRef();
  const typingTimer = useRef();

  useEffect(() => {
    api.get(`/chat/${boardId}`).then(({ data }) => setMessages(data));
  }, [boardId]);

  useEffect(() => {
    if (!socket) return;

    const onMsg = (msg) => {
      setMessages(p => [...p, msg]);
    };
    const onTyping = (name) => {
      setTyping(`${name} is typing…`);
    };
    const onStop = () => setTyping('');

    socket.on('new-message', onMsg);
    socket.on('user-typing', onTyping);
    socket.on('user-stop-typing', onStop);

    return () => {
      socket.off('new-message', onMsg);
      socket.off('user-typing', onTyping);
      socket.off('user-stop-typing', onStop);
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInput = (e) => {
    setText(e.target.value);
    socket?.emit('typing', { boardId, userName: user.name });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.emit('stop-typing', { boardId });
    }, 1500);
  };

  const send = () => {
    if (!text.trim()) return;
    socket?.emit('send-message', { boardId, userId: user.id, message: text.trim() });
    setText('');
    socket?.emit('stop-typing', { boardId });
  };

  return (
    <div className="chat-panel">
      <div className="chat-hdr">
        <i className="ti ti-message-circle" style={{ fontSize:15, color:'var(--accent)' }}></i>
        <span className="chat-hdr-title">Board Chat</span>
        <div style={{ flex:1 }} />
        <button className="modal-close" onClick={onClose}>
          <i className="ti ti-x" style={{ fontSize:14 }}></i>
        </button>
      </div>

      <div className="chat-body">
        {messages.length === 0 && (
          <div style={{ textAlign:'center', padding:'24px 12px', color:'var(--text3)', fontSize:13 }}>
            No messages yet. Say hello!
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.user_id === user.id;
          return (
            <div key={msg.id} className={`chat-msg ${isMe ? 'mine' : 'theirs'}`}>
              {!isMe && (
                <div className="chat-avatar" style={{ background: colorFor(msg.sender_name) }}>
                  {msg.sender_name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="chat-bubble-wrap">
                {!isMe && <div className="chat-sender">{msg.sender_name}</div>}
                <div className={`chat-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                  {msg.message}
                </div>
                <div className="chat-time">
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div style={{ fontSize:11, color:'var(--text3)', padding:'4px 12px' }}>{typing}</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-footer">
        <input
          className="input"
          placeholder="Message the team…"
          value={text}
          onChange={handleInput}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          style={{ flex:1, borderRadius:'8px 0 0 8px', borderRight:'none' }}
        />
        <button className="btn btn-primary" onClick={send}
          style={{ borderRadius:'0 8px 8px 0', padding:'9px 14px' }}>
          <i className="ti ti-send" style={{ fontSize:14 }}></i>
        </button>
      </div>
    </div>
  );
}