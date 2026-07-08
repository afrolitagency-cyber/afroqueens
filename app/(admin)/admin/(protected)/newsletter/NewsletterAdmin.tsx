'use client'
// app/(admin)/admin/newsletter/NewsletterAdmin.tsx
import { useState, useTransition } from 'react'
import { removeSubscriber } from './actions'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

interface Sub { id: string; email: string; name: string | null; active: boolean; createdAt: string }

export default function NewsletterAdmin({ initial }: { initial: Sub[] }) {
  const [subs, setSubs]          = useState(initial)
  const [filter, setFilter]      = useState<'ALL'|'ACTIVE'|'INACTIVE'>('ALL')
  const [isPending, startTransition] = useTransition()

  const filtered = filter === 'ALL' ? subs
    : filter === 'ACTIVE' ? subs.filter(s => s.active)
    : subs.filter(s => !s.active)

  const remove = (id: string) => {
    startTransition(async () => {
      await removeSubscriber(id)
      setSubs(prev => prev.filter(s => s.id !== id))
    })
  }

  const exportCSV = () => {
    const active = subs.filter(s => s.active)
    const csv = ['Email,Name,Subscribed'].concat(
      active.map(s => `${s.email},${s.name ?? ''},${new Date(s.createdAt).toLocaleDateString('en-GB')}`)
    ).join('\n')
    const a = document.createElement('a')
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
    a.download = 'afroqueens-subscribers.csv'
    a.click()
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '.8rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {(['ALL','ACTIVE','INACTIVE'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '.35rem .9rem', border: '1px solid', borderRadius: '6px',
              fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em',
              textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              background: filter === f ? '#C8102E' : '#fff',
              color: filter === f ? '#fff' : '#888',
              borderColor: filter === f ? '#C8102E' : '#e5e5e5',
            }}>
            {f} ({(f === 'ALL' ? subs : f === 'ACTIVE' ? subs.filter(s=>s.active) : subs.filter(s=>!s.active)).length})
          </button>
        ))}
        <button onClick={exportCSV}
          style={{
            marginLeft: 'auto', padding: '.35rem 1rem', border: '1px solid #e5e5e5',
            borderRadius: '6px', fontSize: '.72rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', background: '#fff', color: '#444',
          }}>
          ↓ Export CSV
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Status</th>
              <th>Subscribed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className={styles.empty}>No subscribers.</td></tr>
            )}
            {filtered.map(s => (
              <tr key={s.id}>
                <td className={styles.postTitle}>{s.email}</td>
                <td className={styles.date}>{s.name ?? '—'}</td>
                <td>
                  <span className={`${styles.status} ${s.active ? styles.pub : styles.draft}`}>
                    {s.active ? 'Active' : 'Unsubscribed'}
                  </span>
                </td>
                <td className={styles.date}>{new Date(s.createdAt).toLocaleDateString('en-GB')}</td>
                <td>
                  <button
                    disabled={isPending}
                    onClick={() => remove(s.id)}
                    className={`${styles.actionBtn} ${styles.del}`}
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
