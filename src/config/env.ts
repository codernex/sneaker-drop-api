import dotenv from "dotenv";

dotenv.config();

interface Env {
  NODE_ENV: "development" | "production";
  PORT: number;
  DATABASE_URL: string;
  CLIENT_URL: string;
  RESERVATION_TTL_SECONDS: number;
}

const getConfig = (): Env => {
  const { NODE_ENV, PORT, DATABASE_URL, CLIENT_URL, RESERVATION_TTL_SECONDS } =
    process.env;

  if (!DATABASE_URL) {
    throw new Error("Missing required env variable: DATABASE_URL");
  }

  return {
    NODE_ENV: (NODE_ENV as "development" | "production") ?? "development",
    PORT: PORT ? Number(PORT) : 4000,
    DATABASE_URL,
    CLIENT_URL: CLIENT_URL ?? "http://localhost:5173",
    RESERVATION_TTL_SECONDS: RESERVATION_TTL_SECONDS
      ? Number(RESERVATION_TTL_SECONDS)
      : 60,
  };
};

const env = getConfig();

export default env;
