-- CreateTable
CREATE TABLE "Lure" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lureType" TEXT NOT NULL,
    "maker" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "size" TEXT,
    "recommendedHook" TEXT,
    "recommendedRig" TEXT,
    "memo" TEXT,
    "stockQty" INTEGER,
    "needRestock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lure_userId_idx" ON "Lure"("userId");

-- CreateIndex
CREATE INDEX "Lure_lureType_idx" ON "Lure"("lureType");

-- AddForeignKey
ALTER TABLE "Lure" ADD CONSTRAINT "Lure_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
