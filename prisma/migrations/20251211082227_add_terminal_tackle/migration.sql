-- CreateTable
CREATE TABLE "TerminalTackle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "maker" TEXT,
    "name" TEXT NOT NULL,
    "size" TEXT,
    "weight" TEXT,
    "stockQty" INTEGER,
    "needRestock" BOOLEAN NOT NULL DEFAULT false,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TerminalTackle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TerminalTackle_userId_idx" ON "TerminalTackle"("userId");

-- CreateIndex
CREATE INDEX "TerminalTackle_category_idx" ON "TerminalTackle"("category");

-- AddForeignKey
ALTER TABLE "TerminalTackle" ADD CONSTRAINT "TerminalTackle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
