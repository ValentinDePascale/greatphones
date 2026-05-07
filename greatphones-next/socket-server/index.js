const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://greatphones.onrender.com'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Track online users: userId -> socketId
const onlineUsers = new Map();
// Track typing status per conversation: conversationId -> Set of userIds
const typingUsers = new Map();

io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    return next(new Error('Authentication required'));
  }
  socket.userId = userId;
  next();
});

io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.userId} (${socket.id})`);
  
  // Track online user
  onlineUsers.set(socket.userId, socket.id);
  
  // Broadcast online status
  io.emit('userOnline', { userId: socket.userId });

  // User joins a conversation room
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`[Socket] ${socket.userId} joined conversation ${conversationId}`);
  });

  // User leaves a conversation room
  socket.on('leaveConversation', (conversationId) => {
    socket.leave(conversationId);
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { conversationId, userName } = data;
    
    if (!typingUsers.has(conversationId)) {
      typingUsers.set(conversationId, new Map());
    }
    const convTyping = typingUsers.get(conversationId);
    convTyping.set(socket.userId, userName);
    
    // Broadcast to others in the room
    socket.to(conversationId).emit('userTyping', {
      userId: socket.userId,
      userName: userName || 'Alguien'
    });
    
    // Auto-clear typing after 3 seconds
    setTimeout(() => {
      if (convTyping.has(socket.userId)) {
        convTyping.delete(socket.userId);
        if (convTyping.size === 0) {
          typingUsers.delete(conversationId);
        }
        socket.to(conversationId).emit('userStoppedTyping', {
          userId: socket.userId
        });
      }
    }, 3000);
  });

  // Stop typing
  socket.on('stopTyping', (data) => {
    const { conversationId } = data;
    if (typingUsers.has(conversationId)) {
      const convTyping = typingUsers.get(conversationId);
      convTyping.delete(socket.userId);
      if (convTyping.size === 0) {
        typingUsers.delete(conversationId);
      }
    }
    socket.to(conversationId).emit('userStoppedTyping', {
      userId: socket.userId
    });
  });

  // Mark messages as read
  socket.on('markRead', (data) => {
    const { conversationId } = data;
    socket.to(conversationId).emit('messagesRead', {
      userId: socket.userId,
      conversationId
    });
  });

  // New message notification (for real-time broadcast)
  socket.on('messageSent', (data) => {
    const { conversationId, message } = data;
    io.to(conversationId).emit('newMessage', {
      ...message,
      fromUserId: socket.userId
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.userId} (${socket.id})`);
    onlineUsers.delete(socket.userId);
    
    // Clean up typing status
    typingUsers.forEach((convTyping, convId) => {
      convTyping.delete(socket.userId);
      if (convTyping.size === 0) {
        typingUsers.delete(convId);
      }
    });
    
    io.emit('userOffline', { userId: socket.userId });
  });
});

const PORT = process.env.CHAT_PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Socket] Chat server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Socket] Shutting down...');
  io.close();
  server.close();
});
