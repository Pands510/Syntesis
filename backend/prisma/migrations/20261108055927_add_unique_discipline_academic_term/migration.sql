/*
  Warnings:

  - A unique constraint covering the columns `[disciplineId,academicTermId]` on the table `school_classes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "school_classes_disciplineId_academicTermId_key" ON "school_classes"("disciplineId", "academicTermId");
