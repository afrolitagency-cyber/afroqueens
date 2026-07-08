-- v2.3 Migration: Community features (Comments, Newsletter, Contact)
-- Run with: npx prisma db push
-- Or:       npx prisma migrate dev --name v2_3_community_features

-- Comments
CREATE TABLE IF NOT EXISTS "Comment" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "postId"    TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "status"    TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE
);

-- Newsletter Subscribers
CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "email"     TEXT NOT NULL UNIQUE,
  "name"      TEXT,
  "active"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Contact Submissions
CREATE TABLE IF NOT EXISTS "ContactSubmission" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "subject"   TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "read"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SiteSettings new columns (from v2.2 if not already applied)
ALTER TABLE "SiteSettings"
  ADD COLUMN IF NOT EXISTS "siteName"        TEXT NOT NULL DEFAULT 'Afroqueens FM',
  ADD COLUMN IF NOT EXISTS "siteDescription" TEXT NOT NULL DEFAULT 'Celebrating women in Afrobeats and African music culture.',
  ADD COLUMN IF NOT EXISTS "contactEmail"    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "socialInstagram" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "socialTwitter"   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "socialYoutube"   TEXT NOT NULL DEFAULT '';
