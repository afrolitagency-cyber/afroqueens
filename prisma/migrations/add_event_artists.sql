-- Link events to performing artists (implicit many-to-many).
-- Run with: npx prisma db push

CREATE TABLE IF NOT EXISTS "_ArtistToEvent" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_ArtistToEvent_AB_unique" ON "_ArtistToEvent"("A", "B");
CREATE INDEX IF NOT EXISTS "_ArtistToEvent_B_index" ON "_ArtistToEvent"("B");
