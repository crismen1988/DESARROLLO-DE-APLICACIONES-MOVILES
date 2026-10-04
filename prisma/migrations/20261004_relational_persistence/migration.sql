-- Complete the relational model before importing the legacy AppState snapshot.
CREATE TABLE IF NOT EXISTS "DataMigration" (
    "id" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DataMigration_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'es',
ADD COLUMN IF NOT EXISTS "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT,
ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION;

ALTER TABLE "Tour"
ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Place"
ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "ChatMessage"
ADD COLUMN IF NOT EXISTS "displayTimestamp" TEXT;

ALTER TABLE "PushNotification"
ADD COLUMN IF NOT EXISTS "displayTimestamp" TEXT;

CREATE TABLE IF NOT EXISTS "RefreshSession" (
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("tokenHash")
);

CREATE INDEX IF NOT EXISTS "RefreshSession_userId_idx" ON "RefreshSession"("userId");
CREATE INDEX IF NOT EXISTS "RefreshSession_expiresAt_idx" ON "RefreshSession"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "RefreshSession"
  ADD CONSTRAINT "RefreshSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
