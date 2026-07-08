// app/(admin)/admin/comments/page.tsx
import { prisma } from '@/lib/prisma'
import CommentsAdmin from './CommentsAdmin'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

export const dynamic = 'force-dynamic'

export default async function CommentsPage() {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { post: { select: { title: true, slug: true } } },
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Comments</div>
          <div className={styles.sub}>
            {comments.filter(c => c.status === 'PENDING').length} pending moderation
          </div>
        </div>
      </div>
      <CommentsAdmin initial={JSON.parse(JSON.stringify(comments))} />
    </div>
  )
}
