const pool = require('../db');
const { randomUUID } = require('crypto');

// Track userId → socketId for direct pushes
const onlineUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {

    // Register user presence
    socket.on('register', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user:${userId}`);
      io.emit('user-online', userId);
    });

    // Join board room
    socket.on('join-board', (boardId) => {
      socket.join(`board:${boardId}`);
    });

    socket.on('leave-board', (boardId) => {
      socket.leave(`board:${boardId}`);
    });

    // ── Task events ──
    socket.on('task-created', ({ boardId, task }) => {
      socket.to(`board:${boardId}`).emit('task-created', task);
    });
    socket.on('task-moved', (payload) => {
      socket.to(`board:${payload.boardId}`).emit('task-moved', payload);
    });
    socket.on('task-updated', ({ boardId, task }) => {
      socket.to(`board:${boardId}`).emit('task-updated', task);
    });
    socket.on('task-deleted', ({ boardId, taskId }) => {
      socket.to(`board:${boardId}`).emit('task-deleted', taskId);
    });

    // ── Group chat ──
    socket.on('send-message', async ({ boardId, userId, message }) => {
      try {
        const id = randomUUID();
        await pool.query(
          'INSERT INTO chat_messages (id, board_id, user_id, message) VALUES (?,?,?,?)',
          [id, boardId, userId, message]
        );
        const [[msg]] = await pool.query(
          `SELECT cm.*, u.name AS sender_name FROM chat_messages cm
           JOIN users u ON u.id = cm.user_id WHERE cm.id = ?`,
          [id]
        );
        // Broadcast to all in board (including sender)
        io.to(`board:${boardId}`).emit('new-message', msg);
      } catch (err) {
        console.error('Chat error:', err.message);
      }
    });

    // Typing indicator
    socket.on('typing', ({ boardId, userName }) => {
      socket.to(`board:${boardId}`).emit('user-typing', userName);
    });
    socket.on('stop-typing', ({ boardId }) => {
      socket.to(`board:${boardId}`).emit('user-stop-typing');
    });

    // ── Dashboard refresh trigger ──
    socket.on('refresh-dashboard', (userId) => {
      socket.to(`user:${userId}`).emit('refresh-dashboard');
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('user-offline', socket.userId);
      }
    });

    socket.on('send-message', async ({ boardId, userId, message }) => {
  try {
    const id = randomUUID();
    await pool.query(
      'INSERT INTO chat_messages (id, board_id, user_id, message) VALUES (?,?,?,?)',
      [id, boardId, userId, message]
    );
    const [[msg]] = await pool.query(
      `SELECT cm.*, u.name AS sender_name FROM chat_messages cm
       JOIN users u ON u.id = cm.user_id WHERE cm.id = ?`,
      [id]
    );

    // Broadcast message to board room (all members)
    io.to(`board:${boardId}`).emit('new-message', msg);

    // Get all board members except sender
    const [members] = await pool.query(
      `SELECT u.id FROM users u
       JOIN board_members bm ON bm.user_id = u.id
       WHERE bm.board_id = ? AND u.id != ?
       UNION
       SELECT b.owner_id AS id FROM boards b
       WHERE b.id = ? AND b.owner_id != ?`,
      [boardId, userId, boardId, userId]
    );

    // Get board name
    const [[board]] = await pool.query('SELECT name FROM boards WHERE id=?', [boardId]);

    // Push chat notification to each offline/other member
    for (const member of members) {
      const notifId = randomUUID();
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, body, data)
         VALUES (?, ?, 'chat', ?, ?, ?)`,
        [
          notifId,
          member.id,
          `New message in ${board.name}`,
          `${msg.sender_name}: ${message.slice(0, 80)}${message.length > 80 ? '…' : ''}`,
          JSON.stringify({ boardId, senderName: msg.sender_name })
        ]
      );
      // Real-time push to user's personal room
      io.to(`user:${member.id}`).emit('new-notification', {
        id: notifId,
        type: 'chat',
        title: `New message in ${board.name}`,
        body: `${msg.sender_name}: ${message.slice(0, 80)}${message.length > 80 ? '…' : ''}`,
        data: { boardId, senderName: msg.sender_name },
        is_read: false,
        created_at: new Date()
      });
    }
  } catch (err) {
    console.error('Chat error:', err.message);
  }
});
  });

  

  // Export helper so controllers can push to specific users
  io.sendToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };
};