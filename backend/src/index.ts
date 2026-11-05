import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { apiRouter } from './controllers';
import { setupSocketGateway } from './socket';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Create HTTP and WebSocket server
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach WebRTC & Matchmaking Socket Gateway
setupSocketGateway(io);

server.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 Friends App Backend Service is running on port ${config.port}`);
  console.log(`📡 WebSocket Gateway ready for WebRTC signaling & matching`);
  console.log(`🌍 Health Check: http://localhost:${config.port}/health`);
  console.log(`====================================================`);
});

export { app, server, io };
