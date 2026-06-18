"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
require("tsconfig-paths/register");
const app_1 = __importDefault(require("./app"));
const socket_1 = require("./lib/socket");
const expiryJob_1 = require("./jobs/expiryJob");
const prisma_1 = require("./lib/prisma");
const env_1 = __importDefault(require("./config/env"));
const bootstrap = async () => {
    await prisma_1.prisma.$connect();
    console.log("[db] Connected to PostgreSQL");
    const app = (0, app_1.default)();
    const httpServer = http_1.default.createServer(app);
    (0, socket_1.initSocket)(httpServer);
    console.log("[socket] Socket.io initialized");
    (0, expiryJob_1.startExpiryJob)();
    httpServer.listen(env_1.default.PORT, () => {
        console.log(`[server] Running in ${env_1.default.NODE_ENV} mode`);
        console.log(`[server] HTTP  → http://localhost:${env_1.default.PORT}`);
        console.log(`[server] WS    → ws://localhost:${env_1.default.PORT}`);
    });
    const shutdown = async (signal) => {
        console.log(`\n[server] ${signal} received — shutting down gracefully`);
        httpServer.close(async () => {
            await prisma_1.prisma.$disconnect();
            console.log("[db] Disconnected");
            process.exit(0);
        });
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
};
bootstrap().catch((err) => {
    console.error("[server] Failed to start:", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map