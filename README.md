# Afroqueens — Next.js Music & Events Platform

A full-stack music and events platform built with Next.js 14, Prisma, Supabase, and Cloudinary.

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Framework   | Next.js 14 (App Router)           |
| Database    | PostgreSQL via Supabase            |
| ORM         | Prisma                            |
| Auth        | NextAuth.js (credentials)         |
| Images      | Cloudinary                        |
| Audio       | Supabase Storage                  |
| Blog Editor | BlockNote (Notion-style blocks)   |
| Styling     | CSS Modules + CSS Variables       |
| Deployment  | Vercel                            |

---

## Project Structure

```
afroqueens/
├── app/
│   ├── (public)/           ← Public-facing frontend
│   │   ├── layout.tsx      ← Ticker + Navbar + Footer wrapper
│   │   ├── page.tsx        ← Home page
│   │   ├── about/
│   │   ├── artists/
│   │   ├── blog/
│   │   │   └── [slug]/     ← Individual blog post
│   │   ├── gallery/
│   │   ├── episodes/
│   │   └── contact/
│   ├── (admin)/            ← CMS — protected by NextAuth
│   │   └── admin/
│   │       ├── login/
│   │       ├── dashboard/
│   │       ├── blogs/      ← Blog list + BlockNote editor
│   │       ├── artists/    ← Artist form + stream source
│   │       ├── gallery/    ← Drag/drop Cloudinary upload
│   │       ├── episodes/   ← Episode form + audio upload
│   │       └── settings/
│   │           └── theme/  ← Live theme & design switcher
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── upload/         ← Cloudinary image upload
│       └── upload/audio/   ← Supabase audio upload
├── components/
│   ├── public/             ← All public UI components
│   │   ├── nav/            ← Ticker, Navbar
│   │   ├── hero/           ← D1 + D2 hero variants
│   │   ├── artists/        ← ArtistCard
│   │   ├── blog/           ← BlockRenderer
│   │   ├── gallery/        ← GalleryGrid (filterable)
│   │   ├── episodes/       ← EpisodeList (filterable)
│   │   └── Footer.tsx
│   ├── admin/              ← CMS UI
│   │   ├── AdminSidebar
│   │   ├── AdminTopbar     ← Theme/design switcher
│   │   ├── editors/        ← BlockNote editor
│   │   └── uploads/        ← Cloudinary + Supabase upload
│   └── player/             ← NowPlaying bar (multi-source)
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── cloudinary.ts
│   ├── supabase.ts
│   └── theme.ts
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

---

## Setup Guide

### 1. Clone and install

```bash
git clone https://github.com/yourname/afroqueens.git
cd afroqueens
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your connection strings from **Settings → Database**
3. Create a storage bucket called `afroqueens-audio` (set to Public)

### 3. Set up Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com) → Sign up free
2. Copy your **Cloud name, API Key, API Secret** from the dashboard
3. Create a folder called `afroqueens` in your Media Library

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Push database schema

```bash
npx prisma db push
```

### 6. Seed the database

```bash
npm run db:seed
```

This creates:
- Admin user: `admin@afroqueens.fm` / `afroqueens2025!`
- 4 sample artists
- 3 sample blog posts
- 4 sample episodes
- 7 sample gallery items
- Site settings (dark theme, design 1)

⚠️ **Change the admin password immediately after first login.**

### 7. Run the development server

```bash
npm run dev
```

| URL                              | Description        |
|----------------------------------|--------------------|
| http://localhost:3000            | Public site        |
| http://localhost:3000/admin/login | CMS login         |
| http://localhost:3000/admin/dashboard | Admin panel  |

---

## Theme System

The site has **2 designs × 2 themes = 4 combinations**:

| Design | Theme | Feel |
|--------|-------|------|
| 1      | Dark  | Bebas Neue, pure black, editorial |
| 1      | Light | Bebas Neue, warm cream, editorial |
| 2      | Dark  | Syne, deep indigo-black, rounded cards |
| 2      | Light | Syne, cool lavender, rounded cards |

Admins switch the live theme from **Admin → Topbar → Theme & Design pills**. Changes apply instantly across the whole site via `revalidatePath('/', 'layout')`.

---

## CMS Features

### Blog
- BlockNote editor (Notion-style `/` slash commands)
- Headings, paragraphs, bullet lists, numbered lists
- Image upload to Cloudinary via drag & drop
- Code blocks, tables, quotes
- Draft / Publish workflow
- Auto-slug from title
- SEO title + description fields
- Reading time auto-calculated
- Featured post toggle

### Artists
- Profile image upload → Cloudinary
- 4 stream sources: YouTube, Spotify, SoundCloud, Custom upload
- Custom audio → Supabase Storage (free 1GB)
- Featured toggle (appears in hero)
- Display order

### Gallery
- Drag & drop multi-image upload → Cloudinary
- Category tagging
- Featured toggle
- Caption editing inline

### Episodes
- Episode number + duration + release date
- Audio upload → Supabase Storage
- Cover image → Cloudinary
- Category filter

---

## Music Playback (Free)

| Source     | Cost  | How it works |
|------------|-------|--------------|
| YouTube    | Free  | YouTube IFrame API — full songs via official audio videos |
| Spotify    | Free  | Embed iframe — 30s preview (full for Premium users) |
| SoundCloud | Free  | Widget API — public tracks |
| Custom     | Free* | Direct MP3 from Supabase Storage (artist must own rights) |

*Supabase Storage free tier: 1GB

---

## Deployment (Vercel)

```bash
npm install -g vercel
vercel
```

Add all `.env.local` variables to Vercel **Project Settings → Environment Variables**.

Set `NEXTAUTH_URL` to your production domain:
```
NEXTAUTH_URL=https://afroqueens.fm
```

---

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:push      # Push schema changes to DB
npm run db:migrate   # Create migration file
npm run db:studio    # Open Prisma Studio (DB browser)
npm run db:seed      # Seed sample data
```
