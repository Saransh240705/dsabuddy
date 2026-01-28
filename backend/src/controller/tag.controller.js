import { prisma } from "../config/prismaClient.js";

export const listTags = async (req, res) => {
  const tags = await prisma.tag.findMany({
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true },
  });

  return res.status(200).json({ tags });
};

export const createTag = async (req, res) => {
  const tag = await prisma.tag.create({
    data: req.body,
    select: { id: true, name: true },
  });

  return res.status(201).json({ tag });
};

export const deleteTag = async (req, res) => {
  const { id } = req.params;
  await prisma.tag.delete({ where: { id } });
  return res.status(204).send();
};

