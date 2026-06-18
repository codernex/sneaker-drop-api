"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const AppError_1 = require("../errors/AppError");
const env_1 = __importDefault(require("../config/env"));
const globalErrorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError_1.AppError && err.isOperational) {
        const body = {
            success: false,
            statusCode: err.statusCode,
            message: err.message,
            ...(err.code && { code: err.code }),
        };
        res.status(err.statusCode).json(body);
        return;
    }
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[unhandled-error]", {
        message: error.message,
        stack: error.stack,
        ...(err instanceof AppError_1.AppError && { code: err.code }),
    });
    const body = {
        success: false,
        statusCode: 500,
        message: "An unexpected error occurred. Please try again later.",
        ...(env_1.default.NODE_ENV === "development" && { stack: error.stack }),
    };
    res.status(500).json(body);
};
exports.globalErrorHandler = globalErrorHandler;
//# sourceMappingURL=errorHandler.js.map