-- Store only a SHA-256 hash of artist invite tokens.
-- Existing tokens are hashed in place, so links already emailed keep working.
-- Run BEFORE deploying the matching code / prisma db push:
--   npx prisma db execute --file prisma/migrations/hash_artist_invite_tokens.sql --schema prisma/schema.prisma

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ArtistInvite' AND column_name = 'token'
  ) THEN
    ALTER TABLE "ArtistInvite" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT;
    UPDATE "ArtistInvite"
      SET "tokenHash" = encode(sha256(convert_to("token", 'UTF8')), 'hex')
      WHERE "tokenHash" IS NULL;
    ALTER TABLE "ArtistInvite" ALTER COLUMN "tokenHash" SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS "ArtistInvite_tokenHash_key" ON "ArtistInvite"("tokenHash");
    ALTER TABLE "ArtistInvite" DROP COLUMN "token";
  END IF;
END $$;
