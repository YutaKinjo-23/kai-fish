/*
  Warnings:

  - You are about to drop the column `area` on the `FishingLog` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `FishingLog` table. All the data in the column will be lost.
  - You are about to drop the column `mainTarget` on the `FishingLog` table. All the data in the column will be lost.
  - You are about to drop the column `rigType` on the `FishingLog` table. All the data in the column will be lost.
  - You are about to drop the column `spotName` on the `FishingLog` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `FishingLog` table. All the data in the column will be lost.
  - You are about to drop the column `tackleSetName` on the `FishingLog` table. All the data in the column will be lost.
  - You are about to drop the `CatchRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CatchRecord" DROP CONSTRAINT "CatchRecord_fishingLogId_fkey";

-- DropIndex
DROP INDEX "FishingLog_area_idx";

-- DropIndex
DROP INDEX "FishingLog_mainTarget_idx";

-- AlterTable
ALTER TABLE "FishingLog" DROP COLUMN "area",
DROP COLUMN "endTime",
DROP COLUMN "mainTarget",
DROP COLUMN "rigType",
DROP COLUMN "spotName",
DROP COLUMN "startTime",
DROP COLUMN "tackleSetName";

-- DropTable
DROP TABLE "CatchRecord";

-- CreateTable
CREATE TABLE "FishingEvent" (
    "id" TEXT NOT NULL,
    "fishingLogId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "area" TEXT,
    "spotName" TEXT,
    "target" TEXT,
    "tackle" TEXT,
    "rig" TEXT,
    "speciesId" TEXT,
    "sizeCm" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FishingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FishingEvent_fishingLogId_idx" ON "FishingEvent"("fishingLogId");

-- CreateIndex
CREATE INDEX "FishingEvent_type_idx" ON "FishingEvent"("type");

-- AddForeignKey
ALTER TABLE "FishingEvent" ADD CONSTRAINT "FishingEvent_fishingLogId_fkey" FOREIGN KEY ("fishingLogId") REFERENCES "FishingLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
