-- Optional registration per event. Existing events stay required.
-- Run with: npx prisma db push

ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "registrationRequired" BOOLEAN NOT NULL DEFAULT true;
