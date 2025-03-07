import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const connectDB = async () => {
  await prisma.$connect();
  return prisma;
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
};
