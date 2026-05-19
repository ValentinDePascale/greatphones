const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const onlineUsers = new Map();
const typingUsers = new Map();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'https://greatphones.onrender.com'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) return next(new Error('Authentication required'));
    socket.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.userId} (${socket.id})`);
    onlineUsers.set(socket.userId, socket.id);
    io.emit('userOnline', { userId: socket.userId });

    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
    });

    socket.on('typing', (data) => {
      const { conversationId, userName } = data;
      if (!typingUsers.has(conversationId)) typingUsers.set(conversationId, new Map());
      const convTyping = typingUsers.get(conversationId);
      convTyping.set(socket.userId, userName);
      socket.to(conversationId).emit('userTyping', { userId: socket.userId, userName: userName || 'Alguien' });
      setTimeout(() => {
        if (convTyping.has(socket.userId)) {
          convTyping.delete(socket.userId);
          if (convTyping.size === 0) typingUsers.delete(conversationId);
          socket.to(conversationId).emit('userStoppedTyping', { userId: socket.userId });
        }
      }, 3000);
    });

    socket.on('stopTyping', (data) => {
      const { conversationId } = data;
      if (typingUsers.has(conversationId)) {
        const convTyping = typingUsers.get(conversationId);
        convTyping.delete(socket.userId);
        if (convTyping.size === 0) typingUsers.delete(conversationId);
      }
      socket.to(conversationId).emit('userStoppedTyping', { userId: socket.userId });
    });

    socket.on('markRead', (data) => {
      socket.to(data.conversationId).emit('messagesRead', { userId: socket.userId, conversationId: data.conversationId });
    });

    socket.on('messageSent', (data) => {
      io.to(data.conversationId).emit('newMessage', { ...data.message, fromUserId: socket.userId });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.userId}`);
      onlineUsers.delete(socket.userId);
      typingUsers.forEach((convTyping, convId) => {
        convTyping.delete(socket.userId);
        if (convTyping.size === 0) typingUsers.delete(convId);
      });
      io.emit('userOffline', { userId: socket.userId });
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`[Socket] Integrated Socket.IO server running`);
  });
});
