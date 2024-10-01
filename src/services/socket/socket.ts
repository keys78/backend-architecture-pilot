import { Server, Socket } from 'socket.io';
import http from 'http';

let io: Server;

export const initSocket = (server: http.Server) => {
  if (!io) {
    io = new Server(server, {
      transports: ['websocket'],
      cors: {
        origin: process.env.FRONTEND_BASE_URL,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      },
    });

    io.on('connection', (socket: Socket) => {
      console.log('New client connected (backend hail)');

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
