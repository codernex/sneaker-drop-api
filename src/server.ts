import "tsconfig-paths/register";
import http from "http";
import createApp from "./app";
import { initSocket } from "./lib/socket";
import { startExpiryJob } from "./jobs/expiryJob";
import { prisma } from "./lib/prisma";
import env from "./config/env";

const app = createApp();
const httpServer = http.createServer(app);

let booted = false;

const boot = async (): Promise<void> => {
  if (booted) return;
  booted = true;

  await prisma.$connect();
  console.log("[db] Connected to PostgreSQL");

  initSocket(httpServer);
  console.log("[socket] Socket.io initialized");

  startExpiryJob();
};

if (env.NODE_ENV !== "production") {
  boot()
    .then(() => {
      httpServer.listen(env.PORT, () => {
        console.log(`[server] Running in ${env.NODE_ENV} mode`);
        console.log(`[server] HTTP  → http://localhost:${env.PORT}`);
        console.log(`[server] WS    → ws://localhost:${env.PORT}`);
      });

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
    })
    .catch((err) => {
      console.error("[server] Failed to start:", err);
      process.exit(1);
    });
}

if (env.NODE_ENV === "production") {
  boot().catch(console.error);
}

export default httpServer;
