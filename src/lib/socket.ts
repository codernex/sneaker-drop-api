import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import env from "../config/env";

let io: SocketIOServer;

/**
 * Initialize the Socket.io server.
 * Must be called once at app startup before any module tries to call getIO().
 */
export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] Client connected: ${socket.id}`);

    // Allow clients to subscribe to a specific drop room for targeted events
    socket.on("drop:join", (dropId: string) => {
      socket.join(`drop:${dropId}`);
      console.log(`[socket] ${socket.id} joined drop:${dropId}`);
    });

    socket.on("drop:leave", (dropId: string) => {
      socket.leave(`drop:${dropId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Returns the initialized Socket.io server instance.
 * Throws if initSocket() has not been called yet.
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error(
      "Socket.io has not been initialized. Call initSocket(httpServer) first."
    );
  }
  return io;
};
