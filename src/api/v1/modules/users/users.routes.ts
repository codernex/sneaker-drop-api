import { Router } from "express";
import { register, getUser, getUsers } from "./users.controller";

const router = Router();

// POST /api/v1/users — register a new user
router.post("/", register);

// GET /api/v1/users — list all users
router.get("/", getUsers);

// GET /api/v1/users/:id — get a user by ID
router.get("/:id", getUser);

export default router;
