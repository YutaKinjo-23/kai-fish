/*
  Warnings:

  - You are about to drop the column `length` on the `Rod` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reel" ADD COLUMN     "spoolDepth" TEXT,
ADD COLUMN     "spoolVariations" TEXT,
ADD COLUMN     "weight" INTEGER;

-- AlterTable
ALTER TABLE "Rod" DROP COLUMN "length",
ADD COLUMN     "lengthFt" TEXT,
ADD COLUMN     "lineMax" TEXT,
ADD COLUMN     "lineMin" TEXT,
ADD COLUMN     "lureWeightMax" DOUBLE PRECISION,
ADD COLUMN     "lureWeightMin" DOUBLE PRECISION,
ADD COLUMN     "memo" TEXT;
