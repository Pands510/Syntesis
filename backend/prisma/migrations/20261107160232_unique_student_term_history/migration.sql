/*
  Warnings:

  - A unique constraint covering the columns `[studentId,academicTermId,type]` on the table `academic_history` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "academic_history_studentId_academicTermId_type_key" ON "academic_history"("studentId", "academicTermId", "type");
