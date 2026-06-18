import { AppError } from "./AppError";

// ─── 4xx Client Errors ────────────────────────────────────────────────────────

/** 400 Bad Request — invalid input / validation failure */
export class BadRequestError extends AppError {
  constructor(message = "Bad request", code?: string) {
    super(message, 400, { code });
  }
}

/** 401 Unauthorized — missing / invalid credentials */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code?: string) {
    super(message, 401, { code });
  }
}

/** 403 Forbidden — authenticated but not permitted */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code?: string) {
    super(message, 403, { code });
  }
}

/** 404 Not Found */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code?: string) {
    super(message, 404, { code });
  }
}

/** 409 Conflict — e.g. duplicate resource, oversell contention */
export class ConflictError extends AppError {
  constructor(message = "Conflict", code?: string) {
    super(message, 409, { code });
  }
}

/** 410 Gone — e.g. reservation expired */
export class GoneError extends AppError {
  constructor(message = "Resource no longer available", code?: string) {
    super(message, 410, { code });
  }
}

/** 422 Unprocessable Entity — semantically invalid request */
export class UnprocessableError extends AppError {
  constructor(message = "Unprocessable entity", code?: string) {
    super(message, 422, { code });
  }
}

/** 429 Too Many Requests */
export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", code?: string) {
    super(message, 429, { code });
  }
}

// ─── 5xx Server Errors ────────────────────────────────────────────────────────

/**
 * 500 Internal Server Error — use sparingly; only for truly unexpected states.
 * isOperational = false so the global handler treats it as a non-recoverable bug.
 */
export class InternalServerError extends AppError {
  constructor(message = "Internal server error", code?: string) {
    super(message, 500, { code, isOperational: false });
  }
}

/** 503 Service Unavailable — e.g. DB temporarily down */
export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable", code?: string) {
    super(message, 503, { code });
  }
}
