-- Migration: add general fields to SiteSettings
-- Run with: npx prisma migrate dev --name add_site_settings_general_fields
-- Or simply: npx prisma db push

ALTER TABLE "SiteSettings"
  ADD COLUMN IF NOT EXISTS "siteName"        TEXT NOT NULL DEFAULT 'Afroqueens FM',
  ADD COLUMN IF NOT EXISTS "siteDescription" TEXT NOT NULL DEFAULT 'Celebrating women in Afrobeats and African music culture.',
  ADD COLUMN IF NOT EXISTS "contactEmail"    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "socialInstagram" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "socialTwitter"   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "socialYoutube"   TEXT NOT NULL DEFAULT '';
