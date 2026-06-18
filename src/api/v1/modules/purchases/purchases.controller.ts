import { z } from "zod";
import {
  completePurchase,
  getPurchasesByDrop,
  getPurchasesByUser,
} from "./purchases.service";
import { requestHandler } from "@/lib/request";

// ─── Validation ───────────────────────────────────────────────────────────────

const completePurchaseSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  reservationId: z.string().min(1, "reservationId is required"),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/purchases
 * Complete a purchase for a currently-held reservation.
 * Errors (NotFoundError, GoneError, etc.) bubble to globalErrorHandler.
 */
export const purchase = requestHandler(
  async (req, res) => {
    const data = await completePurchase(
      req.body.reservationId,
      req.body.userId,
    );
    return { res, message: "Purchase successful!", data, statusCode: 201 };
  },
  { body: completePurchaseSchema },
);

/**
 * GET /api/v1/purchases/drop/:dropId
 * All purchases for a drop.
 */
export const getByDrop = requestHandler(
  async (req, res) => {
    const data = await getPurchasesByDrop(req.params.dropId);
    return {
      res,
      message: "Purchases fetched successfully",
      data: { purchases: data },
    };
  },
  {
    params: z.object({ dropId: z.string().min(1, "dropId is required") }),
  },
);

/**
 * GET /api/v1/purchases/user/:userId
 * All purchases by a user.
 */
export const getByUser = requestHandler(
  async (req, res) => {
    const data = await getPurchasesByUser(req.params.userId);
    return {
      res,
      message: "Purchases fetched successfully",
      data: { purchases: data },
    };
  },
  {
    params: z.object({ userId: z.string().min(1, "userId is required") }),
  },
);
