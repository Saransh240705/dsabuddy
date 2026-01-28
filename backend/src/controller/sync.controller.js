import crypto from "crypto";
import { prisma } from "../config/prismaClient.js";
import { syncProblems } from "../ingestion/index.js";

const jobs = new Map();

function requireSyncSecret(req, res) {
  const required = process.env.SYNC_SECRET;
  if (!required) {
    res.status(500).json({
      error: "SYNC_SECRET is not configured on the server",
    });
    return false;
  }

  const provided = req.headers["x-sync-key"];
  if (!provided || provided !== required) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

export const startSyncProblems = async (req, res) => {
  if (!requireSyncSecret(req, res)) return;

  const jobId = crypto.randomUUID();
  const platforms = req.body.platforms ?? ["codeforces", "leetcode"];
  const tags = req.body.tags ?? [];
  const dryRun = Boolean(req.body.dryRun);
  const maxItems = Number(req.body.maxItems ?? 200);

  jobs.set(jobId, {
    id: jobId,
    status: "running",
    startedAt: new Date(),
    finishedAt: null,
    params: { platforms, tags, dryRun, maxItems },
    result: null,
    error: null,
  });

  // Fire-and-forget background run. (For truly large workloads use a queue worker.)
  (async () => {
    try {
      await prisma.$connect();
      const result = await syncProblems({
        prisma,
        platforms,
        tagSlugs: tags,
        maxItems,
        dryRun,
      });
      jobs.set(jobId, {
        ...jobs.get(jobId),
        status: "completed",
        finishedAt: new Date(),
        result,
      });
    } catch (err) {
      jobs.set(jobId, {
        ...jobs.get(jobId),
        status: "failed",
        finishedAt: new Date(),
        error: err?.message ?? String(err),
      });
    } finally {
      try {
        await prisma.$disconnect();
      } catch {
        // ignore
      }
    }
  })();

  return res.status(202).json({ jobId });
};

export const getSyncJob = async (req, res) => {
  if (!requireSyncSecret(req, res)) return;

  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  return res.status(200).json({ job });
};

