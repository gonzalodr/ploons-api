import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { chatSocketHandler } from '@sockets/chat.socket';

let io_server: Server;

import { socketAuthMiddleware } from '@middlewares/socketAuth.middleware';

// In-memory store for online users: Map<userId, socketId[]> (supports multiple tabs)
export const onlineUsers = new Map<string, Set<string>>();

export const initSocket = (server: HttpServer) => {
  io_server = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  //validate authorization
  io_server.use(socketAuthMiddleware);

  io_server.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`🔌 User ${userId} connected on socket ${socket.id}`);

    // Join room for this user (handles multiple tabs automatically)
    socket.join(userId);

    // Manage online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      io_server.emit('user_status', { userId, status: 'online' });
    }
    onlineUsers.get(userId)?.add(socket.id);

    // Register handlers
    chatSocketHandler(io_server, socket);

    socket.on('disconnect', () => {
      const uId = socket.data.userId;
      const connections = onlineUsers.get(uId);
      if (connections) {
        connections.delete(socket.id);
        if (connections.size === 0) {
          onlineUsers.delete(uId);
          io_server.emit('user_status', { userId: uId, status: 'offline' });
        }
      }
    });
  });

  return io_server;
};

export const getIo_server = () => {
  if (!io_server) {
    throw new Error('Socket.io not initialized!');
  }
  return io_server;
};
