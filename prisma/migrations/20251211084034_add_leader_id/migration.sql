-- AlterTable
ALTER TABLE "TackleSet" ADD COLUMN     "leaderId" TEXT;

-- AddForeignKey
ALTER TABLE "TackleSet" ADD CONSTRAINT "TackleSet_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Line"("id") ON DELETE SET NULL ON UPDATE CASCADE;
