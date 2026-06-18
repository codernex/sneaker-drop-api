"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailableError = exports.InternalServerError = exports.TooManyRequestsError = exports.UnprocessableError = exports.GoneError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = void 0;
const AppError_1 = require("./AppError");
class BadRequestError extends AppError_1.AppError {
    constructor(message = "Bad request", code) {
        super(message, 400, { code });
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError_1.AppError {
    constructor(message = "Unauthorized", code) {
        super(message, 401, { code });
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError_1.AppError {
    constructor(message = "Forbidden", code) {
        super(message, 403, { code });
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError_1.AppError {
    constructor(message = "Resource not found", code) {
        super(message, 404, { code });
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError_1.AppError {
    constructor(message = "Conflict", code) {
        super(message, 409, { code });
    }
}
exports.ConflictError = ConflictError;
class GoneError extends AppError_1.AppError {
    constructor(message = "Resource no longer available", code) {
        super(message, 410, { code });
    }
}
exports.GoneError = GoneError;
class UnprocessableError extends AppError_1.AppError {
    constructor(message = "Unprocessable entity", code) {
        super(message, 422, { code });
    }
}
exports.UnprocessableError = UnprocessableError;
class TooManyRequestsError extends AppError_1.AppError {
    constructor(message = "Too many requests", code) {
        super(message, 429, { code });
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class InternalServerError extends AppError_1.AppError {
    constructor(message = "Internal server error", code) {
        super(message, 500, { code, isOperational: false });
    }
}
exports.InternalServerError = InternalServerError;
class ServiceUnavailableError extends AppError_1.AppError {
    constructor(message = "Service temporarily unavailable", code) {
        super(message, 503, { code });
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
//# sourceMappingURL=HttpErrors.js.map