"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const env_1 = __importDefault(require("../config/env"));
let io;
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.default.CLIENT_URL,
            methods: ["GET", "POST"],
        },
    });
    io.on("connection", (socket) => {
        console.log(`[socket] Client connected: ${socket.id}`);
        socket.on("drop:join", (dropId) => {
            socket.join(`drop:${dropId}`);
            console.log(`[socket] ${socket.id} joined drop:${dropId}`);
        });
        socket.on("drop:leave", (dropId) => {
            socket.leave(`drop:${dropId}`);
        });
        socket.on("disconnect", () => {
            console.log(`[socket] Client disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io has not been initialized. Call initSocket(httpServer) first.");
    }
    return io;
};
exports.getIO = getIO;
//# sourceMappingURL=socket.js.map