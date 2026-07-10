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
    where:  { email: 'admin@afroqueens.fm' },
    create: {
      email:    'admin@afroqueens.fm',
      password: hashedPassword,
      name:     'Afroqueens Admin',
      role:     'SUPER_ADMIN',
    },
    update: {},
  })
  console.log('✓ Admin user:', admin.email)

  // ── 3. Artists ───────────────────────────────────────────
  const artists = [
    {
      name:             'Zara Echo',
      slug:             'zara-echo',
      genre:            'Afropop · R&B',
      location:         'Lagos, Nigeria',
      monthlyListeners: '1.3M',
      bio:              'Zara Echo is a genre-defying artist from Lagos whose music bridges the gap between Afropop and contemporary R&B.',
      streamSource:     'YOUTUBE' as const,
      youtubeVideoId:   '',
      instagramUrl:     'https://instagram.com/afroqueensfm',
      twitterUrl:       'https://x.com/afroqueensfm',
      releaseUrl:       'https://open.spotify.com/artist/example',
      featured:         true,
      order:            0,
    },
    {
      name:             'Kola Waves',
      slug:             'kola-waves',
      genre:            'Afrobeats',
      location:         'Lagos, Nigeria',
      monthlyListeners: '2.1M',
      bio:              'Kola Waves brings the energy of Lagos to the world stage with pulsating Afrobeats productions.',
      streamSource:     'YOUTUBE' as const,
      youtubeVideoId:   '',
      featured:         false,
      order:            1,
    },
    {
      name:             'Adaeze',
      slug:             'adaeze',
      genre:            'Electronic · Soul',
      location:         'Abuja, Nigeria',
      monthlyListeners: '890K',
      bio:              'Adaeze crafts ethereal electronic soundscapes that blur the line between soul music and ambient art.',
      streamSource:     'SOUNDCLOUD' as const,
      soundcloudUrl:    '',
      featured:         false,
      order:            2,
    },
    {
      name:             'Emeka Duo',
      slug:             'emeka-duo',
      genre:            'Highlife · Jazz',
      location:         'Port Harcourt, Nigeria',
      monthlyListeners: '560K',
      bio:              'Emeka Duo revives the golden era of Nigerian Highlife with jazz-infused arrangements and rich storytelling.',
      streamSource:     'SPOTIFY' as const,
      spotifyTrackId:   '',
      featured:         false,
      order:            3,
    },
  ]

  for (const artist of artists) {
    await prisma.artist.upsert({ where: { slug: artist.slug }, create: artist, update: {} })
  }
  console.log(`✓ ${artists.length} artists`)

  // ── 4. Blog posts ────────────────────────────────────────
  const sampleBlock = [
    {
      id:      'block1',
      type:    'paragraph',
      content: [{ type: 'text', text: 'This is placeholder content. Replace it in the CMS editor.', styles: {} }],
    },
  ]

  const posts = [
    {
      title:         'How Afrobeats Rewired the Global Music Industry in a Single Decade',
      slug:          'how-afrobeats-rewired-global-music-industry',
      excerpt:       "From Fela Kuti's protest anthems to Burna Boy's Grammy pulpit, the story of African music's global ascent is one of defiance, community, and unstoppable rhythm.",
      content:       sampleBlock,
      category:      'Cover Story',
      author:        'Afroqueens Editorial',
      status:        'PUBLISHED' as const,
      featured:      true,
      readingTime:   12,
      publishedAt:   new Date('2025-05-01'),
      coverImageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200',
    },
    {
      title:         'Adaeze: Silence as an Instrument',
      slug:          'adaeze-silence-as-an-instrument',
      excerpt:       'The electronic producer explains why she records in absolute darkness and why restraint is the hardest lesson music taught her.',
      content:       sampleBlock,
      category:      'Artist Profile',
      author:        'Afroqueens Editorial',
      status:        'PUBLISHED' as const,
      featured:      false,
      readingTime:   7,
      publishedAt:   new Date('2025-04-15'),
      coverImageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200',
    },
    {
      title:         'Lagos Electronic: 40,000 Souls in Motion',
      slug:          'lagos-electronic-festival-review',
      excerpt:       'Our correspondent filed this from the pit of the main stage as the sun set over Lagos Island. A night no one will forget.',
      content:       sampleBlock,
      category:      'Event Review',
      author:        'Afroqueens Editorial',
      status:        'PUBLISHED' as const,
      featured:      false,
      readingTime:   5,
      publishedAt:   new Date('2025-03-22'),
      coverImageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
    },
    {
      title:         'The New Wave: 10 Nigerian Women Shaping African Sound in 2025',
      slug:          'new-wave-nigerian-women-shaping-african-sound-2025',
      excerpt:       'From Abuja to Amsterdam, these artists are rewriting the rules of what African music can be.',
      content:       sampleBlock,
      category:      'Cover Story',
      author:        'Afroqueens Editorial',
      status:        'DRAFT' as const,
      featured:      false,
      readingTime:   9,
      coverImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200',
    },
  ]

  for (const post of posts) {
    const { slug, ...data } = post
    await prisma.blogPost.upsert({
      where:  { slug },
      create: post,
      update: {
        coverImageUrl: data.coverImageUrl,
        featured:      data.featured,
        excerpt:       data.excerpt,
        category:      data.category,
        readingTime:   data.readingTime,
      },
    })
  }
  console.log(`✓ ${posts.length} blog posts (${posts.filter(p => p.status === 'PUBLISHED').length} published, ${posts.filter(p => p.status === 'DRAFT').length} draft)`)

  // ── 5. Sample comments (approved) ───────────────────────
  const coverPost = await prisma.blogPost.findUnique({
    where: { slug: 'how-afrobeats-rewired-global-music-industry' },
  })

  if (coverPost) {
    const comments = [
      {
        postId:    coverPost.id,
        name:      'Chisom Okafor',
        email:     'chisom@example.com',
        body:      'This piece is everything. Afrobeats deserves every bit of its global recognition. Thank you for documenting it so beautifully.',
        status:    'APPROVED' as const,
        createdAt: new Date('2025-05-03'),
      },
      {
        postId:    coverPost.id,
        name:      'David Mensah',
        email:     'david@example.com',
        body:      "Incredible read. I'd love to see a follow-up piece specifically on Highlife's contribution to the movement.",
        status:    'APPROVED' as const,
        createdAt: new Date('2025-05-05'),
      },
      {
        postId:    coverPost.id,
        name:      'Anonymous User',
        email:     'anon@example.com',
        body:      'This is spam content that should be moderated.',
        status:    'PENDING' as const,
        createdAt: new Date('2025-05-06'),
      },
    ]

    for (const comment of comments) {
      const exists = await prisma.comment.findFirst({
        where: { postId: coverPost.id, email: comment.email },
      })
      if (!exists) await prisma.comment.create({ data: comment })
    }
    console.log(`✓ ${comments.length} sample comments (${comments.filter(c => c.status === 'APPROVED').length} approved, 1 pending)`)
  }

  // ── 6. Newsletter subscribers ────────────────────────────
  const subscribers = [
    { email: 'chisom@example.com',  name: 'Chisom Okafor',  active: true, source: 'footer' },
    { email: 'fatima@example.com',  name: 'Fatima Aliyu',   active: true, source: 'footer' },
    { email: 'david@example.com',   name: 'David Mensah',   active: true, source: 'blog' },
    { email: 'amaka@example.com',   name: 'Amaka Eze',      active: true, source: 'manual' },
    { email: 'ibrahim@example.com', name: 'Ibrahim Lawal',  active: true, source: 'footer' },
    { email: 'grace@example.com',   name: 'Grace Adeyemi',  active: false, source: 'footer' },
  ]

  const now = new Date()
  for (const sub of subscribers) {
    await prisma.newsletterSubscriber.upsert({
      where:  { email: sub.email },
      create: { ...sub, confirmedAt: sub.active ? now : null },
      update: { source: sub.source, confirmedAt: sub.active ? now : null },
    })
  }
  console.log(`✓ ${subscribers.length} newsletter subscribers (${subscribers.filter(s => s.active).length} active)`)

  // ── 7. Contact submissions ───────────────────────────────
  const contactMessages = [
    {
      name:    'Temi Williams',
      email:   'temi@pressagency.com',
      subject: 'Press & Media',
      message: 'Hi Afroqueens team, I represent a music journalism outlet and would love to explore a partnership for our upcoming African music special. Could we schedule a call this week?',
      read:    true,
    },
    {
      name:    'Nonso Eze',
      email:   'nonso@afrosound.ng',
      subject: 'Artist Submission',
      message: "I'm a producer from Enugu working with an emerging Afrobeats artist. We'd love to be considered for an artist profile. I'll attach our press kit in a follow-up.",
      read:    false,
    },
    {
      name:    'Yemi Adebola',
      email:   'yemi@gmail.com',
      subject: 'General Enquiry',
      message: 'Love the platform! Any plans for a podcast or YouTube channel? The Afroqueens brand would translate incredibly well to video.',
      read:    false,
    },
  ]

  for (const msg of contactMessages) {
    const exists = await prisma.contactSubmission.findFirst({ where: { email: msg.email } })
    if (!exists) await prisma.contactSubmission.create({ data: msg })
  }
  console.log(`✓ ${contactMessages.length} contact messages (${contactMessages.filter(m => !m.read).length} unread)`)

  // ── 8. Episodes ──────────────────────────────────────────
  const episodes = [
    {
      number:      47,
      title:       'The Frequency: Inside the Studio with Kola Waves',
      subtitle:    'Production · Afrobeats · Behind the Music',
      description: "We spent 48 hours inside Kola's Lagos studio as he put the finishing touches on his third album.",
      duration:    '58:22',
      releaseDate: new Date('2025-05-03'),
      category:    'INTERVIEWS' as const,
      featured:    true,
    },
    {
      number:      46,
      title:       'Silence & Sound: Adaeze on Electronic Music',
      subtitle:    'Electronic · Ambient · Interview',
      description: 'A deep conversation with Adaeze about her creative process and the role of silence in her music.',
      duration:    '44:07',
      releaseDate: new Date('2025-04-19'),
      category:    'INTERVIEWS' as const,
      featured:    false,
    },
    {
      number:      45,
      title:       'Live at Lagos: Festival Debrief 2025',
      subtitle:    'Live Event · Culture · Community',
      description: 'Our full breakdown of the Lagos Electronic Festival 2025.',
      duration:    '1:12:44',
      releaseDate: new Date('2025-04-05'),
      category:    'EVENT_COVERAGE' as const,
      featured:    false,
    },
    {
      number:      44,
      title:       'Highlife Revival: The Emeka Duo Story',
      subtitle:    'Highlife · Jazz · Heritage',
      description: "How Emeka Duo is breathing new life into Nigeria's most iconic musical tradition.",
      duration:    '51:38',
      releaseDate: new Date('2025-03-22'),
      category:    'DEEP_DIVES' as const,
      featured:    false,
    },
  ]

  for (const ep of episodes) {
    await prisma.episode.upsert({ where: { number: ep.number }, create: ep, update: {} })
  }
  console.log(`✓ ${episodes.length} episodes`)

  // ── 9. Gallery ───────────────────────────────────────────
  const galleryItems = [
    { label: 'Lagos Sessions',    category: 'LIVE_SESSIONS'     as const, imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', featured: true,  order: 0 },
    { label: 'Studio Chronicles', category: 'STUDIO'            as const, imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800', featured: false, order: 1 },
    { label: 'Festival Lights',   category: 'FESTIVALS'         as const, imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800', featured: false, order: 2 },
    { label: 'Backstage',         category: 'BEHIND_THE_SCENES' as const, imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', featured: false, order: 3 },
    { label: 'Portrait Series',   category: 'PORTRAITS'         as const, imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800', featured: false, order: 4 },
    { label: 'On the Road',       category: 'ON_THE_ROAD'       as const, imageUrl: 'https://images.unsplash.com/photo-1508997449629-303059a039c0?w=800', featured: false, order: 5 },
    { label: 'Sound Check',       category: 'STUDIO'            as const, imageUrl: 'https://images.unsplash.com/photo-1519925610903-381054cc2a1c?w=800', featured: false, order: 6 },
  ]

  for (const item of galleryItems) {
    const exists = await prisma.galleryItem.findFirst({ where: { label: item.label } })
    if (!exists) await prisma.galleryItem.create({ data: item })
  }
  console.log(`✓ ${galleryItems.length} gallery items`)

  // ── 10. Widget ───────────────────────────────────────────
  const existingWidget = await prisma.widget.findFirst()
  if (!existingWidget) {
    await prisma.widget.create({
      data: {
        type:     'YOUTUBE',
        title:    'Afroqueens FM — Latest Mix',
        embedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        position: 'RIGHT',
        active:   false,
        order:    0,
      },
    })
    console.log('✓ Sample widget (inactive by default)')
  }

  // ── Done ────────────────────────────────────────────────
  console.log('\n✅ Seed complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin login:')
  console.log('  URL:      http://localhost:3000/admin/login')
  console.log('  Email:    admin@afroqueens.fm')
  console.log('  Password: afroqueens2025!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚠️  Change the admin password immediately after first login!')
  console.log('')
  console.log('Dashboard counts after seed:')
  console.log('  Comments inbox  → 1 pending comment to moderate')
  console.log('  Contact inbox   → 2 unread messages')
  console.log('  Newsletter      → 5 active subscribers')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
