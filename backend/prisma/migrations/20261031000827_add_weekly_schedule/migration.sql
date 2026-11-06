-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('MANHA', 'TARDE');

-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA');

-- CreateTable
CREATE TABLE "schedule_entries" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "weekDay" "WeekDay" NOT NULL,
    "shift" "Shift" NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedule_entries_classId_weekDay_shift_lessonNumber_key" ON "schedule_entries"("classId", "weekDay", "shift", "lessonNumber");

-- AddForeignKey
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
