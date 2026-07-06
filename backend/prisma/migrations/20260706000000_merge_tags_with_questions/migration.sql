-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "tags" TEXT[];

-- DropTable
DROP TABLE "QuestionTag";

-- DropTable
DROP TABLE "Tag";
