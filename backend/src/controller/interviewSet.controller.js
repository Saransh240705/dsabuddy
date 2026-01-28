import { prisma } from "../config/prismaClient.js";

export const listInterviewSetsByCompany = async (req, res) => {
  const { companyId } = req.params;

  const sets = await prisma.interviewSet.findMany({
    where: { companyId },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      companyId: true,
      name: true,
      tag: true,
      lastUpdated: true,
      easyCount: true,
      easyTotal: true,
      mediumCount: true,
      mediumTotal: true,
      hardCount: true,
      hardTotal: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ interviewSets: sets });
};

export const createInterviewSet = async (req, res) => {
  const { companyId } = req.params;

  const created = await prisma.interviewSet.create({
    data: { companyId, ...req.body },
    select: {
      id: true,
      companyId: true,
      name: true,
      tag: true,
      lastUpdated: true,
      easyCount: true,
      easyTotal: true,
      mediumCount: true,
      mediumTotal: true,
      hardCount: true,
      hardTotal: true,
      createdAt: true,
    },
  });

  return res.status(201).json({ interviewSet: created });
};

export const updateInterviewSet = async (req, res) => {
  const { id } = req.params;

  const updated = await prisma.interviewSet.update({
    where: { id },
    data: req.body,
    select: {
      id: true,
      companyId: true,
      name: true,
      tag: true,
      lastUpdated: true,
      easyCount: true,
      easyTotal: true,
      mediumCount: true,
      mediumTotal: true,
      hardCount: true,
      hardTotal: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ interviewSet: updated });
};

export const deleteInterviewSet = async (req, res) => {
  const { id } = req.params;
  await prisma.interviewSet.delete({ where: { id } });
  return res.status(204).send();
};

