-- CreateTable
CREATE TABLE "LineAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineFishingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "autoEnded" BOOLEAN NOT NULL DEFAULT false,
    "assistCount" INTEGER NOT NULL DEFAULT 0,
    "lastEventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LineFishingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineFishingEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LineFishingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventId" TEXT,
    "source" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "localPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LineAccount_userId_key" ON "LineAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LineAccount_lineUserId_key" ON "LineAccount"("lineUserId");

-- CreateIndex
CREATE INDEX "LineFishingSession_userId_startedAt_idx" ON "LineFishingSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "LineFishingSession_userId_endedAt_idx" ON "LineFishingSession"("userId", "endedAt");

-- CreateIndex
CREATE INDEX "LineFishingEvent_userId_occurredAt_idx" ON "LineFishingEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "LineFishingEvent_sessionId_occurredAt_idx" ON "LineFishingEvent"("sessionId", "occurredAt");

-- CreateIndex
CREATE INDEX "ImageAsset_userId_createdAt_idx" ON "ImageAsset"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImageAsset_source_messageId_key" ON "ImageAsset"("source", "messageId");

-- AddForeignKey
ALTER TABLE "LineAccount" ADD CONSTRAINT "LineAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineFishingSession" ADD CONSTRAINT "LineFishingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineFishingEvent" ADD CONSTRAINT "LineFishingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineFishingEvent" ADD CONSTRAINT "LineFishingEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LineFishingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LineFishingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "LineFishingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
