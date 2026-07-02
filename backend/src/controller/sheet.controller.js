import { prisma } from "../config/prismaClient.js";

const getAuthUserId = (req) => req.user?.userId ?? null;

export const listSheets = async (req, res) => {
  const userId = getAuthUserId(req);

  const sheets = await prisma.sheet.findMany({
    where: { isPublished: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      author: true,
      sourceUrl: true,
      coverImage: true,
      totalProblems: true,
    },
  });

  let solvedBySheet = {};
  if (userId && sheets.length > 0) {
    const solvedProblems = await prisma.userSheetProblem.findMany({
      where: {
        userId,
        status: "SOLVED",
        sheetProblem: { sheetId: { in: sheets.map((s) => s.id) } },
      },
      select: {
        sheetProblemId: true,
      },
    });
    // Map solved problems back to their sheet
    const solvedProblemIds = solvedProblems.map((g) => g.sheetProblemId);
    if (solvedProblemIds.length > 0) {
      const probs = await prisma.sheetProblem.findMany({
        where: { id: { in: solvedProblemIds } },
        select: { sheetId: true },
      });
      solvedBySheet = probs.reduce((acc, p) => {
        acc[p.sheetId] = (acc[p.sheetId] || 0) + 1;
        return acc;
      }, {});
    }
  }

  return res.status(200).json({
    sheets: sheets.map((s) => ({
      ...s,
      solvedCount: solvedBySheet[s.id] || 0,
    })),
  });
};

/**
 * GET /api/sheets/:slug
 * Full sheet with nested sections + problems, merged with the current user's
 * progress (status / starred / note) when authenticated.
 */
export const getSheetBySlug = async (req, res) => {
  const { slug } = req.params;
  const userId = getAuthUserId(req);

  const sheet = await prisma.sheet.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      author: true,
      sourceUrl: true,
      coverImage: true,
      totalProblems: true,
      sections: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          parentId: true,
        },
      },
      problems: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          sectionId: true,
          title: true,
          order: true,
          difficulty: true,
          articleUrl: true,
          youtubeUrl: true,
          practiceUrl: true,
          plusUrl: true,
          editorialUrl: true,
          questionId: true,
        },
      },
    },
  });

  if (!sheet) return res.status(404).json({ error: "Sheet not found" });

  // Fetch user progress for this sheet's problems in one query
  let progressByProblem = {};
  if (userId) {
    const progress = await prisma.userSheetProblem.findMany({
      where: { userId, sheetProblem: { sheetId: sheet.id } },
      select: {
        sheetProblemId: true,
        status: true,
        starred: true,
        note: true,
      },
    });
    progressByProblem = progress.reduce((acc, p) => {
      acc[p.sheetProblemId] = p;
      return acc;
    }, {});
  }

  // Group problems by section, merging user progress
  const problemsBySection = {};
  for (const p of sheet.problems) {
    const prog = progressByProblem[p.id];
    const merged = {
      ...p,
      status: prog?.status ?? "UNSOLVED",
      starred: prog?.starred ?? false,
      note: prog?.note ?? null,
    };
    (problemsBySection[p.sectionId] ||= []).push(merged);
  }

  // Build the section tree (self-referential parentId)
  const nodeById = {};
  for (const s of sheet.sections) {
    nodeById[s.id] = {
      id: s.id,
      title: s.title,
      order: s.order,
      problems: problemsBySection[s.id] || [],
      children: [],
    };
  }
  const roots = [];
  for (const s of sheet.sections) {
    const node = nodeById[s.id];
    if (s.parentId && nodeById[s.parentId]) {
      nodeById[s.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Recursively compute total / solved counts per section (incl. descendants)
  const computeCounts = (node) => {
    let total = node.problems.length;
    let solved = node.problems.filter((p) => p.status === "SOLVED").length;
    for (const child of node.children) {
      const c = computeCounts(child);
      total += c.total;
      solved += c.solved;
    }
    node.total = total;
    node.solved = solved;
    return { total, solved };
  };
  roots.forEach(computeCounts);

  const solvedCount = roots.reduce((acc, r) => acc + r.solved, 0);

  const { sections, problems, ...meta } = sheet;
  return res.status(200).json({
    sheet: {
      ...meta,
      solvedCount,
      sections: roots,
    },
  });
};

/**
 * PUT /api/sheets/problems/:problemId/progress
 * Upsert the current user's progress on a sheet problem.
 * Body: { status?, starred?, note? }
 */
export const upsertSheetProgress = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { problemId } = req.params;
  const { status, starred, note } = req.body;

  // Validate the problem exists (avoids FK error leaking as 500)
  const exists = await prisma.sheetProblem.findUnique({
    where: { id: problemId },
    select: { id: true },
  });
  if (!exists) return res.status(404).json({ error: "Sheet problem not found" });

  const data = {};
  if (status !== undefined) {
    data.status = status;
    data.solvedAt = status === "SOLVED" ? new Date() : null;
  }
  if (starred !== undefined) data.starred = starred;
  if (note !== undefined) data.note = note;

  const record = await prisma.userSheetProblem.upsert({
    where: { userId_sheetProblemId: { userId, sheetProblemId: problemId } },
    create: {
      userId,
      sheetProblemId: problemId,
      status: status ?? "UNSOLVED",
      starred: starred ?? false,
      note: note ?? null,
      solvedAt: status === "SOLVED" ? new Date() : null,
    },
    update: data,
    select: {
      sheetProblemId: true,
      status: true,
      starred: true,
      note: true,
      solvedAt: true,
    },
  });

  return res.status(200).json({ progress: record });
};
