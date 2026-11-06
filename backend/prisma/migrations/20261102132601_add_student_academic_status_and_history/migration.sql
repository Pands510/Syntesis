-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ATIVO', 'TRANCADO');

-- CreateEnum
CREATE TYPE "AcademicHistoryType" AS ENUM ('INGRESSO', 'TRANCAMENTO', 'RETORNO', 'TRANSFERENCIA');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "status" "StudentStatus" NOT NULL DEFAULT 'ATIVO';

-- CreateTable
CREATE TABLE "academic_history" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "AcademicHistoryType" NOT NULL,
    "previousCourseId" TEXT,
    "newCourseId" TEXT,
    "semester" INTEGER,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academic_history_studentId_occurredAt_idx" ON "academic_history"("studentId", "occurredAt");

-- AddForeignKey
ALTER TABLE "academic_history" ADD CONSTRAINT "academic_history_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_history" ADD CONSTRAINT "academic_history_previousCourseId_fkey" FOREIGN KEY ("previousCourseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_history" ADD CONSTRAINT "academic_history_newCourseId_fkey" FOREIGN KEY ("newCourseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
