-- Separate artist page hero cover from profile avatar
-- Run with: npx prisma db push

ALTER TABLE "Artist" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
