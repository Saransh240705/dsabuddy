import { prisma } from "../src/config/prismaClient.js";

async function main() {
  console.log("Seeding leaderboard data...");

  // Update current user (Saransh) to have profile details so filtering works
  const saransh = await prisma.user.findFirst({
    where: { email: "vsaransh6@gmail.com" }
  });

  const nsutCollegeName = "Netaji Subhas University of Technology";

  if (saransh) {
    console.log("Found user Saransh. Setting profile details...");
    await prisma.user.update({
      where: { id: saransh.id },
      data: {
        college: nsutCollegeName,
        branch: "Computer Science",
        year: "2024",
        points: 1200,
      }
    });
  } else {
    console.log("Saransh user not found. Creating default Saransh account...");
    await prisma.user.create({
      data: {
        name: "Saransh",
        userName: "saransh_demo",
        email: "vsaransh6@gmail.com",
        college: nsutCollegeName,
        branch: "Computer Science",
        year: "2024",
        points: 1200,
        passwordHash: null,
        salt: null,
      }
    });
  }

  // Update any other users with nsut.ac.in emails to belong to Netaji Subhas University of Technology
  const nsutUpdates = await prisma.user.updateMany({
    where: {
      email: {
        endsWith: "nsut.ac.in"
      }
    },
    data: {
      college: nsutCollegeName
    }
  });
  console.log(`Updated ${nsutUpdates.count} NSUT user profiles.`);

  // Delete previous mock users
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: "mock_leaderboard_"
      }
    }
  });

  const mockUsers = [
    {
      name: "Sarah Johnson",
      userName: "sarah_j",
      email: "mock_leaderboard_sarah@example.com",
      college: nsutCollegeName,
      branch: "Computer Science",
      year: "2024",
      points: 2450,
    },
    {
      name: "Michael Zhang",
      userName: "michael_z",
      email: "mock_leaderboard_michael@example.com",
      college: nsutCollegeName,
      branch: "Computer Science",
      year: "2024",
      points: 2180,
    },
    {
      name: "Priya Sharma",
      userName: "priya_s",
      email: "mock_leaderboard_priya@example.com",
      college: nsutCollegeName,
      branch: "Information Technology",
      year: "2024",
      points: 1920,
    },
    {
      name: "Rohan Verma",
      userName: "rohan_v",
      email: "mock_leaderboard_rohan@example.com",
      college: nsutCollegeName,
      branch: "Electronics and Communication",
      year: "2025",
      points: 1750,
    },
    {
      name: "Emily Davis",
      userName: "emily_d",
      email: "mock_leaderboard_emily@example.com",
      college: nsutCollegeName,
      branch: "Computer Science",
      year: "2024",
      points: 1600,
    },
    {
      name: "Kabir Singh",
      userName: "kabir_s",
      email: "mock_leaderboard_kabir@example.com",
      college: nsutCollegeName,
      branch: "Information Technology",
      year: "2026",
      points: 1420,
    },
    {
      name: "Aisha Khan",
      userName: "aisha_k",
      email: "mock_leaderboard_aisha@example.com",
      college: nsutCollegeName,
      branch: "Computer Science",
      year: "2025",
      points: 1100,
    },
    {
      name: "Alex Smith",
      userName: "alex_s",
      email: "mock_leaderboard_alex@example.com",
      college: nsutCollegeName,
      branch: "Electronics and Communication",
      year: "2024",
      points: 950,
    }
  ];

  console.log(`Creating ${mockUsers.length} mock users...`);
  for (const user of mockUsers) {
    await prisma.user.create({
      data: {
        ...user,
        passwordHash: null,
        salt: null,
      }
    });
  }

  console.log("Seeding leaderboard completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding leaderboard:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });