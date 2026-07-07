// NSUT emails encode admission year as "ugYY" (e.g. "ug23" = admitted 2023).
// NSUT B.Tech is a 4-year program, so graduation year = 2000 + YY + 4.
const UG_YEAR_PATTERN = /ug(\d{2})/i;

export function deriveGraduationYearFromEmail(email) {
  const match = String(email || "").match(UG_YEAR_PATTERN);
  if (!match) return null;
  return String(2004 + parseInt(match[1], 10));
}
