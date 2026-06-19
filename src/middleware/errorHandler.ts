import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import env from "@/config/env";

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  code?: string;
  /** Only included in development for non-operational errors */
  stack?: string;
}

export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // ── Operational (known) AppError ────────────────────────────────────────────
  if (err instanceof AppError && err.isOperational) {
    const body: ErrorResponse = {
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      ...(err.code && { code: err.code }),
    };

    res.status(err.statusCode).json(body);
    return;
  }

  // ── Unexpected / non-operational error ──────────────────────────────────────
  const error = err instanceof Error ? err : new Error(String(err));

  console.error("[unhandled-error]", {
    message: error.message,
    stack: error.stack,
    ...(err instanceof AppError && { code: err.code }),
  });

  const body: ErrorResponse = {
    success: false,
    statusCode: 500,
    message: "An unexpected error occurred. Please try again later.",
    ...(env.NODE_ENV === "development" && { stack: error.stack }),
  };

  res.status(500).json(body);
};
