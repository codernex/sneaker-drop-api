"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESERVATION_TTL_SECONDS = exports.expireStaleReservations = exports.deactivateDrop = exports.initializeDrop = exports.getDropByIdWithPurchasers = exports.getAllDrops = void 0;
const prisma_1 = require("../../../../lib/prisma");
const socket_1 = require("../../../../lib/socket");
const env_1 = __importDefault(require("../../../../config/env"));
const errors_1 = require("../../../../errors");
const getAllDrops = async () => {
    const drops = await prisma_1.prisma.drop.findMany({
        where: { isActive: true },
        orderBy: { startsAt: "desc" },
        include: {
            purchases: {
                orderBy: { createdAt: "desc" },
                take: 3,
                include: { user: { select: { id: true, username: true } } },
            },
        },
    });
    return drops.map((drop) => ({
        id: drop.id,
        name: drop.name,
        description: drop.description,
        imageUrl: drop.imageUrl,
        totalStock: drop.totalStock,
        availableStock: drop.availableStock,
        price: drop.price,
        startsAt: drop.startsAt,
        endsAt: drop.endsAt,
        isActive: drop.isActive,
        createdAt: drop.createdAt,
        recentPurchasers: drop.purchases.map((p) => ({
            username: p.user.username,
            purchasedAt: p.createdAt,
        })),
    }));
};
exports.getAllDrops = getAllDrops;
const getDropByIdWithPurchasers = async (id) => {
    const drop = await prisma_1.prisma.drop.findUnique({
        where: { id },
        include: {
            purchases: {
                orderBy: { createdAt: "desc" },
                take: 3,
                include: { user: { select: { id: true, username: true } } },
            },
        },
    });
    if (!drop)
        throw new errors_1.NotFoundError("Drop not found", "DROP_NOT_FOUND");
    return {
        id: drop.id,
        name: drop.name,
        description: drop.description,
        imageUrl: drop.imageUrl,
        totalStock: drop.totalStock,
        availableStock: drop.availableStock,
        price: drop.price,
        startsAt: drop.startsAt,
        endsAt: drop.endsAt,
        isActive: drop.isActive,
        createdAt: drop.createdAt,
        recentPurchasers: drop.purchases.map((p) => ({
            username: p.user.username,
            purchasedAt: p.createdAt,
        })),
    };
};
exports.getDropByIdWithPurchasers = getDropByIdWithPurchasers;
const initializeDrop = async (input) => {
    const drop = await prisma_1.prisma.drop.create({
        data: {
            name: input.name,
            description: input.description,
            imageUrl: input.imageUrl,
            totalStock: input.totalStock,
            availableStock: input.totalStock,
            price: input.price,
            startsAt: new Date(input.startsAt),
            endsAt: input.endsAt ? new Date(input.endsAt) : null,
            isActive: true,
        },
    });
    const io = (0, socket_1.getIO)();
    io.emit("drop:new", { drop });
    return drop;
};
exports.initializeDrop = initializeDrop;
const deactivateDrop = async (id) => {
    const drop = await prisma_1.prisma.drop.update({
        where: { id },
        data: { isActive: false },
    });
    const io = (0, socket_1.getIO)();
    io.emit("drop:deactivated", { dropId: id });
    return drop;
};
exports.deactivateDrop = deactivateDrop;
const expireStaleReservations = async () => {
    const now = new Date();
    const expired = await prisma_1.prisma.reservation.findMany({
        where: { status: "PENDING", expiresAt: { lte: now } },
        select: { id: true, dropId: true },
    });
    if (expired.length === 0)
        return;
    const io = (0, socket_1.getIO)();
    const byDrop = expired.reduce((acc, r) => {
        acc[r.dropId] = acc[r.dropId] ?? [];
        acc[r.dropId].push(r.id);
        return acc;
    }, {});
    for (const [dropId, reservationIds] of Object.entries(byDrop)) {
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.reservation.updateMany({
                where: { id: { in: reservationIds } },
                data: { status: "EXPIRED" },
            });
            const updatedDrop = await tx.drop.update({
                where: { id: dropId },
                data: { availableStock: { increment: reservationIds.length } },
                select: { availableStock: true },
            });
            io.emit("stock:update", {
                dropId,
                availableStock: updatedDrop.availableStock,
                event: "reservation_expired",
                recoveredUnits: reservationIds.length,
            });
            console.log(`[expiry-job] Drop ${dropId}: ${reservationIds.length} reservation(s) expired, stock restored to ${updatedDrop.availableStock}`);
        });
    }
};
exports.expireStaleReservations = expireStaleReservations;
exports.RESERVATION_TTL_SECONDS = env_1.default.RESERVATION_TTL_SECONDS;
//# sourceMappingURL=drops.service.js.map