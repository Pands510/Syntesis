-- AlterEnum
ALTER TYPE "AcademicHistoryType" ADD VALUE 'PROGRESSAO';

-- AlterTable
ALTER TABLE "academic_history" ADD COLUMN     "academicTermId" TEXT;

-- CreateIndex
CREATE INDEX "academic_history_academicTermId_idx" ON "academic_history"("academicTermId");

-- AddForeignKey
ALTER TABLE "academic_history" ADD CONSTRAINT "academic_history_academicTermId_fkey" FOREIGN KEY ("academicTermId") REFERENCES "academic_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
