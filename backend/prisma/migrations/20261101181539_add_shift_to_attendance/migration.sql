/*
  Warnings:

  - A unique constraint covering the columns `[enrollmentId,date,shift,lessonNumber]` on the table `attendances` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shift` to the `attendances` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "attendances_enrollmentId_date_lessonNumber_key";

-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "shift" "Shift" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "attendances_enrollmentId_date_shift_lessonNumber_key" ON "attendances"("enrollmentId", "date", "shift", "lessonNumber");
