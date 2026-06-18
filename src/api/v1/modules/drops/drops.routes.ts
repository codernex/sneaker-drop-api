import { Router } from "express";
import { createDrop, getDropById, getDrops } from "./drops.controller";

const router = Router();

// GET /api/v1/drops
router.get("/", getDrops);

// GET /api/v1/drops/:id
router.get("/:id", getDropById);

// POST /api/v1/drops  (Admin: initialize a new merch drop)
router.post("/", createDrop);

export default router;
