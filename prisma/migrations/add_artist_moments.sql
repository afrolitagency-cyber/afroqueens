-- Artist Moments: event / promo stills on artist pages
-- Run with: npx prisma db push

CREATE TABLE IF NOT EXISTS "ArtistMoment" (
  "id"        TEXT NOT NULL,
  "artistId"  TEXT NOT NULL,
  "imageUrl"  TEXT NOT NULL,
  "caption"   TEXT,
  "linkUrl"   TEXT,
  "order"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ArtistMoment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ArtistMoment_artistId_order_idx" ON "ArtistMoment"("artistId", "order");

DO $$ BEGIN
  ALTER TABLE "ArtistMoment"
    ADD CONSTRAINT "ArtistMoment_artistId_fkey"
    FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
