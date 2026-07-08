-- Migration: add Comment, NewsletterSubscriber, ContactSubmission tables
-- Run with: npx prisma migrate dev --name add_comments_newsletter_contact
-- Or simply: npx prisma db push

CREATE TYPE IF NOT EXISTS "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE IF NOT EXISTS "Comment" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "postId"    TEXT NOT NULL REFERENCES "BlogPost"("id") ON DELETE CASCADE,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "status"    "CommentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "email"     TEXT NOT NULL UNIQUE,
  "name"      TEXT,
  "active"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ContactSubmission" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "subject"   TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "read"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
