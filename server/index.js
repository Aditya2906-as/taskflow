require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');

const app        = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, credentials: true }
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Make io accessible in controllers
app.set('io', io);

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/boards',        require('./routes/boards'));
app.use('/api/tasks',         require('./routes/tasks'));
app.use('/api/invites',       require('./routes/invites'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat',          require('./routes/chat'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/ai',            require('./routes/ai'));
app.use('/api/wiki',          require('./routes/wiki'));

// Socket
require('./socket')(io);

httpServer.listen(process.env.PORT || 4000, () =>
  console.log(`Server on port ${process.env.PORT || 4000}`)
);