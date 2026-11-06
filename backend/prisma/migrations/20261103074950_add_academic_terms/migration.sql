-- CreateEnum
CREATE TYPE "AcademicTermStatus" AS ENUM ('PLANEJADO', 'EM_ANDAMENTO', 'ENCERRADO');

-- CreateTable
CREATE TABLE "academic_terms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "termNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "AcademicTermStatus" NOT NULL DEFAULT 'PLANEJADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_terms_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "school_classes"
ADD COLUMN "academicTermId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "academic_terms_year_termNumber_key"
ON "academic_terms"("year", "termNumber");

-- AddForeignKey
ALTER TABLE "school_classes"
ADD CONSTRAINT "school_classes_academicTermId_fkey"
FOREIGN KEY ("academicTermId")
REFERENCES "academic_terms"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;