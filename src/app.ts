import express from "express";
import cors from "cors";
import env from "@/config/env";
import { globalErrorHandler } from "./middleware/errorHandler";
import { NotFoundError } from "./errors";

// Routes
import dropsRouter from "@/api/v1/modules/drops/drops.routes";
import reservationsRouter from "@/api/v1/modules/reservations/reservations.routes";
import purchasesRouter from "@/api/v1/modules/purchases/purchases.routes";
import usersRouter from "@/api/v1/modules/users/users.routes";

const createApp = () => {
  const app = express();

  // ── Middleware ──────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Health check ────────────────────────────────────────────────────────────
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ── API Routes ──────────────────────────────────────────────────────────────
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/drops", dropsRouter);
  app.use("/api/v1/reservations", reservationsRouter);
  app.use("/api/v1/purchases", purchasesRouter);

  // ── 404 — must come after all routes ────────────────────────────────────────
  app.use((_req, _res, next) => {
    next(new NotFoundError("The requested route does not exist"));
  });

  // ── Global error handler — must be the LAST middleware ──────────────────────
  app.use(globalErrorHandler);

  return app;
};

export default createApp;
