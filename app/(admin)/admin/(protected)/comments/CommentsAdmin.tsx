'use client'
// app/(admin)/admin/comments/CommentsAdmin.tsx
import { useState, useTransition } from 'react'
import { approveComment, rejectComment, deleteComment } from './actions'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

interface Comment {
  id: string; name: string; email: string; body: string
  status: string; createdAt: string
  post: { title: string; slug: string }
}

const STATUS_FILTER = ['ALL', 'PENDING', 'APPROVED', 'REJECTED']

export default function CommentsAdmin({ initial }: { initial: Comment[] }) {
  const [comments, setComments]   = useState(initial)
  const [filter,   setFilter]     = useState('ALL')
  const [isPending, startTransition] = useTransition()

  const filtered = filter === 'ALL' ? comments : comments.filter(c => c.status === filter)

  const act = (id: string, action: 'approve' | 'reject' | 'delete') => {
    startTransition(async () => {
      if (action === 'approve') { await approveComment(id); setComments(prev => prev.map(c => c.id === id ? { ...c, status: 'APPROVED' } : c)) }
      if (action === 'reject')  { await rejectComment(id);  setComments(prev => prev.map(c => c.id === id ? { ...c, status: 'REJECTED' } : c)) }
      if (action === 'delete')  { await deleteComment(id);  setComments(prev => prev.filter(c => c.id !== id)) }
    })
  }

  return (
    <>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {STATUS_FILTER.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '.35rem .9rem', border: '1px solid', borderRadius: '6px',
              fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em',
              textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              background: filter === f ? '#C8102E' : '#fff',
              color:      filter === f ? '#fff' : '#888',
              borderColor: filter === f ? '#C8102E' : '#e5e5e5',
            }}
          >
            {f} {f !== 'ALL' && `(${comments.filter(c => c.status === f).length})`}
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Author</th>
              <th>Comment</th>
              <th>Post</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className={styles.empty}>No comments.</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id}>
                <td>
                  <div className={styles.postTitle}>{c.name}</div>
                  <div className={styles.postSlug}>{c.email}</div>
                </td>
                <td style={{ maxWidth: 260 }}>
                  <div style={{ fontSize: '.82rem', color: '#444', lineHeight: 1.5 }}>
                    {c.body.slice(0, 120)}{c.body.length > 120 ? '…' : ''}
                  </div>
                </td>
                <td>
                  <a href={`/blog/${c.post.slug}`} target="_blank" rel="noreferrer"
                    style={{ color: '#C8102E', fontSize: '.8rem', textDecoration: 'none' }}>
                    {c.post.title}
                  </a>
                </td>
                <td>
                  <span className={`${styles.status} ${c.status === 'APPROVED' ? styles.pub : c.status === 'PENDING' ? styles.draft : ''}`}>
                    {c.status}
                  </span>
                </td>
                <td className={styles.date}>{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                <td>
                  <div className={styles.actions}>
                    {c.status !== 'APPROVED' && (
                      <button disabled={isPending} onClick={() => act(c.id, 'approve')} className={styles.actionBtn}>Approve</button>
                    )}
                    {c.status !== 'REJECTED' && (
                      <button disabled={isPending} onClick={() => act(c.id, 'reject')} className={`${styles.actionBtn}`}>Reject</button>
                    )}
                    <button disabled={isPending} onClick={() => act(c.id, 'delete')} className={`${styles.actionBtn} ${styles.del}`}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
