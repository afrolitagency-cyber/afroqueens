# Afroqueens FM — Changelog

## v2.3 — Community & Discovery Features

### ✨ New Features

**Contact Form** (`/contact`)
- Full page with hero, info sidebar (General, Press, Submissions), and form
- Fields: Name, Email, Subject (dropdown), Message
- Submissions saved to `ContactSubmission` DB table
- Success state shown after submit — no page reload
- API: `POST /api/contact`

**Newsletter Signup**
- `NewsletterSignup` component with `banner` and `inline` variants
- Banner variant added to homepage between Widgets and Now Playing
- Inline variant added inside each blog post (above comments)
- Handles re-subscribe for previously unsubscribed users
- API: `POST /api/newsletter/subscribe`, `POST /api/newsletter/unsubscribe`

**Blog Comments**
- `Comments` component added to every blog post detail page
- Shows approved comments with name, date, avatar initial
- Submit form with Name, Email (private), Comment — goes to `PENDING` on submit
- API: `POST /api/comments`
- Admin moderation: Approve / Reject / Delete with filter tabs (All, Pending, Approved, Rejected)

**Search** (`/search`)
- Full search page with live results as you type
- Searches Blog Posts, Artists, and Episodes in parallel
- Results displayed in typed sections with cover images, excerpts, genres
- Search bar in Navbar (desktop: icon → dropdown; mobile: Search link in menu)
- URL updates with `?q=` param so search links are shareable
- API: `GET /api/search?q=`

**Analytics (Google Analytics 4)**
- GA4 script injected in root layout via `next/script` with `afterInteractive` strategy
- Controlled by `NEXT_PUBLIC_GA_ID` env variable — safe if not set (script not loaded)
- Add `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX` to `.env.local` to activate
- Get your ID: analytics.google.com → Admin → Data Streams → Web Stream

### 🗂 Admin Pages Added

| Page | Route | Description |
|---|---|---|
| Comments | `/admin/comments` | Moderate with Approve/Reject/Delete, filter by status |
| Newsletter | `/admin/newsletter` | View subscribers, filter Active/Inactive, export CSV |
| Inbox | `/admin/inbox` | Split-pane email-client style, mark read, Reply mailto, Delete |

All three added to AdminSidebar under a new **Community** group.
Dashboard already shows Pending Comments, Unread Messages, and Subscribers counts.

### 🗄 Schema Changes
Three new models added to `prisma/schema.prisma`:
- `Comment` (with `CommentStatus` enum: PENDING / APPROVED / REJECTED)
- `NewsletterSubscriber`
- `ContactSubmission`

### One-time setup after deploying
```bash
npx prisma db push
# OR
npx prisma migrate dev --name v2_3_community_features
```
Migration SQL also available at `prisma/migrations/v2_3_community_features.sql`

Add to `.env.local`:
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX   # your GA4 Measurement ID
```

---

## v2.2 — Bug Fix & Completion Patch
_(see previous CHANGELOG entries)_

### Files changed in v2.3
| File | Change |
|---|---|
| `prisma/schema.prisma` | ✨ Comment, NewsletterSubscriber, ContactSubmission models |
| `prisma/migrations/v2_3_community_features.sql` | ✨ Migration SQL |
| `app/(public)/contact/page.tsx` | ✨ Created |
| `app/(public)/contact/ContactForm.tsx` | ✨ Created |
| `app/(public)/contact/contact.module.css` | ✨ Created |
| `app/api/contact/route.ts` | ✨ Created |
| `app/(public)/search/page.tsx` | ✨ Created |
| `app/(public)/search/SearchResults.tsx` | ✨ Created |
| `app/(public)/search/search.module.css` | ✨ Created |
| `app/api/search/route.ts` | ✨ Created |
| `components/public/newsletter/NewsletterSignup.tsx` | ✨ Created |
| `components/public/newsletter/newsletter.module.css` | ✨ Created |
| `app/api/newsletter/subscribe/route.ts` | ✨ Created |
| `app/api/newsletter/unsubscribe/route.ts` | ✨ Created |
| `components/public/blog/Comments.tsx` | ✨ Created |
| `components/public/blog/comments.module.css` | ✨ Created |
| `app/api/comments/route.ts` | ✨ Created |
| `app/(admin)/admin/comments/page.tsx` | ✨ Created |
| `app/(admin)/admin/comments/CommentsAdmin.tsx` | ✨ Created |
| `app/(admin)/admin/comments/actions.ts` | ✨ Created |
| `app/(admin)/admin/newsletter/page.tsx` | ✨ Created |
| `app/(admin)/admin/newsletter/NewsletterAdmin.tsx` | ✨ Created |
| `app/(admin)/admin/newsletter/actions.ts` | ✨ Created |
| `app/(admin)/admin/inbox/page.tsx` | ✨ Created |
| `app/(admin)/admin/inbox/InboxAdmin.tsx` | ✨ Created |
| `app/(admin)/admin/inbox/actions.ts` | ✨ Created |
| `app/(admin)/admin/inbox/inbox.module.css` | ✨ Created |
| `components/admin/AdminSidebar.tsx` | 🔧 Community group added |
| `components/public/nav/Navbar.tsx` | 🔧 Search icon + dropdown added |
| `components/public/nav/Navbar.module.css` | 🔧 Search styles added |
| `app/(public)/page.tsx` | 🔧 NewsletterSignup added |
| `app/(public)/blog/[slug]/page.tsx` | 🔧 Comments + NewsletterSignup added |
| `app/layout.tsx` | 🔧 GA4 script injected |
