// app/(public)/blog/[slug]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import BlockRenderer from '@/components/public/blog/BlockRenderer'
import BlogSidebar, { type SidebarPost } from '@/components/public/blog/BlogSidebar'
import Comments from '@/components/public/blog/Comments'
import styles from './blogpost.module.css'
import type { Metadata } from 'next'
import { buildMetadata, articleJsonLd } from '@/lib/seo'

interface Props { params: { slug: string } }

const sidebarSelect = {
  id: true, title: true, slug: true, category: true,
  publishedAt: true, readingTime: true, featured: true, coverImageUrl: true,
} as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug, status: 'PUBLISHED' },
    select: { title: true, metaTitle: true, metaDesc: true, excerpt: true, coverImageUrl: true },
  })
  if (!post) return {}
  return buildMetadata({
    title:       post.metaTitle ?? post.title,
    description: post.metaDesc ?? post.excerpt ?? undefined,
    slug:        `blog/${params.slug}`,
    image:       post.coverImageUrl ?? undefined,
    type:        'article',
  })
}

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
  })
  return posts.map(p => ({ slug: p.slug }))
}

function pickRelated(
  currentId: string,
  sameCategory: SidebarPost[],
  featured: SidebarPost[],
  recent: SidebarPost[],
  limit = 4,
): SidebarPost[] {
  const seen = new Set([currentId])
  const out: SidebarPost[] = []

  for (const pool of [sameCategory, featured, recent]) {
    for (const post of pool) {
      if (seen.has(post.id)) continue
      seen.add(post.id)
      out.push(post)
      if (out.length >= limit) return out
    }
  }
  return out
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug, status: 'PUBLISHED' },
    include: { tags: true },
  })

  if (!post) notFound()

  const [comments, sameCategory, featured, recent] = await Promise.all([
    prisma.comment.findMany({
      where: {
        post: { slug: params.slug },
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, body: true, createdAt: true },
    }),
    prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        category: post.category,
        id: { not: post.id },
      },
      take: 4,
      orderBy: { publishedAt: 'desc' },
      select: sidebarSelect,
    }),
    prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        featured: true,
        id: { not: post.id },
      },
      take: 3,
      orderBy: { publishedAt: 'desc' },
      select: sidebarSelect,
    }),
    prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: post.id },
      },
      take: 6,
      orderBy: { publishedAt: 'desc' },
      select: sidebarSelect,
    }),
  ])

  const related = pickRelated(post.id, sameCategory, featured, recent)

  const jsonLd = articleJsonLd({
    title:       post.metaTitle ?? post.title,
    description: post.metaDesc ?? post.excerpt ?? post.title,
    slug:        post.slug,
    image:       post.coverImageUrl ?? undefined,
    publishedAt: post.publishedAt ?? post.createdAt,
    updatedAt:   post.updatedAt,
  })

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <div className={styles.hero}>
        {post.coverImageUrl && (
          <div
            className={styles.heroBg}
            style={{ backgroundImage: `url(${post.coverImageUrl})` }}
          />
        )}
        <div className={styles.heroOverlay} />
        <div className={`si ${styles.heroContent}`}>
          <div className={styles.cat}>{post.category}</div>
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.meta}>
            <span>{post.author}</span>
            <span className={styles.dot}>·</span>
            <span>
              {post.publishedAt?.toLocaleDateString('en-GB', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </span>
            {post.readingTime && (
              <>
                <span className={styles.dot}>·</span>
                <span>{post.readingTime} min read</span>
              </>
            )}
          </div>
          {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
        </div>
      </div>

      {/* Body + sidebar */}
      <div className={`si ${styles.layout}`}>
        <div className={styles.body}>
          <BlockRenderer content={post.content} />

          {post.tags.length > 0 && (
            <div className={styles.tags}>
              {post.tags.map(tag => (
                <span key={tag.id} className={styles.tag}>{tag.name}</span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.rail}>
          <BlogSidebar posts={related} showNewsletter />
        </div>
      </div>

      {/* Comments */}
      <div className={`si ${styles.comments}`}>
        <Comments
          postId={post.id}
          initial={comments.map(c => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
          }))}
        />
      </div>
    </main>
  )
}
