import { expireStaleReservations } from "../api/v1/modules/drops/drops.service";

const POLL_INTERVAL_MS = 5_000; // check every 5 seconds

let intervalHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Starts the background reservation expiry job.
 *
 * Architecture choice:
 *   We use a setInterval polling loop rather than per-reservation setTimeout()
 *   because:
 *    - setTimeout per-reservation doesn't survive process restarts.
 *    - A polling loop re-hydrates from the DB on startup, making it restart-safe.
 *    - The poll interval (5s) is much shorter than the TTL (60s), so expiry
 *      accuracy is within ±5 seconds — acceptable for this use case.
 *    - For production, this would be replaced with a dedicated job queue
 *      (e.g., BullMQ + Redis) or a pg_cron database job.
 */
export const startExpiryJob = (): void => {
  if (intervalHandle) return; // guard against double-start

  console.log("[expiry-job] Started — polling every 5s for stale reservations");

  intervalHandle = setInterval(async () => {
    try {
      await expireStaleReservations();
    } catch (error) {
      console.error("[expiry-job] Error during expiry sweep:", error);
    }
  }, POLL_INTERVAL_MS);

  // Ensure the interval doesn't keep the Node.js process alive if everything
  // else has shut down (e.g., during tests or graceful shutdown).
  intervalHandle.unref();
};

export const stopExpiryJob = (): void => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[expiry-job] Stopped");
  }
};
