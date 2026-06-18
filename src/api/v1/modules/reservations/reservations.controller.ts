import { z } from "zod";
import {
  reserveItem,
  cancelReservation,
  getReservationById,
} from "./reservations.service";
import { requestHandler } from "@/lib/request";

// ─── Validation Schemas ────────────────────────────────────────────────────────

const createReservationSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  dropId: z.string().min(1, "dropId is required"),
});

const cancelReservationSchema = z.object({
  userId: z.string().min(1, "userId is required"),
});

// ─── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/reservations
 * Atomically reserve one unit of a drop. Errors bubble to globalErrorHandler.
 */
export const createReservation = requestHandler(
  async (req, res) => {
    const data = await reserveItem(req.body.userId, req.body.dropId);
    return {
      res,
      message: "Item reserved successfully",
      data,
      statusCode: 201,
    };
  },
  { body: createReservationSchema },
);

/**
 * GET /api/v1/reservations/:id
 * Fetch reservation status. Returns ResponseOptions so requestHandler calls
 * successResponse automatically.
 */
export const getReservation = requestHandler(
  async (req, res) => {
    const data = await getReservationById(req.params.id);
    return { res, message: "Reservation fetched successfully", data };
  },
  {
    params: z.object({ id: z.string().min(1, "Reservation ID is required") }),
  },
);

/**
 * DELETE /api/v1/reservations/:id
 * Cancel an active reservation.
 */
export const cancelReservationHandler = requestHandler(
  async (req, res) => {
    await cancelReservation(req.params.id, req.body.userId);
    return { res, message: "Reservation cancelled" };
  },
  {
    params: z.object({ id: z.string().min(1, "Reservation ID is required") }),
    body: cancelReservationSchema,
  },
);
