'use client'

import { Fragment, useState } from 'react'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

export interface CampaignRow {
  id: string
  subject: string
  status: string
  recipientMode: string
  recipientCount: number
  sentCount: number
  failedCount: number
  pendingCount: number
  scheduledFor: string | null
  sentAt: string | null
  createdAt: string
  errorMessage: string | null
}

export default function CampaignHistory({ campaigns }: { campaigns: CampaignRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const statusClass = (status: string) => {
    if (status === 'SENT') return styles.pub
    if (status === 'FAILED') return styles.del
    if (status === 'SENDING' || status === 'SCHEDULED') return styles.draft
    return styles.draft
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Audience</th>
            <th>Status</th>
            <th>Recipients</th>
            <th>Sent / Failed / Pending</th>
            <th>Created</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {campaigns.length === 0 && (
            <tr><td colSpan={7} className={styles.empty}>No campaigns yet.</td></tr>
          )}
          {campaigns.map(c => (
            <Fragment key={c.id}>
              <tr>
                <td className={styles.postTitle}>{c.subject}</td>
                <td className={styles.date}>{c.recipientMode}</td>
                <td>
                  <span className={`${styles.status} ${statusClass(c.status)}`}>{c.status}</span>
                </td>
                <td className={styles.date}>{c.recipientCount}</td>
                <td className={styles.date}>
                  {c.sentCount} / {c.failedCount} / {c.pendingCount}
                </td>
                <td className={styles.date}>
                  {new Date(c.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  >
                    {expanded === c.id ? 'Hide' : 'Details'}
                  </button>
                </td>
              </tr>
              {expanded === c.id && (
                <tr key={`${c.id}-detail`}>
                  <td colSpan={7} style={{ background: '#fafafa', fontSize: '.8rem', color: '#555' }}>
                    {c.scheduledFor && (
                      <div>Scheduled: {new Date(c.scheduledFor).toLocaleString('en-GB')}</div>
                    )}
                    {c.sentAt && (
                      <div>Completed: {new Date(c.sentAt).toLocaleString('en-GB')}</div>
                    )}
                    {c.errorMessage && (
                      <div style={{ color: '#C8102E' }}>Error: {c.errorMessage}</div>
                    )}
                    {c.status === 'SENDING' && c.pendingCount > 0 && (
                      <div style={{ marginTop: '.35rem', color: '#888' }}>
                        Large blast in progress — pending sends resume via cron until complete.
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
