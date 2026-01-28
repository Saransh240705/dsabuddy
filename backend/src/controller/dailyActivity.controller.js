import { prisma } from "../config/prismaClient.js";

const getAuthUserId = (req) => req.user?.userId ?? req.user?._id ?? null;

const toMidnightUTC = (d) => {
  const date = new Date(d);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

export const listMyDailyActivity = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const take = req.query.take ?? 60;
  const skip = req.query.skip ?? 0;

  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const from = req.query.from ? toMidnightUTC(req.query.from) : toMidnightUTC(defaultFrom);
  const to = req.query.to ? toMidnightUTC(req.query.to) : toMidnightUTC(now);

  const activities = await prisma.dailyActivity.findMany({
    where: {
      userId,
      date: { gte: from, lte: to },
    },
    take,
    skip,
    orderBy: [{ date: "asc" }],
    select: {
      id: true,
      date: true,
      count: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ dailyActivity: activities });
};

export const incrementMyDailyActivity = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const date = toMidnightUTC(req.body.date ?? new Date());
  const incrementBy = req.body.incrementBy ?? 1;

  const record = await prisma.dailyActivity.upsert({
    where: {
      userId_date: { userId, date },
    },
    create: { userId, date, count: incrementBy },
    update: { count: { increment: incrementBy } },
    select: { id: true, date: true, count: true, updatedAt: true },
  });

  return res.status(200).json({ dailyActivity: record });
};

