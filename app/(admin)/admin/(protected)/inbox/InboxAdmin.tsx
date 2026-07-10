'use client'
// app/(admin)/admin/inbox/InboxAdmin.tsx
import { useState, useTransition } from 'react'
import { markRead, deleteSubmission } from './actions'
import { addSubscriberFromInbox } from '../newsletter/actions'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'
import inbox from './inbox.module.css'

interface Sub { id: string; name: string; email: string; subject: string; message: string; read: boolean; createdAt: string }

export default function InboxAdmin({ initial }: { initial: Sub[] }) {
  const [items, setItems]         = useState(initial)
  const [selected, setSelected]   = useState<Sub | null>(null)
  const [isPending, startTransition] = useTransition()
  const [newsletterMsg, setNewsletterMsg] = useState<string | null>(null)

  const addToNewsletter = () => {
    if (!selected) return
    startTransition(async () => {
      try {
        await addSubscriberFromInbox(selected.email, selected.name)
        setNewsletterMsg(`Added ${selected.email} — confirmation email sent if needed.`)
        setTimeout(() => setNewsletterMsg(null), 4000)
      } catch (e) {
        setNewsletterMsg(e instanceof Error ? e.message : 'Could not add subscriber')
      }
    })
  }

  const open = (item: Sub) => {
    setSelected(item)
    if (!item.read) {
      startTransition(async () => {
        await markRead(item.id)
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, read: true } : i))
      })
    }
  }

  const del = (id: string) => {
    startTransition(async () => {
      await deleteSubmission(id)
      setItems(prev => prev.filter(i => i.id !== id))
      if (selected?.id === id) setSelected(null)
    })
  }

  return (
    <div className={inbox.layout}>
      {/* List panel */}
      <div className={inbox.list}>
        {items.length === 0 && (
          <div className={inbox.empty}>No messages yet.</div>
        )}
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => open(item)}
            className={`${inbox.row} ${selected?.id === item.id ? inbox.rowActive : ''} ${!item.read ? inbox.rowUnread : ''}`}
          >
            <div className={inbox.rowTop}>
              <span className={inbox.rowName}>{item.name}</span>
              <span className={inbox.rowDate}>{new Date(item.createdAt).toLocaleDateString('en-GB')}</span>
            </div>
            <div className={inbox.rowSubject}>{item.subject}</div>
            <div className={inbox.rowPreview}>{item.message.slice(0, 80)}…</div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div className={inbox.detail}>
        {!selected ? (
          <div className={inbox.empty}>Select a message to read it.</div>
        ) : (
          <>
            <div className={inbox.detailHeader}>
              <div>
                <div className={inbox.detailSubject}>{selected.subject}</div>
                <div className={inbox.detailMeta}>
                  From <strong>{selected.name}</strong> &lt;{selected.email}&gt; ·{' '}
                  {new Date(selected.createdAt).toLocaleString('en-GB')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={addToNewsletter}
                  className={styles.actionBtn}
                >
                  Add to newsletter
                </button>
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className={styles.actionBtn}
                >
                  Reply
                </a>
                <button
                  disabled={isPending}
                  onClick={() => del(selected.id)}
                  className={`${styles.actionBtn} ${styles.del}`}
                >
                  Delete
                </button>
              </div>
            </div>
            {newsletterMsg && (
              <div style={{ padding: '.6rem 1rem', fontSize: '.8rem', color: '#0a6b3a', background: '#f0faf4', borderBottom: '1px solid #e5e5e5' }}>
                {newsletterMsg}
              </div>
            )}
            <div className={inbox.detailBody}>{selected.message}</div>
          </>
        )}
      </div>
    </div>
  )
}
