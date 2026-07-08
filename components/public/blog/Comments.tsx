'use client'
// components/public/blog/Comments.tsx
import { useState, useTransition } from 'react'
import styles from './comments.module.css'

interface Comment {
  id: string
  name: string
  body: string
  createdAt: string
}

interface Props {
  postId: string
  initial: Comment[]
}

export default function Comments({ postId, initial }: Props) {
  const [comments, setComments] = useState<Comment[]>(initial)
  const [isPending, startTransition] = useTransition()
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [body,    setBody]    = useState('')
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const submit = () => {
    if (!name || !email || !body) { setError('Please fill in all fields.'); return }
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, name, email, body }),
      })
      if (res.ok) {
        setSent(true)
        setName(''); setEmail(''); setBody('')
      } else {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div className={styles.wrap}>
      <h3 className={styles.heading}>
        {comments.length > 0
          ? `${comments.length} Comment${comments.length > 1 ? 's' : ''}`
          : 'Comments'}
      </h3>

      {/* Comment list */}
      {comments.length > 0 ? (
        <div className={styles.list}>
          {comments.map(c => (
            <div key={c.id} className={styles.comment}>
              <div className={styles.avatar}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentName}>{c.name}</span>
                  <span className={styles.commentDate}>
                    {new Date(c.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
                <p className={styles.commentText}>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No comments yet. Be the first to share your thoughts.</p>
      )}

      {/* Form */}
      <div className={styles.form}>
        <h4 className={styles.formTitle}>Leave a Comment</h4>

        {sent ? (
          <div className={styles.pending}>
            ✓ Your comment has been submitted and is awaiting moderation. Thank you!
          </div>
        ) : (
          <>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Name</label>
                <input
                  className={styles.input}
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email <span className={styles.priv}>(not published)</span></label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Comment</label>
              <textarea
                className={styles.textarea}
                rows={5}
                placeholder="Share your thoughts…"
                value={body}
                onChange={e => setBody(e.target.value)}
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button
              onClick={submit}
              disabled={isPending}
              className={styles.btn}
            >
              {isPending ? 'Posting…' : 'Post Comment'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
