/**
 * Shared Socket.IO event handlers.
 * Used by server.js for both development and production.
 */

const { Pool } = require('pg');
const IORedis = require('ioredis');

let pool = null;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

let redis = null;
let redisAvailable = false;
function getRedis() {
  if (redis === null && process.env.REDIS_URL) {
    try {
      const url = process.env.REDIS_URL;
      const useTls = url.startsWith('rediss://');
      redis = new IORedis(url, {
        maxRetriesPerRequest: 2,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 500, 2000);
        },
        connectTimeout: 10000,
        enableOfflineQueue: false,
        tls: useTls ? {} : undefined,
        lazyConnect: true,
      });
      redis.on('error', () => { redisAvailable = false; });
      redis.connect().then(() => {
        redisAvailable = true;
        console.log('[Socket] Redis connected — shared presence/typing enabled');
      }).catch(() => {
        console.log('[Socket] Redis unavailable — using in-memory state');
        redisAvailable = false;
        redis.disconnect();
      });
    } catch {
      console.log('[Socket] Redis init failed — using in-memory state');
      redis = null;
      redisAvailable = false;
    }
  }
  return redisAvailable && redis.status === 'ready' ? redis : null;
}

function setupSocketHandlers(io) {
  const onlineUsers = new Map();
  const typingUsers = new Map();
  const typingTimeouts = new Map();
  const r = getRedis();

  io.use(async (socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie || '';
      const sessionMatch = rawCookie.match(/(?:^|;\s*)next-auth\.session-token=([^;]+)/);
      const secureMatch = rawCookie.match(/(?:^|;\s*)__Secure-next-auth\.session-token=([^;]+)/);
      const sessionToken = secureMatch?.[1] || sessionMatch?.[1];

      if (sessionToken) {
        const db = getPool();
        const result = await db.query(
          'SELECT "userId" FROM "Session" WHERE "sessionToken" = $1 AND "expires" > NOW()',
          [sessionToken]
        );

        if (result.rows.length > 0) {
          socket.userId = result.rows[0].userId;
          socket._authMethod = 'session';
          return next();
        }
      }

      const userId = socket.handshake.auth.userId;
      if (userId) {
        console.warn(`[Socket] Legacy auth for userId=${userId} — upgrade client to use session token`);
        socket.userId = userId;
        socket._authMethod = 'legacy';
        return next();
      }

      next(new Error('Authentication required'));
    } catch (err) {
      console.error('[Socket] Auth error:', err.message);
      const userId = socket.handshake.auth.userId;
      if (userId) {
        socket.userId = userId;
        socket._authMethod = 'legacy';
        return next();
      }
      next(new Error('Authentication required'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.userId} (${socket.id})`);

    if (r) {
      r.set(`presence:${socket.userId}`, socket.id, 'EX', 60).catch(() => {});
    }
    onlineUsers.set(socket.userId, socket.id);
    socket.join(socket.userId);
    io.emit('userOnline', { userId: socket.userId });

    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
    });

    socket.on('typing', (data) => {
      const { conversationId, userName } = data;
      const displayName = userName || 'Alguien';

      if (r) {
        r.set(`typing:${conversationId}:${socket.userId}`, displayName, 'EX', 5).catch(() => {});
      } else {
        if (!typingUsers.has(conversationId)) typingUsers.set(conversationId, new Map());
        typingUsers.get(conversationId).set(socket.userId, displayName);
      }

      socket.to(conversationId).emit('userTyping', { userId: socket.userId, userName: displayName });

      const timeoutKey = `${conversationId}:${socket.userId}`;
      if (typingTimeouts.has(timeoutKey)) clearTimeout(typingTimeouts.get(timeoutKey));

      const timeoutId = setTimeout(() => {
        typingTimeouts.delete(timeoutKey);
        if (r) {
          r.del(`typing:${conversationId}:${socket.userId}`).catch(() => {});
        } else {
          if (typingUsers.has(conversationId)) {
            typingUsers.get(conversationId).delete(socket.userId);
            if (typingUsers.get(conversationId).size === 0) typingUsers.delete(conversationId);
          }
        }
        socket.to(conversationId).emit('userStoppedTyping', { userId: socket.userId });
      }, 3000);
      typingTimeouts.set(timeoutKey, timeoutId);
    });

    socket.on('stopTyping', (data) => {
      const { conversationId } = data;
      const timeoutKey = `${conversationId}:${socket.userId}`;
      if (typingTimeouts.has(timeoutKey)) {
        clearTimeout(typingTimeouts.get(timeoutKey));
        typingTimeouts.delete(timeoutKey);
      }
      if (r) {
        r.del(`typing:${conversationId}:${socket.userId}`).catch(() => {});
      } else if (typingUsers.has(conversationId)) {
        typingUsers.get(conversationId).delete(socket.userId);
        if (typingUsers.get(conversationId).size === 0) typingUsers.delete(conversationId);
      }
      socket.to(conversationId).emit('userStoppedTyping', { userId: socket.userId });
    });

    socket.on('markRead', (data) => {
      socket.to(data.conversationId).emit('messagesRead', { userId: socket.userId, conversationId: data.conversationId });
    });

    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.userId}`);

      if (r) {
        r.del(`presence:${socket.userId}`).catch(() => {});
      }
      onlineUsers.delete(socket.userId);

      typingUsers.forEach((convTyping, convId) => {
        const timeoutKey = `${convId}:${socket.userId}`;
        if (typingTimeouts.has(timeoutKey)) {
          clearTimeout(typingTimeouts.get(timeoutKey));
          typingTimeouts.delete(timeoutKey);
        }
        convTyping.delete(socket.userId);
        if (convTyping.size === 0) typingUsers.delete(convId);
      });

      io.emit('userOffline', { userId: socket.userId });
    });
  });

  return io;
}

module.exports = { setupSocketHandlers };
