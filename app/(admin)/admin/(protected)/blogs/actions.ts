'use server'
// app/(admin)/admin/blogs/actions.ts
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { deleteMediaIfReplaced, deleteMediaUrl } from '@/lib/media'
import { withDbRetry, dbErrorMessage } from '@/lib/dbRetry'
import type { ActionResult } from '@/lib/actions'
import { actionOk, actionErr } from '@/lib/actions'

interface BlogPayload {
  title: string
  slug: string
  excerpt?: string
  category: string
  author: string
  coverImageUrl?: string
  content: any
  status: 'DRAFT' | 'PUBLISHED'
  metaTitle?: string
  metaDesc?: string
  featured?: boolean
}

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')
  return session
}

export async function createBlogPost(data: BlogPayload): Promise<ActionResult> {
  await requireAuth()

  if (!data.title?.trim()) return actionErr('Title is required.')
  if (!data.slug?.trim()) return actionErr('Slug is required.')

  const readingTime = estimateReadingTime(data.content)

  try {
    await withDbRetry(() =>
      prisma.blogPost.create({
        data: {
          title:         data.title,
          slug:          data.slug,
          excerpt:       data.excerpt ?? null,
          content:       data.content,
          coverImageUrl: data.coverImageUrl ?? null,
          category:      data.category,
          author:        data.author,
          status:        data.status,
          metaTitle:     data.metaTitle ?? null,
          metaDesc:      data.metaDesc ?? null,
          featured:      data.featured ?? false,
          readingTime,
          publishedAt:   data.status === 'PUBLISHED' ? new Date() : null,
        },
      }),
    )

    revalidatePath('/blog')
    revalidatePath('/')
    revalidatePath('/admin/blogs')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function updateBlogPost(id: string, data: BlogPayload): Promise<ActionResult> {
  await requireAuth()

  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { coverImageUrl: true, slug: true },
  })

  const readingTime = estimateReadingTime(data.content)

  try {
    await withDbRetry(() =>
      prisma.blogPost.update({
        where: { id },
        data: {
          title:         data.title,
          slug:          data.slug,
          excerpt:       data.excerpt ?? null,
          content:       data.content,
          coverImageUrl: data.coverImageUrl ?? null,
          category:      data.category,
          author:        data.author,
          status:        data.status,
          metaTitle:     data.metaTitle ?? null,
          metaDesc:      data.metaDesc ?? null,
          featured:      data.featured ?? false,
          readingTime,
          publishedAt:   data.status === 'PUBLISHED' ? new Date() : null,
        },
      }),
    )

    await deleteMediaIfReplaced(existing?.coverImageUrl, data.coverImageUrl)

    revalidatePath('/blog')
    revalidatePath(`/blog/${data.slug}`)
    if (existing?.slug && existing.slug !== data.slug) {
      revalidatePath(`/blog/${existing.slug}`)
    }
    revalidatePath('/')
    revalidatePath('/admin/blogs')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function deleteBlogPost(id: string): Promise<void> {
  const result = await deleteBlogPostSafe(id)
  if (!result.ok) throw new Error(result.error)
}

export async function deleteBlogPostSafe(id: string): Promise<ActionResult> {
  await requireAuth()
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { coverImageUrl: true, slug: true },
    })
    await withDbRetry(() => prisma.blogPost.delete({ where: { id } }))
    await deleteMediaUrl(post?.coverImageUrl)
    revalidatePath('/blog')
    if (post?.slug) revalidatePath(`/blog/${post.slug}`)
    revalidatePath('/')
    revalidatePath('/admin/blogs')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

function estimateReadingTime(content: any): number {
  if (!content || !Array.isArray(content)) return 1
  const text = content
    .map((block: any) => {
      if (block.content) {
        return block.content.map((c: any) => c.text ?? '').join(' ')
      }
      return ''
    })
    .join(' ')
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
