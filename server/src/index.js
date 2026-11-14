require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');
const { connectDb } = require('./config/db');
const { setupSocket } = require('./socket');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';
const clientOrigin =
  process.env.CLIENT_ORIGIN || (isProduction ? false : 'http://localhost:5173');
const corsOrigin = clientOrigin || true;

const io = new Server(server, {
  cors: { origin: corsOrigin, credentials: true },
});

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

setupSocket(io);

const clientDist = path.join(__dirname, '../../client/dist');
if (isProduction) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const port = Number(process.env.PORT) || 5000;

connectDb()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });