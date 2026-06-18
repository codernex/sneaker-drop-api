import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/errors";

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Register a new user. Username and email must be unique.
 */
export const createUser = async (username: string, email: string) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { username: true, email: true },
  });

  if (existing?.username === username)
    throw new ConflictError("This username is already taken", "USERNAME_TAKEN");
  if (existing?.email === email)
    throw new ConflictError(
      "An account with this email already exists",
      "EMAIL_TAKEN",
    );

  return prisma.user.create({
    data: { username, email },
    select: { id: true, username: true, email: true, createdAt: true },
  });
};

/**
 * Fetch a user by ID.
 */
export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, email: true, createdAt: true },
  });

  if (!user) throw new NotFoundError("User not found", "USER_NOT_FOUND");
  return user;
};

/**
 * Fetch all users (admin use).
 */
export const listUsers = async () => {
  return prisma.user.findMany({
    select: { id: true, username: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
};
