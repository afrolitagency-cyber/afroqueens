// prisma/seed.ts
// Run with: npm run db:seed
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Afroqueens database…\n')

  // ── 1. Site settings ──────────────────────────────────────
  await prisma.siteSettings.upsert({
    where:  { id: 'singleton' },
    create: {
      id:              'singleton',
      theme:           'DARK',
      design:          'ONE',
      siteName:        'Afroqueens FM',
      siteDescription: 'Celebrating women in Afrobeats and African music culture.',
      contactEmail:    'hello@afroqueens.fm',
      socialInstagram: 'https://instagram.com/afroqueensfm',
      socialTwitter:   'https://x.com/afroqueensfm',
      socialYoutube:   'https://youtube.com/@afroqueensfm',
    },
    update: {},
  })
  console.log('✓ Site settings')

  // ── 2. Admin user ────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('afroqueens2025!', 12)
  const admin = await prisma.user.upsert({
    where:  { email: 'afrolitagency@gmail.com' },
    create: {
      email:    'afrolitagency@gmail.com',
      password: hashedPassword,
      name:     'Afroqueens Admin',
      role:     'SUPER_ADMIN',
    },
    update: {},
  })
  console.log('✓ Admin user:', admin.email)

  // ── 3. One blog post ─────────────────────────────────────
  const sampleBlock = [
    {
      id:      'block1',
      type:    'paragraph',
      content: [{ type: 'text', text: 'This is placeholder content. Replace it in the CMS editor.', styles: {} }],
    },
  ]

  await prisma.blogPost.upsert({
    where:  { slug: 'welcome-to-afroqueens' },
    create: {
      title:         'Welcome to Afroqueens',
      slug:          'welcome-to-afroqueens',
      excerpt:       'A starting post for your CMS. Edit or replace this from the admin.',
      content:       sampleBlock,
      category:      'Cover Story',
      author:        'Afroqueens Editorial',
      status:        'PUBLISHED',
      featured:      true,
      readingTime:   3,
      publishedAt:   new Date(),
      coverImageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200',
    },
    update: {},
  })
  console.log('✓ 1 blog post')

  // ── 4. One gallery image ─────────────────────────────────
  const galleryLabel = 'Lagos Sessions'
  const existingGallery = await prisma.galleryItem.findFirst({ where: { label: galleryLabel } })
  if (!existingGallery) {
    await prisma.galleryItem.create({
      data: {
        label:    galleryLabel,
        category: 'LIVE_SESSIONS',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        featured: true,
        order:    0,
      },
    })
  }
  console.log('✓ 1 gallery item')

  console.log('\n✅ Seed complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin login:')
  console.log('  URL:      http://localhost:3000/admin/login')
  console.log('  Email:    afrolitagency@gmail.com')
  console.log('  Password: afroqueens2025!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚠️  Change the admin password immediately after first login!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
