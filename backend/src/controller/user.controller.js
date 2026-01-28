import { prisma } from "../config/prismaClient.js";

export const getLeaderboard = async (req, res) => {
  const take = req.query.take ?? 50;
  const skip = req.query.skip ?? 0;

  const users = await prisma.user.findMany({
    take,
    skip,
    orderBy: [{ points: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      userName: true,
      avatarUrl: true,
      branch: true,
      year: true,
      points: true,
      overallRank: true,
    },
  });

  return res.status(200).json({ users });
};

export const getUserByUserName = async (req, res) => {
  const { userName } = req.params;

  const user = await prisma.user.findUnique({
    where: { userName },
    select: {
      id: true,
      name: true,
      userName: true,
      avatarUrl: true,
      college: true,
      branch: true,
      year: true,
      role: true,
      points: true,
      overallRank: true,
      createdAt: true,
      platformConnections: {
        select: {
          id: true,
          platform: true,
          username: true,
          rating: true,
          stars: true,
          problemsSolved: true,
          rankLabel: true,
          synced: true,
          lastSyncedAt: true,
        },
        orderBy: { platform: "asc" },
      },
    },
  });

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.status(200).json({ user });
};

export const updateMe = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.userId ?? req.user._id;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: req.body,
    select: {
      id: true,
      name: true,
      userName: true,
      email: true,
      avatarUrl: true,
      college: true,
      branch: true,
      year: true,
      role: true,
      points: true,
      overallRank: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ user: updated });
};

