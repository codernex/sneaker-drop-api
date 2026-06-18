import { Router } from "express";
import {
  createReservation,
  cancelReservationHandler,
  getReservation,
} from "./reservations.controller";

const router = Router();

// POST /api/v1/reservations  — atomically reserve a drop item
router.post("/", createReservation);

// GET /api/v1/reservations/:id — get reservation status
router.get("/:id", getReservation);

// DELETE /api/v1/reservations/:id — cancel a reservation
router.delete("/:id", cancelReservationHandler);

export default router;
