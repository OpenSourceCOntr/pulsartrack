import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import apiRoutes from './api/routes';
import { errorHandler, rateLimit } from './middleware/auth';
import { setupWebSocketServer } from './services/websocket-server';
import { checkDbConnection } from './config/database';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit(200, 60_000));

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Create HTTP server for both REST and WebSocket
const server = createServer(app);

// Attach WebSocket server
setupWebSocketServer(server);

// Start server
async function start() {
  // Check DB (non-blocking)
  const dbOk = await checkDbConnection();
  if (!dbOk) {
    console.warn('[DB] Could not connect to PostgreSQL - running without DB');
  } else {
    console.log('[DB] PostgreSQL connected');
  }

  server.listen(PORT, () => {
    console.log(`[PulsarTrack API] Listening on http://localhost:${PORT}`);
    console.log(`[PulsarTrack WS]  WebSocket on ws://localhost:${PORT}/ws`);
    console.log(`[Network]         ${process.env.STELLAR_NETWORK || 'testnet'}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
