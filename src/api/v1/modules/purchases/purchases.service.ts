import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  GoneError,
} from "@/errors";

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Complete a purchase for an existing PENDING reservation.
 *
 * Rules:
 *  - The reservation must exist and belong to the requesting user.
 *  - The reservation must still be PENDING and not expired.
 *  - Stock is already decremented at reservation time — no stock adjustment here.
 *    We just transition the reservation to COMPLETED and create a Purchase record.
 */
export const completePurchase = async (reservationId: string, userId: string) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { drop: true },
  });

  if (!reservation)
    throw new NotFoundError("Reservation not found", "RESERVATION_NOT_FOUND");
  if (reservation.userId !== userId)
    throw new ForbiddenError("This reservation does not belong to you", "USER_MISMATCH");
  if (reservation.status !== "PENDING")
    throw new BadRequestError(
      "Only PENDING reservations can be completed",
      "RESERVATION_NOT_PENDING",
    );
  if (reservation.expiresAt < new Date())
    throw new GoneError(
      "Your reservation has expired. Please reserve again.",
      "RESERVATION_EXPIRED",
    );

  const unitPrice = reservation.drop.price;

  const purchase = await prisma.$transaction(async (tx) => {
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

  // Broadcast so all clients update the "recent purchasers" activity feed
  const io = getIO();
  io.emit("purchase:completed", {
    dropId: reservation.dropId,
    username: purchase.user.username,
    dropName: purchase.drop.name,
    purchasedAt: purchase.createdAt,
  });

  return purchase;
};

/**
 * Get all purchases for a specific drop (admin / analytics).
 */
export const getPurchasesByDrop = async (dropId: string) => {
  return prisma.purchase.findMany({
    where: { dropId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { username: true } } },
  });
};

/**
 * Get all purchases made by a user.
 */
export const getPurchasesByUser = async (userId: string) => {
  return prisma.purchase.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { drop: { select: { name: true, imageUrl: true } } },
  });
};
