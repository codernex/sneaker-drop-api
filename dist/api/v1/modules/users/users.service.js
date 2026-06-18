"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = exports.getUserById = exports.createUser = void 0;
const prisma_1 = require("../../../../lib/prisma");
const errors_1 = require("../../../../errors");
const createUser = async (username, email) => {
    const existing = await prisma_1.prisma.user.findFirst({
        where: { OR: [{ username }, { email }] },
        select: { username: true, email: true },
    });
    if (existing?.username === username)
        throw new errors_1.ConflictError("This username is already taken", "USERNAME_TAKEN");
    if (existing?.email === email)
        throw new errors_1.ConflictError("An account with this email already exists", "EMAIL_TAKEN");
    return prisma_1.prisma.user.create({
        data: { username, email },
        select: { id: true, username: true, email: true, createdAt: true },
    });
};
exports.createUser = createUser;
const getUserById = async (id) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id },
        select: { id: true, username: true, email: true, createdAt: true },
    });
    if (!user)
        throw new errors_1.NotFoundError("User not found", "USER_NOT_FOUND");
    return user;
};
exports.getUserById = getUserById;
const listUsers = async () => {
    return prisma_1.prisma.user.findMany({
        select: { id: true, username: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    });
};
exports.listUsers = listUsers;
//# sourceMappingURL=users.service.js.map