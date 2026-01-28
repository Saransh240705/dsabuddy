import "dotenv/config";
import { prisma } from "../src/config/prismaClient.js";
import { syncProblems } from "../src/ingestion/index.js";

function parseCsv(s) {
  return String(s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

async function main() {
  const platforms = parseCsv(process.env.SYNC_PLATFORMS || "codeforces,leetcode");
  const tagSlugs = parseCsv(process.env.SYNC_TAGS || "");
  const dryRun = process.env.DRY_RUN === "true";
  const maxItems = Number(process.env.SYNC_MAX_ITEMS || 200);

  console.log("[syncProblems] platforms =", platforms);
  console.log("[syncProblems] tags =", tagSlugs.length ? tagSlugs : "(all)");

  await prisma.$connect();
  try {
    const result = await syncProblems({
      prisma,
      platforms,
      tagSlugs,
      maxItems,
      dryRun,
    });
    console.log("[syncProblems] done:", JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[syncProblems] failed:", err);
  process.exit(1);
});

