-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "paidOnly" BOOLEAN,
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourcePlatform" "Platform",
ADD COLUMN     "sourceRating" INTEGER,
ADD COLUMN     "sourceSlug" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

-- CreateIndex
CREATE INDEX "Question_sourcePlatform_idx" ON "Question"("sourcePlatform");

-- CreateIndex
CREATE UNIQUE INDEX "Question_sourcePlatform_sourceId_key" ON "Question"("sourcePlatform", "sourceId");

