import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";
import env from "@/config/env";
import { NotFoundError } from "@/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateDropInput {
  name: string;
  description?: string;
  imageUrl?: string;
  totalStock: number;
  price: number;
  startsAt: string;
  endsAt?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Fetch all active drops, each with the top-3 most recent purchasers.
 */
export const getAllDrops = async () => {
  const drops = await prisma.drop.findMany({
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

/**
 * Fetch a single drop by ID with top-3 recent purchasers.
 * Throws NotFoundError if the drop does not exist.
 */
export const getDropByIdWithPurchasers = async (id: string) => {
  const drop = await prisma.drop.findUnique({
    where: { id },
    include: {
      purchases: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { user: { select: { id: true, username: true } } },
      },
    },
  });

  if (!drop) throw new NotFoundError("Drop not found", "DROP_NOT_FOUND");

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

/**
 * Initialize a new merch drop.
 * availableStock is set equal to totalStock on creation.
 */
export const initializeDrop = async (input: CreateDropInput) => {
  const drop = await prisma.drop.create({
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

  const io = getIO();
  io.emit("drop:new", { drop });

  return drop;
};

/**
 * Soft-delete (deactivate) a drop and broadcast the change.
 */
export const deactivateDrop = async (id: string) => {
  const drop = await prisma.drop.update({
    where: { id },
    data: { isActive: false },
  });

  const io = getIO();
  io.emit("drop:deactivated", { dropId: id });

  return drop;
};

// ─── Stock Recovery (called by the expiry job) ────────────────────────────────

/**
 * Expire all PENDING reservations past their TTL:
 *  1. Mark them EXPIRED.
 *  2. Increment drop.availableStock for each expired reservation.
 *  3. Broadcast stock updates via WebSocket.
 */
export const expireStaleReservations = async (): Promise<void> => {
  const now = new Date();

  const expired = await prisma.reservation.findMany({
    where: { status: "PENDING", expiresAt: { lte: now } },
    select: { id: true, dropId: true },
  });

  if (expired.length === 0) return;

  const io = getIO();

  // Group by dropId to batch the stock increments
  const byDrop = expired.reduce<Record<string, string[]>>((acc, r) => {
    acc[r.dropId] = acc[r.dropId] ?? [];
    acc[r.dropId].push(r.id);
    return acc;
  }, {});

  for (const [dropId, reservationIds] of Object.entries(byDrop)) {
    await prisma.$transaction(async (tx) => {
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

      console.log(
        `[expiry-job] Drop ${dropId}: ${reservationIds.length} reservation(s) expired, stock restored to ${updatedDrop.availableStock}`,
      );
    });
  }
};

// Re-export TTL so callers don't need to import env directly
export const RESERVATION_TTL_SECONDS = env.RESERVATION_TTL_SECONDS;
