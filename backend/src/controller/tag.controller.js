import { prisma } from "../config/prismaClient.js";

export const listTags = async (req, res) => {
  const questions = await prisma.question.findMany({
    select: { tags: true },
  });
  
  // Flatten, deduplicate, and sort tags
  const tagSet = new Set(questions.flatMap(q => q.tags || []));
  const sortedTags = Array.from(tagSet).sort().map(name => ({ id: name, name }));

  return res.status(200).json({ tags: sortedTags });
};

export const createTag = async (req, res) => {
  const name = req.body.name || "";
  return res.status(201).json({ tag: { id: name, name } });
};

export const deleteTag = async (req, res) => {
  return res.status(204).send();
};

