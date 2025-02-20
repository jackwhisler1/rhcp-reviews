-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "groupId" INTEGER;

-- CreateIndex
CREATE INDEX "Review_songId_idx" ON "Review"("songId");

-- CreateIndex
CREATE INDEX "Review_groupId_idx" ON "Review"("groupId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
