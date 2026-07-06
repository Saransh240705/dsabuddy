export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  ONBOARDING: '/onboarding',
  ABOUT: '/about',
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001/api';

/**
 * Maps full branch name → branch code.
 * Branch names are used as the stored value; codes are for display only.
 */
export const BRANCH_CODE_MAP = {
  "Bio-Technology":                                                    "BT",
  "Civil Engineering":                                                 "CE",
  "Computer Science and Engineering (Artificial Intelligence)":        "CSAI",
  "Computer Science and Engineering (Big Data Analytics)":             "CSDA",
  "Computer Science and Engineering":                                  "CSE",
  "Computer Science and Engineering (Data Science)":                   "CSDS",
  "Computer Science and Engineering (Internet of Things)":             "CIOT",
  "Electrical Engineering":                                            "EE",
  "Electronics and Communication Engineering (Artificial Intelligence and Machine Learning)": "ECAM",
  "Electronics and Communication Engineering":                         "ECE",
  "Electronics Engineering (VLSI Design and Technology)":              "EVDT",
  "Geoinformatics":                                                    "GI",
  "Information Technology":                                            "IT",
  "Information Technology (Network and Information Security)":         "ITNS",
  "Instrumentation and Control Engineering":                           "ICE",
  "Mathematics and Computing":                                         "MAC",
  "Mechanical Engineering (Electric Vehicles)":                        "MEEV",
  "Mechanical Engineering":                                            "ME",
};

/** Branch names for dropdowns — sorted alphabetically. */
export const BRANCHES = Object.keys(BRANCH_CODE_MAP).sort((a, b) => a.localeCompare(b));

/**
 * Short-name mapping for branch keys returned by the backend
 * (e.g. company placement data). Used primarily in PYQs page.
 */
export const BRANCH_SHORT_NAMES = {
  cs: "CSE",
  it: "IT",
  mac: "M&C",
  ece: "ECE",
  ee: "EE",
  ice: "ICE",
  me: "ME",
};

/**
 * Branches commonly grouped under "circuital" in placement eligibility.
 */
export const CIRCUITAL_BRANCHES = [
  "CSE", "CSAI", "CSDS", "CSDA", "CIOT",
  "IT", "ITNS",
  "ECE", "ECAM", "EVDT",
  "EE",
  "ICE",
];

/** Ready-to-use display label for circuital eligibility text. */
export const CIRCUITAL_BRANCHES_LABEL = "CSE, IT, ECE, EE, ICE, and related branches";

// ── Coding Platforms ────────────────────────────────────────────────────────

import leetcodeLogo from '@/assets/leetcode.png';
import codeforcesLogo from '@/assets/codeforces.png';
import codechefLogo from '@/assets/codechef.png';
import gfgLogo from '@/assets/gfg.png';

/** Single source of truth for all supported coding platforms. */
export const PLATFORMS = [
  { id: 'leetcode',   name: 'LeetCode',   key: 'LEETCODE',   logo: leetcodeLogo,   color: '#FFA116' },
  { id: 'codechef',   name: 'CodeChef',   key: 'CODECHEF',   logo: codechefLogo,   color: '#B97A57' },
  { id: 'codeforces', name: 'Codeforces', key: 'CODEFORCES', logo: codeforcesLogo, color: '#1F8ACB' },
  { id: 'gfg',        name: 'GFG',        key: 'GFG',        logo: gfgLogo,        color: '#2F8D46' },
];

// ── Questions ────────────────────────────────────────────────────────────────

/** Colour tokens for each difficulty level. Used by DifficultyBadge. */
export const DIFFICULTY_COLORS = {
  EASY:   { bg: 'rgba(34,197,94,0.12)',  text: '#22c55e', border: 'rgba(34,197,94,0.25)' },
  MEDIUM: { bg: 'rgba(234,179,8,0.12)',  text: '#eab308', border: 'rgba(234,179,8,0.25)' },
  HARD:   { bg: 'rgba(239,68,68,0.12)',  text: '#ef4444', border: 'rgba(239,68,68,0.25)' },
};

/** Colour tokens for each solve-status. Used by StatusBadge. */
export const STATUS_COLORS = {
  SOLVED:    { bg: 'rgba(34,197,94,0.15)',  text: '#22c55e',   border: 'rgba(34,197,94,0.3)' },
  ATTEMPTED: { bg: 'rgba(234,179,8,0.15)',  text: '#eab308',   border: 'rgba(234,179,8,0.3)' },
  SKIPPED:   { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8',  border: 'rgba(148,163,184,0.3)' },
};

/** Human-readable label for each source platform enum value. */
export const PLATFORM_LABELS = {
  LEETCODE:   'LeetCode',
  CODEFORCES: 'Codeforces',
  CODECHEF:   'CodeChef',
  GFG:        'GFG',
};

/** Ordered list of statuses shown in the solve-status sidebar. */
export const STATUS_OPTIONS = ['SOLVED', 'ATTEMPTED', 'SKIPPED'];
