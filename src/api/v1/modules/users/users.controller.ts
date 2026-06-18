import { z } from "zod";
import { createUser, getUserById, listUsers } from "./users.service";
import { requestHandler } from "@/lib/request";

// ─── Validation ───────────────────────────────────────────────────────────────

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  email: z.string().email("Invalid email address"),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/** POST /api/v1/users — register a new user */
export const register = requestHandler(
  async (req, res) => {
    const user = await createUser(req.body.username, req.body.email);
    return { res, message: "User registered", data: user };
  },
  { body: registerSchema },
);

/** GET /api/v1/users — list all users */
export const getUsers = requestHandler(async (_req, res) => {
  const users = await listUsers();
  return { res, message: "Users fetched successfully", data: { users } };
});

/** GET /api/v1/users/:id — get user by ID */
export const getUser = requestHandler(
  async (req, res) => {
    const user = await getUserById(req.params.id);
    return { res, message: "User fetched successfully", data: { user } };
  },
  {
    params: z.object({ id: z.string().min(1, "User ID is required") }),
  },
);
