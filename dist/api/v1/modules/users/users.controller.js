"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = exports.getUsers = exports.register = void 0;
const zod_1 = require("zod");
const users_service_1 = require("./users.service");
const request_1 = require("../../../../lib/request");
const registerSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30)
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: zod_1.z.string().email("Invalid email address"),
});
exports.register = (0, request_1.requestHandler)(async (req, res) => {
    const user = await (0, users_service_1.createUser)(req.body.username, req.body.email);
    return { res, message: "User registered", data: user };
}, { body: registerSchema });
exports.getUsers = (0, request_1.requestHandler)(async (_req, res) => {
    const users = await (0, users_service_1.listUsers)();
    return { res, message: "Users fetched successfully", data: { users } };
});
exports.getUser = (0, request_1.requestHandler)(async (req, res) => {
    const user = await (0, users_service_1.getUserById)(req.params.id);
    return { res, message: "User fetched successfully", data: { user } };
}, {
    params: zod_1.z.object({ id: zod_1.z.string().min(1, "User ID is required") }),
});
//# sourceMappingURL=users.controller.js.map