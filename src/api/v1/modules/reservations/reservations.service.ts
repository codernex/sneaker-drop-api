import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";
import env from "@/config/env";
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "@/errors";

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Atomically reserve one unit of a drop for a user.
 *
 * Race-condition strategy:
 *  SELECT … FOR UPDATE on the drops row
 *  → Row-level write lock within the transaction.
 *  → Serializes concurrent writes to the same row at the DB level.
 *  → Guarantees we read committed (non-phantom) stock before decrementing.
 *  → If stock hits 0, the check below rejects subsequent transactions.
 *
 *  NOTE: pg_try_advisory_xact_lock was intentionally removed.
 *  It blocked ALL concurrent transactions (even when stock > 0),
 *  causing false "High demand" errors. FOR UPDATE alone is sufficient
 *  to prevent overselling — the DB queues concurrent writers and each
 *  one sees the correctly decremented stock of the previous transaction.
 */
export const reserveItem = async (userId: string, dropId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found", "USER_NOT_FOUND");

  const existing = await prisma.reservation.findFirst({
    where: { userId, dropId, status: "PENDING", expiresAt: { gt: new Date() } },
  });
  if (existing)
    throw new ConflictError(
      "You already have an active reservation for this drop",
      "ALREADY_RESERVED",
    );

  const ttlSeconds = env.RESERVATION_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Row-level lock on the drop — blocks concurrent writers until this
    //    transaction commits, then releases. Prevents phantom reads on stock.
    const [drop] = await tx.$queryRawUnsafe<
      { id: string; available_stock: number; is_active: boolean }[]
    >(
      `SELECT id, available_stock, is_active FROM drops WHERE id = $1 FOR UPDATE`,
      dropId,
    );

    if (!drop) throw new NotFoundError("Drop not found", "DROP_NOT_FOUND");
    if (!drop.is_active)
      throw new BadRequestError(
        "This drop is no longer active",
        "DROP_NOT_ACTIVE",
      );
    if (drop.available_stock < 1)
      throw new ConflictError(
        "Sorry, this item is out of stock",
        "OUT_OF_STOCK",
      );

    // 2. Atomic stock decrement
    await tx.$executeRawUnsafe(
      `UPDATE drops SET available_stock = available_stock - 1, updated_at = NOW() WHERE id = $1`,
      dropId,
    );

    // 3. Persist reservation
    const reservation = await tx.reservation.create({
      data: { userId, dropId, status: "PENDING", expiresAt },
    });

    return { reservation, newStock: drop.available_stock - 1 };
  });

  const io = getIO();
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

/**
 * Cancel a PENDING reservation and restore the stock unit.
 */
export const cancelReservation = async (
  reservationId: string,
  requestingUserId: string,
): Promise<void> => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation)
    throw new NotFoundError("Reservation not found", "RESERVATION_NOT_FOUND");
  if (reservation.userId !== requestingUserId)
    throw new ForbiddenError(
      "You are not authorized to perform this action",
      "FORBIDDEN",
    );
  if (reservation.status !== "PENDING")
    throw new BadRequestError(
      "Only PENDING reservations can be cancelled",
      "INVALID_STATUS",
    );

  const updatedDrop = await prisma.$transaction(async (tx) => {
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

  const io = getIO();
  io.emit("stock:update", {
    dropId: reservation.dropId,
    availableStock: updatedDrop.availableStock,
    event: "reservation_cancelled",
  });
};

/**
 * Fetch a single reservation by ID.
 */
export const getReservationById = async (id: string) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      drop: { select: { name: true, price: true } },
      user: { select: { username: true } },
    },
  });

  if (!reservation)
    throw new NotFoundError("Reservation not found", "RESERVATION_NOT_FOUND");

  return reservation;
};
