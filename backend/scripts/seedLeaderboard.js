import { prisma } from "../src/config/prismaClient.js";

async function main() {
  console.log("Seeding leaderboard data...");

  const nsutCollegeName = "Netaji Subhas University of Technology";

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