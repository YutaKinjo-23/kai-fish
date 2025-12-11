-- CreateTable
CREATE TABLE "FishingLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "spotName" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "mainTarget" TEXT NOT NULL,
    "tackleSetName" TEXT,
    "rigType" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FishingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatchRecord" (
    "id" TEXT NOT NULL,
    "fishingLogId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "sizeCm" DOUBLE PRECISION,
    "count" INTEGER NOT NULL DEFAULT 1,
    "caughtAt" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatchRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FishingLog_userId_idx" ON "FishingLog"("userId");

-- CreateIndex
CREATE INDEX "FishingLog_date_idx" ON "FishingLog"("date");

-- CreateIndex
CREATE INDEX "FishingLog_area_idx" ON "FishingLog"("area");

-- CreateIndex
CREATE INDEX "FishingLog_mainTarget_idx" ON "FishingLog"("mainTarget");

-- CreateIndex
CREATE INDEX "CatchRecord_fishingLogId_idx" ON "CatchRecord"("fishingLogId");

-- AddForeignKey
ALTER TABLE "FishingLog" ADD CONSTRAINT "FishingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatchRecord" ADD CONSTRAINT "CatchRecord_fishingLogId_fkey" FOREIGN KEY ("fishingLogId") REFERENCES "FishingLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
