-- AlterTable
ALTER TABLE "FishingEvent" ADD COLUMN     "lureId" TEXT;

-- AlterTable
ALTER TABLE "Lure" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "recommendedSinkerWeight" TEXT,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "conditionMemo" TEXT,
ADD COLUMN     "rigExamples" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "timeZones" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "seasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tides" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "waterQualities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "waterTempC" DOUBLE PRECISION,
ADD COLUMN     "windDirection" TEXT,
ADD COLUMN     "windSpeedMs" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "FishingEvent_lureId_idx" ON "FishingEvent"("lureId");

-- AddForeignKey
ALTER TABLE "FishingEvent" ADD CONSTRAINT "FishingEvent_lureId_fkey" FOREIGN KEY ("lureId") REFERENCES "Lure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
