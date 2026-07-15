import { Worker } from "bullmq";
import bullConnection from "../config/bullmq.js";
import { prisma } from "../config/prismaClient.js";
import { recalculateUserPoints } from "../utils/points.js";
import { syncPlatformConnection } from "../utils/platformSync.js";
import { POINTS_QUEUE_NAME, enqueueUserRecalc } from "./pointsQueue.js";

async function processFanOut() {
  // Only users with at least one connected platform have anything to recalculate.
  const users = await prisma.platformConnection.findMany({
    where: {},
    distinct: ["userId"],
    select: { userId: true },
  });

  for (const { userId } of users) {
    await enqueueUserRecalc(userId);
  }

  console.log(`Points fan-out: enqueued recalculation for ${users.length} user(s)`);
  return { enqueued: users.length };
}

async function processRecalculateUser(job) {
  const { userId } = job.data;

  // Refresh each connected platform's raw stats from the source first —
  // recalculateUserPoints only re-derives the point formula from whatever
  // is already stored, so without this an inactive/logged-out user's
  // points would never actually change (same stale input -> same output).
  const connections = await prisma.platformConnection.findMany({
    where: { userId },
    select: { platform: true, username: true },
  });

  for (const { platform, username } of connections) {
    if (!username) continue;
    try {
      await syncPlatformConnection(userId, platform, username);
    } catch (err) {
      console.error(
        `Platform sync failed for user ${userId} (${platform}):`,
        err.message
      );
    }
  }

  return recalculateUserPoints(userId);
}

export const pointsWorker = new Worker(
  POINTS_QUEUE_NAME,
  async (job) => {
    if (job.name === "fan-out") return processFanOut();
    if (job.name === "recalculate-user") return processRecalculateUser(job);
    console.warn(`Unknown points job name: ${job.name}`);
  },
  {
    connection: bullConnection,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 }, // throttle external platform API calls
    drainDelay: 30,
  }
);

pointsWorker.on("failed", (job, err) => {
  console.error(`Points job ${job?.name} (${job?.id}) failed:`, err.message);
});

pointsWorker.on("completed", (job) => {
  console.log(`Points job ${job.name} (${job.id}) completed`);
});
