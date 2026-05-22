-- CreateEnum
CREATE TYPE "CodeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('QR', 'CODE');

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Code" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "status" "CodeStatus" NOT NULL DEFAULT 'PENDING',
    "participantId" TEXT,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "Code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "type" "EntryType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyClickAnalytic" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyClickAnalytic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_phone_key" ON "Participant"("phone");

-- CreateIndex
CREATE INDEX "Participant_phone_idx" ON "Participant"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Code_code_key" ON "Code"("code");

-- CreateIndex
CREATE INDEX "Code_code_idx" ON "Code"("code");

-- CreateIndex
CREATE INDEX "Code_participantId_idx" ON "Code"("participantId");

-- CreateIndex
CREATE INDEX "Entry_participantId_idx" ON "Entry"("participantId");

-- AddForeignKey
ALTER TABLE "Code" ADD CONSTRAINT "Code_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
