// app/(public)/blog/[slug]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import BlockRenderer from '@/components/public/blog/BlockRenderer'
import Comments from '@/components/public/blog/Comments'
import NewsletterSignup from '@/components/public/newsletter/NewsletterSignup'
import SiteWidgets from '@/components/public/widgets/SiteWidgets'
import styles from './blogpost.module.css'
import type { Metadata } from 'next'
import { buildMetadata, articleJsonLd } from '@/lib/seo'

interface Props { params: { slug: string } }

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

export default async function BlogPostPage({ params }: Props) {
  const [post, widgets, comments] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { slug: params.slug, status: 'PUBLISHED' },
      include: { tags: true },
    }),
    prisma.widget.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.comment.findMany({
      where: {
        post: { slug: params.slug },
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, body: true, createdAt: true },
    }),
  ])

  if (!post) notFound()

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

      {/* Body */}
      <div className={`si ${styles.body}`}>
        <BlockRenderer content={post.content} />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className={styles.tags}>
            {post.tags.map(tag => (
              <span key={tag.id} className={styles.tag}>{tag.name}</span>
            ))}
          </div>
        )}
      </div>

      {/* Newsletter */}
      <div className="si" style={{ padding: '0 4rem' }}>
        <NewsletterSignup variant="inline" />
      </div>

      {/* Comments */}
      <div className="si" style={{ padding: '0 4rem 4rem' }}>
        <Comments
          postId={post.id}
          initial={comments.map(c => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
          }))}
        />
      </div>

      {/* Widgets (rails on desktop, stack before footer on tablet/mobile) */}
      <SiteWidgets widgets={widgets} />
    </main>
  )
}
