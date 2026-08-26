const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { setupSocketHandlers } = require('./socket-handlers');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const extraOrigins = (process.env.ALLOWED_ORIGINS_EXTRA || '').split(',')
    .map(s => s.trim()).filter(Boolean)
  const socketOrigins = [
    'http://localhost:3000',
    appUrl,
    'https://greatphones.com.ar',
    'https://www.greatphones.com.ar',
    'https://greatphones.onrender.com',
    ...extraOrigins,
  ]
  const io = new Server(server, {
    cors: {
      origin: (origin, cb) => {
        // Sin Origin dejarlo pasar y si está en la lista permitido. También
        // cualquier subdominio *.onrender.com (deploy Render) para no depender
        // del código al cambiar de dominio de preview.
        if (!origin || socketOrigins.indexOf(origin) !== -1) return cb(null, true)
        try {
          const hostname = new URL(origin).hostname
          if (hostname.endsWith('.onrender.com')) return cb(null, true)
        } catch (e) {}
        return cb(null, false)
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  globalThis.io = io;
  setupSocketHandlers(io);

  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || '0.0.0.0';
  server.listen(PORT, HOST, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT} (${dev ? 'development' : 'production'})`);
    if (HOST === '0.0.0.0') {
      console.log(`> LAN access: configure NEXTAUTH_URL=http://<your-ip>:${PORT} to test from other devices`);
    }
  });

  function shutdown() {
    console.log('[Server] Shutting down...');
    io.close();
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000);
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
});
