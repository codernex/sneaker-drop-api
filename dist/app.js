"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = __importDefault(require("./config/env"));
const errorHandler_1 = require("./middleware/errorHandler");
const errors_1 = require("./errors");
const drops_routes_1 = __importDefault(require("./api/v1/modules/drops/drops.routes"));
const reservations_routes_1 = __importDefault(require("./api/v1/modules/reservations/reservations.routes"));
const purchases_routes_1 = __importDefault(require("./api/v1/modules/purchases/purchases.routes"));
const users_routes_1 = __importDefault(require("./api/v1/modules/users/users.routes"));
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: env_1.default.CLIENT_URL,
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
    app.use("/api/v1/users", users_routes_1.default);
    app.use("/api/v1/drops", drops_routes_1.default);
    app.use("/api/v1/reservations", reservations_routes_1.default);
    app.use("/api/v1/purchases", purchases_routes_1.default);
    app.use((_req, _res, next) => {
        next(new errors_1.NotFoundError("The requested route does not exist"));
    });
    app.use(errorHandler_1.globalErrorHandler);
    return app;
};
exports.default = createApp;
//# sourceMappingURL=app.js.map