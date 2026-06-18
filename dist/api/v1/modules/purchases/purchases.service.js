"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPurchasesByUser = exports.getPurchasesByDrop = exports.completePurchase = void 0;
const prisma_1 = require("../../../../lib/prisma");
const socket_1 = require("../../../../lib/socket");
const errors_1 = require("../../../../errors");
const completePurchase = async (reservationId, userId) => {
    const reservation = await prisma_1.prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { drop: true },
    });
    if (!reservation)
        throw new errors_1.NotFoundError("Reservation not found", "RESERVATION_NOT_FOUND");
    if (reservation.userId !== userId)
        throw new errors_1.ForbiddenError("This reservation does not belong to you", "USER_MISMATCH");
    if (reservation.status !== "PENDING")
        throw new errors_1.BadRequestError("Only PENDING reservations can be completed", "RESERVATION_NOT_PENDING");
    if (reservation.expiresAt < new Date())
        throw new errors_1.GoneError("Your reservation has expired. Please reserve again.", "RESERVATION_EXPIRED");
    const unitPrice = reservation.drop.price;
    const purchase = await prisma_1.prisma.$transaction(async (tx) => {
        await tx.reservation.update({
            where: { id: reservationId },
            data: { status: "COMPLETED" },
        });
        return tx.purchase.create({
            data: {
                userId,
                dropId: reservation.dropId,
                reservationId,
                quantity: 1,
                unitPrice,
                totalAmount: unitPrice,
            },
            include: {
                user: { select: { username: true } },
                drop: { select: { name: true, availableStock: true } },
            },
        });
    });
    const io = (0, socket_1.getIO)();
    io.emit("purchase:completed", {
        dropId: reservation.dropId,
        username: purchase.user.username,
        dropName: purchase.drop.name,
        purchasedAt: purchase.createdAt,
    });
    return purchase;
};
exports.completePurchase = completePurchase;
const getPurchasesByDrop = async (dropId) => {
    return prisma_1.prisma.purchase.findMany({
        where: { dropId },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { username: true } } },
    });
};
exports.getPurchasesByDrop = getPurchasesByDrop;
const getPurchasesByUser = async (userId) => {
    return prisma_1.prisma.purchase.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { drop: { select: { name: true, imageUrl: true } } },
    });
};
exports.getPurchasesByUser = getPurchasesByUser;
//# sourceMappingURL=purchases.service.js.map