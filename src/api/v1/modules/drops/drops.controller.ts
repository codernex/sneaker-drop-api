import { z } from "zod";
import {
  getAllDrops,
  getDropByIdWithPurchasers,
  initializeDrop,
} from "./drops.service";
import { requestHandler } from "@/lib/request";

// ─── Validation Schemas ────────────────────────────────────────────────────────

const createDropSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  totalStock: z.number().int().positive("Stock must be a positive integer"),
  price: z.number().positive("Price must be positive"),
  startsAt: z.string().datetime({ message: "startsAt must be ISO 8601" }),
  endsAt: z.string().datetime().optional(),
});

// ─── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/drops
 * Returns all active drops with nested top-3 purchasers per drop.
 */
export const getDrops = requestHandler(async (_req, res) => {
  const data = await getAllDrops();
  return { res, message: "Drops fetched successfully", data: { drops: data } };
});

/**
 * GET /api/v1/drops/:id
 */
export const getDropById = requestHandler(
  async (req, res) => {
    const data = await getDropByIdWithPurchasers(req.params.id);
    return { res, message: "Drop fetched successfully", data: { drop: data } };
  },
  {
    params: z.object({ id: z.string().min(1, "Drop ID is required") }),
  },
);

/**
 * POST /api/v1/drops
 * Admin — initialize a new merch drop.
 */
export const createDrop = requestHandler(
  async (req, res) => {
    const drop = await initializeDrop(req.body);
    return {
      success: true,
      message: "Drop created successfully",
      data: drop,
      res,
      statusCode: 201,
    };
  },
  { body: createDropSchema },
);
