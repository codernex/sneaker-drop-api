/**
 * Base error class for all application errors.
 *
 * isOperational = true  → expected, user-facing error (4xx / known 5xx).
 *                         The global handler sends a structured JSON response.
 * isOperational = false → unexpected bug / programmer error.
 *                         The global handler logs it and returns a generic 500.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  /** Optional machine-readable error code (e.g. "OUT_OF_STOCK"). */
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number,
    options: { code?: string; isOperational?: boolean } = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = options.isOperational ?? true;
    this.code = options.code;

    // Maintains proper prototype chain in transpiled JS
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture a clean stack trace (strips this constructor from the trace)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
