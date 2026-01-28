import {
  syncCodeforcesProblemsByTags,
  fetchCodeforcesUserStats,
} from "./codeforces.js";
import {
  syncLeetCodeProblemsByTags,
  fetchLeetCodeUserStats,
} from "./leetcode.js";

export async function syncProblems({
  prisma,
  platforms = ["codeforces", "leetcode"],
  tagSlugs = [],
  maxItems = 200,
  dryRun = false,
} = {}) {
  const wanted = new Set(platforms.map((p) => String(p).toLowerCase()));

  const results = {};

  if (wanted.has("codeforces")) {
    results.codeforces = await syncCodeforcesProblemsByTags({
      prisma,
      tagSlugs,
      maxItems,
      dryRun,
    });
  }

  if (wanted.has("leetcode")) {
    results.leetcode = await syncLeetCodeProblemsByTags({
      prisma,
      tagSlugs,
      maxItems,
      dryRun,
    });
  }

  return results;
}

export async function syncUserStats({ platform, username }) {
  const platformLower = String(platform).toLowerCase();

  if (platformLower === "leetcode") {
    return await fetchLeetCodeUserStats({ username });
  }

  if (platformLower === "codeforces") {
    return await fetchCodeforcesUserStats({ username });
  }

  throw new Error(`Platform '${platform}' user stats sync not implemented`);
}

