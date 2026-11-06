-- AlterTable
ALTER TABLE "professors" ADD COLUMN     "disciplineId" TEXT;

-- AddForeignKey
ALTER TABLE "professors" ADD CONSTRAINT "professors_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "disciplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
