"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getConfig = () => {
    const { NODE_ENV, PORT, DATABASE_URL, CLIENT_URL, RESERVATION_TTL_SECONDS } = process.env;
    if (!DATABASE_URL) {
        throw new Error("Missing required env variable: DATABASE_URL");
    }
    return {
        NODE_ENV: NODE_ENV ?? "development",
        PORT: PORT ? Number(PORT) : 4000,
        DATABASE_URL,
        CLIENT_URL: CLIENT_URL ?? "http://localhost:5173",
        RESERVATION_TTL_SECONDS: RESERVATION_TTL_SECONDS
            ? Number(RESERVATION_TTL_SECONDS)
            : 60,
    };
};
const env = getConfig();
exports.default = env;
//# sourceMappingURL=env.js.map