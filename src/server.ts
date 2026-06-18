import http from "http";
import 'tsconfig-paths/register';
import createApp from "./app";
import { initSocket } from "./lib/socket";
import { startExpiryJob } from "./jobs/expiryJob";
import { prisma } from "./lib/prisma";
import env from "./config/env";

const bootstrap = async () => {
  // 1. Verify DB connection
  await prisma.$connect();
  console.log("[db] Connected to PostgreSQL");

  // 2. Build Express app
  const app = createApp();

  // 3. Wrap in HTTP server (required for Socket.io to share the same port)
  const httpServer = http.createServer(app);

  // 4. Initialize Socket.io (must happen before any route/job calls getIO())
  initSocket(httpServer);
  console.log("[socket] Socket.io initialized");

  // 5. Start the background reservation-expiry job
  startExpiryJob();

  // 6. Listen
  httpServer.listen(env.PORT, () => {
    console.log(`[server] Running in ${env.NODE_ENV} mode`);
    console.log(`[server] HTTP  → http://localhost:${env.PORT}`);
    console.log(`[server] WS    → ws://localhost:${env.PORT}`);
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n[server] ${signal} received — shutting down gracefully`);
    httpServer.close(async () => {
      await prisma.$disconnect();
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
