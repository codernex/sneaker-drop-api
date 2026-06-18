import { Router } from "express";
import { purchase, getByDrop, getByUser } from "./purchases.controller";

const router = Router();

// POST /api/v1/purchases — complete a purchase (must have active reservation)
router.post("/", purchase);

// GET /api/v1/purchases/drop/:dropId — all purchases for a drop
router.get("/drop/:dropId", getByDrop);

// GET /api/v1/purchases/user/:userId — all purchases by a user
router.get("/user/:userId", getByUser);

export default router;
