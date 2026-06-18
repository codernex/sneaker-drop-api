"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReservationById = exports.cancelReservation = exports.reserveItem = void 0;
const prisma_1 = require("../../../../lib/prisma");
const socket_1 = require("../../../../lib/socket");
const env_1 = __importDefault(require("../../../../config/env"));
const errors_1 = require("../../../../errors");
const reserveItem = async (userId, dropId) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new errors_1.NotFoundError("User not found", "USER_NOT_FOUND");
    const existing = await prisma_1.prisma.reservation.findFirst({
        where: { userId, dropId, status: "PENDING", expiresAt: { gt: new Date() } },
    });
    if (existing)
        throw new errors_1.ConflictError("You already have an active reservation for this drop", "ALREADY_RESERVED");
    const ttlSeconds = env_1.default.RESERVATION_TTL_SECONDS;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        const [lockRow] = await tx.$queryRawUnsafe(`SELECT pg_try_advisory_xact_lock(hashtext($1)) AS acquired`, dropId);
        if (!lockRow?.acquired)
            throw new errors_1.ConflictError("High demand! Another reservation is in progress. Please try again.", "LOCK_FAILED");
        const [drop] = await tx.$queryRawUnsafe(`SELECT id, available_stock, is_active FROM drops WHERE id = $1 FOR UPDATE`, dropId);
        if (!drop)
            throw new errors_1.NotFoundError("Drop not found", "DROP_NOT_FOUND");
        if (!drop.is_active)
            throw new errors_1.BadRequestError("This drop is no longer active", "DROP_NOT_ACTIVE");
        if (drop.available_stock < 1)
            throw new errors_1.ConflictError("Sorry, this item is out of stock", "OUT_OF_STOCK");
        await tx.$executeRawUnsafe(`UPDATE drops SET available_stock = available_stock - 1, updated_at = NOW() WHERE id = $1`, dropId);
        const reservation = await tx.reservation.create({
            data: { userId, dropId, status: "PENDING", expiresAt },
        });
        return { reservation, newStock: drop.available_stock - 1 };
    });
    const io = (0, socket_1.getIO)();
    io.emit("stock:update", {
        dropId,
        availableStock: result.newStock,
        event: "reserved",
    });
    io.to(`drop:${dropId}`).emit("reservation:created", {
        reservationId: result.reservation.id,
        expiresAt: result.reservation.expiresAt,
    });
    return {
        reservationId: result.reservation.id,
        expiresAt: result.reservation.expiresAt,
        ttlSeconds,
    };
};
exports.reserveItem = reserveItem;
const cancelReservation = async (reservationId, requestingUserId) => {
    const reservation = await prisma_1.prisma.reservation.findUnique({
        where: { id: reservationId },
    });
    if (!reservation)
        throw new errors_1.NotFoundError("Reservation not found", "RESERVATION_NOT_FOUND");
    if (reservation.userId !== requestingUserId)
        throw new errors_1.ForbiddenError("You are not authorized to perform this action", "FORBIDDEN");
    if (reservation.status !== "PENDING")
        throw new errors_1.BadRequestError("Only PENDING reservations can be cancelled", "INVALID_STATUS");
    const updatedDrop = await prisma_1.prisma.$transaction(async (tx) => {
        await tx.reservation.update({
            where: { id: reservationId },
            data: { status: "CANCELLED" },
        });
        return tx.drop.update({
            where: { id: reservation.dropId },
            data: { availableStock: { increment: 1 } },
            select: { availableStock: true },
        });
    });
    const io = (0, socket_1.getIO)();
    io.emit("stock:update", {
        dropId: reservation.dropId,
        availableStock: updatedDrop.availableStock,
        event: "reservation_cancelled",
    });
};
exports.cancelReservation = cancelReservation;
const getReservationById = async (id) => {
    const reservation = await prisma_1.prisma.reservation.findUnique({
        where: { id },
        include: {
            drop: { select: { name: true, price: true } },
            user: { select: { username: true } },
        },
    });
    if (!reservation)
        throw new errors_1.NotFoundError("Reservation not found", "RESERVATION_NOT_FOUND");
    return reservation;
};
exports.getReservationById = getReservationById;
//# sourceMappingURL=reservations.service.js.map