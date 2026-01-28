export function normalizeTag(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function mapDifficultyFromCodeforcesRating(rating) {
  if (typeof rating !== "number") return "MEDIUM";
  if (rating <= 1200) return "EASY";
  if (rating <= 1800) return "MEDIUM";
  return "HARD";
}

export function mapDifficultyFromLeetCode(difficulty) {
  const d = String(difficulty ?? "").toUpperCase();
  if (d === "EASY") return "EASY";
  if (d === "MEDIUM") return "MEDIUM";
  if (d === "HARD") return "HARD";
  return "MEDIUM";
}

