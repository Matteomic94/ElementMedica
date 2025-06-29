/*
  Warnings:

  - You are about to drop the `Trainer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CourseSchedule" DROP CONSTRAINT "CourseSchedule_trainerId_fkey";

-- DropForeignKey
ALTER TABLE "CourseSession" DROP CONSTRAINT "CourseSession_coTrainerId_fkey";

-- DropForeignKey
ALTER TABLE "CourseSession" DROP CONSTRAINT "CourseSession_trainerId_fkey";

-- DropForeignKey
ALTER TABLE "LetteraIncarico" DROP CONSTRAINT "LetteraIncarico_trainerId_fkey";

-- DropForeignKey
ALTER TABLE "RegistroPresenze" DROP CONSTRAINT "RegistroPresenze_formatoreId_fkey";

-- DropForeignKey
ALTER TABLE "TestDocument" DROP CONSTRAINT "TestDocument_trainerId_fkey";

-- DropForeignKey
ALTER TABLE "Trainer" DROP CONSTRAINT "Trainer_tenantId_fkey";

-- DropTable
DROP TABLE "Trainer";

-- AddForeignKey
ALTER TABLE "CourseSchedule" ADD CONSTRAINT "CourseSchedule_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSession" ADD CONSTRAINT "CourseSession_coTrainerId_fkey" FOREIGN KEY ("coTrainerId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSession" ADD CONSTRAINT "CourseSession_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LetteraIncarico" ADD CONSTRAINT "LetteraIncarico_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroPresenze" ADD CONSTRAINT "RegistroPresenze_formatoreId_fkey" FOREIGN KEY ("formatoreId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDocument" ADD CONSTRAINT "TestDocument_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
