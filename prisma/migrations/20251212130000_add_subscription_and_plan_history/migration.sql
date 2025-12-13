-- AlterTable: Add subscriptionId to User for future billing integration
ALTER TABLE "User" ADD COLUMN "subscriptionId" TEXT;

-- CreateTable: PlanHistory for audit tracking of plan changes
CREATE TABLE "PlanHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromPlan" TEXT NOT NULL,
    "toPlan" TEXT NOT NULL,
    "reason" TEXT,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanHistory_userId_idx" ON "PlanHistory"("userId");

-- AddForeignKey
ALTER TABLE "PlanHistory" ADD CONSTRAINT "PlanHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
