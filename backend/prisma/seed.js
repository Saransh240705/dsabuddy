import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../src/config/prismaClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const companyQuestionsPath = path.resolve(__dirname, "../../company_questions.json");
const nsutPlacementsPath = path.resolve(__dirname, "../../nsut_placement.json");

function slugify(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleCase(name) {
  if (!name) return "";
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function mapFrequency(freqStr) {
  if (!freqStr) return "OCCASIONAL";
  const num = parseFloat(freqStr.replace("%", ""));
  if (isNaN(num)) return "OCCASIONAL";
  if (num >= 75) return "VERY_HIGH";
  if (num >= 40) return "HIGH";
  return "OCCASIONAL";
}

function getLeetCodeSlug(url) {
  if (!url) return null;
  const match = url.match(/problems\/([^/]+)/);
  return match ? match[1] : null;
}

async function main() {
  console.log("Starting database seed...");

  // 1. Read files
  console.log("Reading data files...");
  if (!fs.existsSync(companyQuestionsPath)) {
    throw new Error(`company_questions.json not found at ${companyQuestionsPath}`);
  }
  if (!fs.existsSync(nsutPlacementsPath)) {
    throw new Error(`nsut_placement.json not found at ${nsutPlacementsPath}`);
  }

  const rawQuestions = JSON.parse(fs.readFileSync(companyQuestionsPath, "utf-8"));
  const rawPlacements = JSON.parse(fs.readFileSync(nsutPlacementsPath, "utf-8"));

  // 2. Parse & collect unique companies
  console.log("Analyzing companies...");
  const companyMap = new Map(); // slug -> originalName

  if (rawQuestions.companyQuestions) {
    for (const companyName of Object.keys(rawQuestions.companyQuestions)) {
      const slug = slugify(companyName);
      if (slug) {
        companyMap.set(slug, companyName);
      }
    }
  }

  for (const placement of rawPlacements) {
    const slug = slugify(placement.company);
    if (slug && !companyMap.has(slug)) {
      companyMap.set(slug, titleCase(placement.company));
    }
  }

  console.log(`Upserting ${companyMap.size} companies...`);
  for (const [slug, name] of companyMap.entries()) {
    await prisma.company.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
      },
    });
  }

  // 3. Parse & collect unique questions and relations
  console.log("Analyzing questions...");
  const uniqueQuestionsMap = new Map(); // questionSlug -> question details
  const companyQuestionLinks = []; // { companySlug, questionIdSlug, frequency }

  if (rawQuestions.companyQuestions) {
    for (const [companyName, questions] of Object.entries(rawQuestions.companyQuestions)) {
      const companySlug = slugify(companyName);
      if (!companySlug) continue;

      for (const q of questions) {
        const qSlug = getLeetCodeSlug(q.url);
        if (!qSlug) continue;

        const difficulty = (q.difficulty || "medium").toUpperCase();
        const acceptanceRate = q.acceptance
          ? parseFloat(q.acceptance.replace("%", "")) / 100
          : null;
        const frequency = mapFrequency(q.frequency);
        const cleanTags = Array.isArray(q.tags) ? q.tags : [];

        if (!uniqueQuestionsMap.has(qSlug)) {
          uniqueQuestionsMap.set(qSlug, {
            title: q.title,
            difficulty,
            leetcodeUrl: q.url,
            sourcePlatform: "LEETCODE",
            sourceId: qSlug,
            slug: qSlug,
            sourceUrl: q.url,
            acceptanceRate,
            tags: cleanTags,
          });
        }

        companyQuestionLinks.push({
          companySlug,
          questionIdSlug: qSlug,
          frequency,
        });
      }
    }
  }

  // 4. Seed unique questions
  console.log(`Upserting ${uniqueQuestionsMap.size} unique questions...`);
  const uniqueQuestions = Array.from(uniqueQuestionsMap.values());
  let qCount = 0;
  for (const q of uniqueQuestions) {
    await prisma.question.upsert({
      where: {
        sourcePlatform_sourceId: {
          sourcePlatform: q.sourcePlatform,
          sourceId: q.sourceId,
        },
      },
      update: {
        title: q.title,
        difficulty: q.difficulty,
        leetcodeUrl: q.leetcodeUrl,
        sourceUrl: q.sourceUrl,
        acceptanceRate: q.acceptanceRate,
        tags: q.tags,
      },
      create: {
        title: q.title,
        difficulty: q.difficulty,
        leetcodeUrl: q.leetcodeUrl,
        sourcePlatform: q.sourcePlatform,
        sourceId: q.sourceId,
        slug: q.slug,
        sourceUrl: q.sourceUrl,
        acceptanceRate: q.acceptanceRate,
        tags: q.tags,
      },
    });

    qCount++;
    if (qCount % 300 === 0) {
      console.log(`  Upserted ${qCount}/${uniqueQuestions.length} questions`);
    }
  }
  console.log(`Total questions processed: ${qCount}`);

  // 5. Build in-memory mapping to fast-link relations
  console.log("Mapping companies and questions in memory...");
  const dbCompanies = await prisma.company.findMany({ select: { id: true, slug: true } });
  const dbQuestions = await prisma.question.findMany({ select: { id: true, slug: true } });

  const companyIdMap = new Map(dbCompanies.map((c) => [c.slug, c.id]));
  const questionIdMap = new Map(dbQuestions.map((q) => [q.slug, q.id]));

  // 6. Seed CompanyQuestion relations
  console.log(`Upserting ${companyQuestionLinks.length} company-question links...`);
  let linkCount = 0;
  for (const link of companyQuestionLinks) {
    const companyId = companyIdMap.get(link.companySlug);
    const questionId = questionIdMap.get(link.questionIdSlug);

    if (!companyId || !questionId) continue;

    await prisma.companyQuestion.upsert({
      where: {
        companyId_questionId: {
          companyId,
          questionId,
        },
      },
      update: {
        frequency: link.frequency,
      },
      create: {
        companyId,
        questionId,
        frequency: link.frequency,
      },
    });

    linkCount++;
    if (linkCount % 500 === 0) {
      console.log(`  Upserted ${linkCount}/${companyQuestionLinks.length} links`);
    }
  }
  console.log(`Total company-question links processed: ${linkCount}`);

  // 7. Seed Placements (delete existing ones first to prevent duplicates)
  console.log("Deleting old placements...");
  await prisma.placement.deleteMany({});

  console.log(`Inserting ${rawPlacements.length} placements...`);
  for (const placement of rawPlacements) {
    const slug = slugify(placement.company);
    const companyId = companyIdMap.get(slug);

    await prisma.placement.create({
      data: {
        companyId: companyId || null,
        companyName: placement.company,
        role: placement.role || "SWE",
        ctcLpa: typeof placement.ctc_lpa === "number" ? placement.ctc_lpa : null,
        stipendMonth: typeof placement.stipend_month === "number" ? placement.stipend_month : null,
        type: placement.type || null,
        category: placement.category || null,
        eligibleBranches: Array.isArray(placement.eligible_branches)
          ? placement.eligible_branches
          : [],
        minCgpa: typeof placement.min_cgpa === "number" ? placement.min_cgpa : null,
      },
    });
  }
  console.log(`Total placements processed: ${rawPlacements.length}`);

  // 8. Update denormalized counts
  console.log("Updating denormalized question counts for companies...");
  const companyQuestionCounts = await prisma.companyQuestion.groupBy({
    by: ["companyId"],
    _count: {
      questionId: true,
    },
  });

  for (const group of companyQuestionCounts) {
    await prisma.company.update({
      where: { id: group.companyId },
      data: { questionCount: group._count.questionId },
    });
  }

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
