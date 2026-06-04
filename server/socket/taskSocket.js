module.exports = (io) => {
  io.on('connection', (socket) => {
    // Join a board room
    socket.on('join-board', (boardId) => {
      socket.join(`board:${boardId}`);
    });

    // Task created — broadcast to all in board room
    socket.on('task-created', ({ boardId, task }) => {
      socket.to(`board:${boardId}`).emit('task-created', task);
    });

    // Task moved (drag-and-drop)
    socket.on('task-moved', ({ boardId, taskId, columnId, position }) => {
      socket.to(`board:${boardId}`).emit('task-moved', { taskId, columnId, position });
    });

    // Task updated
    socket.on('task-updated', ({ boardId, task }) => {
      socket.to(`board:${boardId}`).emit('task-updated', task);
    });

    // Task deleted
    socket.on('task-deleted', ({ boardId, taskId }) => {
      socket.to(`board:${boardId}`).emit('task-deleted', taskId);
    });
  });
};