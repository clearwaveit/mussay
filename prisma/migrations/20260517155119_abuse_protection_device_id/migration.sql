-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "deviceId" TEXT;

-- CreateTable
CREATE TABLE "AbuseRecord" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "blockLevel" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbuseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbuseRecord_participantId_key" ON "AbuseRecord"("participantId");

-- AddForeignKey
ALTER TABLE "AbuseRecord" ADD CONSTRAINT "AbuseRecord_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
