import { Queue } from "bullmq";
import bullConnection from "../config/bullmq.js";

export const POINTS_QUEUE_NAME = "points-recalc";

export const pointsQueue = new Queue(POINTS_QUEUE_NAME, {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 20, age: 3600 },
    removeOnFail: { count: 100, age: 86400 },
  },
});

// One repeatable "fan-out" job that, on each tick, enqueues a per-user
// recalculation job for every user with a connected platform. This is what
// keeps points fresh for users who are inactive/logged out (previously,
// points only updated when the user themselves hit the app while logged in).
export async function scheduleFanOutJob() {
  await pointsQueue.upsertJobScheduler(
    "points-fan-out-scheduler",
    { pattern: process.env.POINTS_RECALC_CRON || "0 */6 * * *" }, // every 6h by default
    {
      name: "fan-out",
      opts: { removeOnComplete: { count: 10 }, removeOnFail: { count: 10 } },
    }
  );
}

// jobId = userId so a fan-out pass can't double-enqueue a user whose
// previous recalculation job hasn't finished yet. (BullMQ custom job IDs
// can't contain ":", so no prefix here.)
export async function enqueueUserRecalc(userId) {
  await pointsQueue.add(
    "recalculate-user",
    { userId },
    { jobId: userId }
  );
}
