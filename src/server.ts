import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { connectDB } from './config/database';

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);

export const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Socket disconnected: ${socket.id}`));
});

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`VoiceBank API running on port ${PORT}`);
  });
});
