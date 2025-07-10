/*
  Warnings:

  - A unique constraint covering the columns `[userId,songId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Review_groupId_idx";

-- DropIndex
DROP INDEX "Review_userId_songId_groupId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_songId_key" ON "Review"("userId", "songId");
