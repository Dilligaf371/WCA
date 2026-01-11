-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "CharacterSyncStatus" AS ENUM ('PENDING', 'SYNCING', 'SYNCED', 'ERROR', 'OUT_OF_SYNC');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CHARACTER_IMPORT', 'CHARACTER_UPDATE', 'NFT_MINT', 'NFT_TRANSFER', 'FIGURINE_BIND', 'FIGURINE_UNBIND', 'OWNERSHIP_VERIFICATION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "walletAddress" TEXT,
    "roles" "UserRole" NOT NULL DEFAULT 'USER',
    "provider" TEXT,
    "providerId" TEXT,
    "oauthEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "figurines" (
    "id" TEXT NOT NULL,
    "nfcUid" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tokenId" BIGINT,
    "contractAddress" TEXT,
    "linkedCharacterId" TEXT,
    "boundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mintedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "figurines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "dndBeyondCharacterId" TEXT,
    "name" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "baseStats" JSONB NOT NULL,
    "derivedStats" JSONB NOT NULL,
    "equipment" JSONB NOT NULL,
    "spells" JSONB,
    "race" TEXT,
    "background" TEXT,
    "alignment" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "CharacterSyncStatus" NOT NULL DEFAULT 'PENDING',
    "syncHash" TEXT,
    "lastDndBeyondHash" TEXT,
    "rawImportData" JSONB,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "userId" TEXT,
    "characterId" TEXT,
    "figurineId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_walletAddress_idx" ON "users"("walletAddress");

-- CreateIndex
CREATE INDEX "users_provider_providerId_idx" ON "users"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "figurines_nfcUid_key" ON "figurines"("nfcUid");

-- CreateIndex
CREATE UNIQUE INDEX "figurines_linkedCharacterId_key" ON "figurines"("linkedCharacterId");

-- CreateIndex
CREATE INDEX "figurines_nfcUid_idx" ON "figurines"("nfcUid");

-- CreateIndex
CREATE INDEX "figurines_ownerId_idx" ON "figurines"("ownerId");

-- CreateIndex
CREATE INDEX "figurines_tokenId_contractAddress_idx" ON "figurines"("tokenId", "contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "characters_dndBeyondCharacterId_key" ON "characters"("dndBeyondCharacterId");

-- CreateIndex
CREATE INDEX "characters_ownerId_idx" ON "characters"("ownerId");

-- CreateIndex
CREATE INDEX "characters_dndBeyondCharacterId_idx" ON "characters"("dndBeyondCharacterId");

-- CreateIndex
CREATE INDEX "characters_syncStatus_idx" ON "characters"("syncStatus");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_characterId_idx" ON "audit_logs"("characterId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "figurines" ADD CONSTRAINT "figurines_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "figurines" ADD CONSTRAINT "figurines_linkedCharacterId_fkey" FOREIGN KEY ("linkedCharacterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
