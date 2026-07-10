import { prisma } from "../config/prismaClient.js";
import { getCache, setCache, deleteCacheByPattern } from "../utils/cache.js";

// Platform enum map: frontend sortBy value -> DB platform enum value
const PLATFORM_SORT_MAP = {
  leetcode: "LEETCODE",
  codeforces: "CODEFORCES",
  codechef: "CODECHEF",
};

export const enrichUserWithRanks = async (user) => {
  if (!user) return null;
  const points = user.points ?? 0;

  if (points <= 0) {
    return {
      ...user,
      overallRank: null,
      collegeRank: null,
      branchRank: null,
      yearRank: null,
      classRank: null,
    };
  }

  const cacheKey = `user:ranks:${user.id}:${points}`;

  try {
    const cachedRanks = await getCache(cacheKey);
    if (cachedRanks) {
      return {
        ...user,
        ...cachedRanks,
      };
    }
  } catch (err) {
    console.error("Error reading user ranks cache:", err);
  }

  const [overallRank, collegeRank, branchRank, yearRank, classRank] = await Promise.all([
    prisma.user.count({
      where: { points: { gt: points } },
    }).then(n => n + 1),
    user.college
      ? prisma.user.count({
          where: { college: user.college, points: { gt: points } },
        }).then(n => n + 1)
      : Promise.resolve(null),
    user.branch
      ? prisma.user.count({
          where: { branch: user.branch, points: { gt: points } },
        }).then(n => n + 1)
      : Promise.resolve(null),
    user.year
      ? prisma.user.count({
          where: { year: user.year, points: { gt: points } },
        }).then(n => n + 1)
      : Promise.resolve(null),
    (user.branch && user.year)
      ? prisma.user.count({
          where: {
            branch: user.branch,
            year: user.year,
            ...(user.college ? { college: user.college } : {}),
            points: { gt: points },
          },
        }).then(n => n + 1)
      : Promise.resolve(null),
  ]);

  const ranks = {
    overallRank,
    collegeRank,
    branchRank,
    yearRank,
    classRank,
  };


  try {
    await setCache(cacheKey, ranks, 300); // cache for 5 minutes
  } catch (err) {
    console.error("Error writing user ranks cache:", err);
  }

  return {
    ...user,
    ...ranks,
  };
};

const getRequestingUserRank = async (requestingUserId, requestingUserPoints, filter, whereClause, sortBy, platformKey) => {
  if (!requestingUserId) return null;

  if (platformKey) {
    const userConnection = await prisma.platformConnection.findFirst({
      where: { userId: requestingUserId, platform: platformKey },
      select: { rating: true }
    });
    const requestingUserRating = userConnection?.rating ?? -1;

    const [higherRatingCount, equalRatingHigherPointsCount] = await Promise.all([
      prisma.user.count({
        where: {
          ...whereClause,
          platformConnections: {
            some: {
              platform: platformKey,
              rating: { gt: requestingUserRating }
            }
          }
        }
      }),
      prisma.user.count({
        where: {
          ...whereClause,
          OR: [
            {
              points: { gt: requestingUserPoints },
              platformConnections: {
                some: {
                  platform: platformKey,
                  rating: requestingUserRating
                }
              }
            },
            ...(requestingUserRating === -1 ? [
              {
                points: { gt: requestingUserPoints },
                platformConnections: {
                  none: { platform: platformKey }
                }
              }
            ] : [])
          ]
        }
      })
    ]);

    return higherRatingCount + equalRatingHigherPointsCount + 1;
  }

  // Default points sort
  const rank = await prisma.user.count({
    where: { ...whereClause, points: { gt: requestingUserPoints } }
  }).then(n => n + 1);

  return rank;
};

export const getLeaderboard = async (req, res) => {
  const take = parseInt(req.query.take ?? 50, 10);
  const skip = parseInt(req.query.skip ?? 0, 10);
  const filter = req.query.filter;   // 'college' | 'branch' | 'year'
  const sortBy = req.query.sortBy;   // 'all' | 'leetcode' | 'codeforces' | 'codechef'
  const requestingUserId = req.user?.userId;

  // Build where clause based on filter + requesting user's profile
  let whereClause = { points: { gt: 0 } };
  let requestingUser = null;
  if (requestingUserId) {
    requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { college: true, branch: true, year: true, points: true },
    });
  }

  let filterValue = null;
  if (filter && requestingUser) {
    if (filter === "college" && requestingUser.college) {
      whereClause.college = requestingUser.college;
      filterValue = requestingUser.college;
    } else if (filter === "branch" && requestingUser.branch) {
      whereClause.branch = requestingUser.branch;
      filterValue = requestingUser.branch;
    } else if (filter === "year" && requestingUser.year) {
      whereClause.year = requestingUser.year;
      filterValue = requestingUser.year;
    } else if (filter === "class" && requestingUser.branch && requestingUser.year) {
      whereClause.branch = requestingUser.branch;
      whereClause.year = requestingUser.year;
      if (requestingUser.college) {
        whereClause.college = requestingUser.college;
      }
      filterValue = `${requestingUser.college || "none"}_${requestingUser.branch}_${requestingUser.year}`;
    }
  }
  const cacheKey = `leaderboard:${filter ?? "all"}:${filterValue ?? "none"}:${sortBy ?? "points"}:${take}:${skip}`;

  let leaderboardResult = null;
  const cachedLeaderboard = await getCache(cacheKey);

  if (cachedLeaderboard) {
    leaderboardResult = cachedLeaderboard;
  } else {
    const platformKey = PLATFORM_SORT_MAP[sortBy]; // undefined when sortBy is 'all' or absent

    if (platformKey) {
      // Fetch users with their platform connections so we can sort by platform rating in JS
      const allUsers = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          userName: true,
          avatarUrl: true,
          branch: true,
          year: true,
          points: true,
          platformConnections: {
            where: { platform: platformKey },
            select: { rating: true },
            take: 1,
          },
        },
      });

      // Sort by the platform rating descending (users with no connection go to the bottom)
      // Use overall points as a tie-breaker if ratings are equal
      allUsers.sort((a, b) => {
        const ratingA = a.platformConnections[0]?.rating ?? -1;
        const ratingB = b.platformConnections[0]?.rating ?? -1;
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        return (b.points ?? 0) - (a.points ?? 0);
      });

      // Competition ranking: equal ratings share the same rank (matches the
      // rank shown on a user's profile), instead of a dense row index.
      let rank = 0;
      let prevRating = null;
      const usersWithRank = allUsers.map((u, idx) => {
        const { platformConnections, ...rest } = u;
        const rating = platformConnections[0]?.rating ?? -1;
        if (idx === 0 || rating !== prevRating) {
          rank = idx + 1;
        }
        prevRating = rating;
        return {
          ...rest,
          overallRank: rank,
          displayValue: platformConnections[0]?.rating ?? null,
          displayLabel: `${sortBy} rating`,
        };
      });

      const paginatedUsers = usersWithRank.slice(skip, skip + take);
      leaderboardResult = { users: paginatedUsers };
    } else {
      // Default: sort by overall points, paginated at the DB level.
      const pageUsers = await prisma.user.findMany({
        where: whereClause,
        orderBy: [{ points: "desc" }, { createdAt: "asc" }],
        skip,
        take,
        select: {
          id: true,
          name: true,
          userName: true,
          avatarUrl: true,
          branch: true,
          year: true,
          points: true,
        },
      });

      let usersWithRank = [];
      if (pageUsers.length > 0) {
        const rankOffset = await prisma.user.count({
          where: { ...whereClause, points: { gt: pageUsers[0].points } },
        });

        let rank = rankOffset + 1;
        let prevPoints = pageUsers[0].points;
        usersWithRank = pageUsers.map((u, i) => {
          if (i > 0 && u.points !== prevPoints) {
            rank = skip + i + 1;
          }
          prevPoints = u.points;
          return {
            ...u,
            overallRank: rank,
            displayValue: u.points,
            displayLabel: "points",
          };
        });
      }
      leaderboardResult = { users: usersWithRank };
    }

    try {
      await setCache(cacheKey, leaderboardResult, 300);
    } catch (err) {
      console.error("Error writing leaderboard cache:", err);
    }
  }

  // Calculate the requesting user's rank dynamically (not cached)
  let currentUserRank = null;
  if (requestingUserId && requestingUser) {
    const platformKey = PLATFORM_SORT_MAP[sortBy];
    try {
      currentUserRank = await getRequestingUserRank(
        requestingUserId,
        requestingUser.points,
        filter,
        whereClause,
        sortBy,
        platformKey
      );
    } catch (err) {
      console.error("Error calculating current user rank:", err);
    }
  }

  return res.status(200).json({
    ...leaderboardResult,
    currentUserRank,
  });
};

export const getUserByUserName = async (req, res) => {
  const { userName } = req.params;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

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
      createdAt: true,
      socialLinks: true,
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
          topicBreakdown: true,
        },
        orderBy: { platform: "asc" },
      },
      dailyActivity: {
        where: {
          date: { gte: oneYearAgo },
        },
        select: {
          date: true,
          count: true,
        },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  // Dynamically compute ranks via efficient COUNT queries
  const points = user.points ?? 0;
  const [overallRank, branchRank, yearRank, solvedQuestionsCount, solvedSheetProblemsCount] = await Promise.all([
    points > 0
      ? prisma.user.count({ where: { points: { gt: points } } }).then(n => n + 1)
      : Promise.resolve(null),
    (points > 0 && user.branch)
      ? prisma.user.count({ where: { branch: user.branch, points: { gt: points } } }).then(n => n + 1)
      : Promise.resolve(null),
    (points > 0 && user.year)
      ? prisma.user.count({ where: { year: user.year, points: { gt: points } } }).then(n => n + 1)
      : Promise.resolve(null),
    prisma.userQuestionBank.count({ where: { userId: user.id, status: "SOLVED" } }),
    prisma.userSheetProblem.count({ where: { userId: user.id, status: "SOLVED" } }),
  ]);

  return res.status(200).json({
    user: { 
      ...user, 
      overallRank, 
      branchRank, 
      yearRank,
      solvedQuestionsCount: solvedQuestionsCount ?? 0,
      solvedSheetProblemsCount: solvedSheetProblemsCount ?? 0
    },
  });
};

export const updateMe = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.userId;

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { branch: true, branchChangesCount: true, year: true },
  });

  if (!currentUser) return res.status(404).json({ error: "User not found" });

  const updateData = { ...req.body };

  if (updateData.socialLinks !== undefined) {
    updateData.socialLinks = Object.fromEntries(
      Object.entries(updateData.socialLinks).filter(([, value]) => value)
    );
  }

  if (updateData.branch !== undefined && updateData.branch !== currentUser.branch) {
    if (currentUser.branch) {
      if (currentUser.branchChangesCount >= 1) {
        return res.status(400).json({ error: "Branch can only be changed once after onboarding." });
      }
      updateData.branchChangesCount = { increment: 1 };
    }
  }

  if (updateData.year !== undefined && updateData.year !== currentUser.year) {
    if (currentUser.year && currentUser.year !== "N/A") {
      return res.status(400).json({ error: "Graduation year cannot be changed once set." });
    }
    const parsedYear = parseInt(updateData.year, 10);
    if (isNaN(parsedYear) || parsedYear < 2020 || parsedYear > 2100) {
      return res.status(400).json({ error: "Please provide a valid graduation year between 2020 and 2100." });
    }
    updateData.year = String(parsedYear);
  }

  let updated;
  try {
    updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
        branchChangesCount: true,
        socialLinks: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    // Unique constraint violation (e.g. userName already taken)
    if (error?.code === "P2002") {
      const target = error.meta?.target;
      const field = Array.isArray(target) ? target[0] : target;
      return res
        .status(409)
        .json({ error: `That ${field ?? "value"} is already taken.` });
    }
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }

  await deleteCacheByPattern(`user:ranks:${userId}:*`);
  const enriched = await enrichUserWithRanks(updated);
  await deleteCacheByPattern("leaderboard:*");
  return res.status(200).json({ user: enriched });
};
