/*
  Warnings:

  - You are about to drop the column `spots` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "spots";

-- CreateTable
CREATE TABLE "Spot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Spot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteSpot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteSpot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Spot_area_idx" ON "Spot"("area");

-- CreateIndex
CREATE UNIQUE INDEX "Spot_name_area_key" ON "Spot"("name", "area");

-- CreateIndex
CREATE INDEX "FavoriteSpot_userId_idx" ON "FavoriteSpot"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteSpot_userId_spotId_key" ON "FavoriteSpot"("userId", "spotId");

-- AddForeignKey
ALTER TABLE "FavoriteSpot" ADD CONSTRAINT "FavoriteSpot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteSpot" ADD CONSTRAINT "FavoriteSpot_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
