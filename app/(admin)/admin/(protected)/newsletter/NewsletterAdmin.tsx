'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  removeSubscriber,
  importSubscribersCsv,
  createTag,
  deleteTag,
  addSubscriberManual,
  connectTagsToSubscribers,
  updateSubscriber,
} from './actions'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

const SELECTED_KEY = 'afroqueens-newsletter-selected'

export interface SubTag {
  id: string
  name: string
}

export interface Sub {
  id: string
  email: string
  name: string | null
  source: string
  active: boolean
  confirmedAt: string | null
  createdAt: string
  tags: SubTag[]
}

interface Props {
  initial: Sub[]
  tags: SubTag[]
}

export default function NewsletterAdmin({ initial, tags: initialTags }: Props) {
  const [subs, setSubs] = useState(initial)
  const [tags, setTags] = useState(initialTags)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE'>('ALL')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [importOpen, setImportOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [importAsConfirmed, setImportAsConfirmed] = useState(true)
  const [newTag, setNewTag] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualTagIds, setManualTagIds] = useState<string[]>([])
  const [applyTagId, setApplyTagId] = useState('')
  const [editing, setEditing] = useState<Sub | null>(null)
  const [editName, setEditName] = useState('')
  const [editTagIds, setEditTagIds] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const isEligible = (s: Sub) => s.active && s.confirmedAt

  const filtered = useMemo(() => {
    if (filter === 'ALL') return subs
    if (filter === 'ACTIVE') return subs.filter(isEligible)
    if (filter === 'PENDING') return subs.filter(s => s.active && !s.confirmedAt)
    return subs.filter(s => !s.active)
  }, [subs, filter])

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const eligibleIds = filtered.filter(isEligible).map(s => s.id)
    const allSelected = eligibleIds.every(id => selected.has(id))
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        eligibleIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      setSelected(prev => new Set([...Array.from(prev), ...eligibleIds]))
    }
  }

  const composeWithSelected = () => {
    const ids = [...Array.from(selected)]
    if (!ids.length) {
      showToast('Select at least one confirmed subscriber')
      return
    }
    localStorage.setItem(SELECTED_KEY, JSON.stringify(ids))
    window.location.href = '/admin/newsletter/compose?audience=selected'
  }

  const remove = (id: string) => {
    startTransition(async () => {
      await removeSubscriber(id)
      setSubs(prev => prev.filter(s => s.id !== id))
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
    })
  }

  const exportCSV = () => {
    const rows = subs.filter(isEligible)
    const csv = ['Email,Name,Source,Tags,Subscribed'].concat(
      rows.map(s =>
        `${s.email},${s.name ?? ''},${s.source},"${s.tags.map(t => t.name).join(';')}",${new Date(s.createdAt).toLocaleDateString('en-GB')}`,
      ),
    ).join('\n')
    const a = document.createElement('a')
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
    a.download = 'afroqueens-subscribers.csv'
    a.click()
  }

  const runImport = () => {
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean)
    const rows = lines.slice(1).map(line => {
      const [email, name, tagsCol] = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      return { email, name, tags: tagsCol }
    })
    startTransition(async () => {
      try {
        const result = await importSubscribersCsv(rows, { confirmNow: importAsConfirmed })
        showToast(
          importAsConfirmed
            ? `Imported ${result.imported} as confirmed (ready to email), skipped ${result.skipped}.`
            : `Imported ${result.imported}, skipped ${result.skipped}. Confirm emails sent where needed.`,
        )
        setImportOpen(false)
        setCsvText('')
        window.location.reload()
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Import failed')
      }
    })
  }

  const addTag = () => {
    if (!newTag.trim()) return
    startTransition(async () => {
      const tag = await createTag(newTag)
      setTags(prev => (prev.some(t => t.id === tag.id) ? prev : [...prev, tag]))
      setNewTag('')
      showToast(`Tag "${tag.name}" ready`)
    })
  }

  const removeTag = (id: string) => {
    startTransition(async () => {
      await deleteTag(id)
      setTags(prev => prev.filter(t => t.id !== id))
    })
  }

  const addManual = () => {
    if (!manualEmail.trim()) return
    const tagNames = tags.filter(t => manualTagIds.includes(t.id)).map(t => t.name)
    startTransition(async () => {
      await addSubscriberManual(manualEmail, manualName, tagNames.length ? tagNames : undefined)
      showToast(tagNames.length ? `Subscriber added with tag(s): ${tagNames.join(', ')}` : 'Subscriber added')
      setManualEmail('')
      setManualName('')
      setManualTagIds([])
      window.location.reload()
    })
  }

  const applyTagToSelected = () => {
    if (!applyTagId) {
      showToast('Choose a tag to apply')
      return
    }
    const ids = Array.from(selected)
    if (!ids.length) {
      showToast('Select subscribers first')
      return
    }
    const tag = tags.find(t => t.id === applyTagId)
    startTransition(async () => {
      await connectTagsToSubscribers(ids, [applyTagId])
      setSubs(prev =>
        prev.map(s => {
          if (!ids.includes(s.id) || !tag) return s
          if (s.tags.some(t => t.id === tag.id)) return s
          return { ...s, tags: [...s.tags, tag] }
        }),
      )
      showToast(`Applied “${tag?.name}” to ${ids.length} subscriber${ids.length === 1 ? '' : 's'}`)
    })
  }

  const toggleManualTag = (id: string) => {
    setManualTagIds(prev => (prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]))
  }

  const openEdit = (s: Sub) => {
    setEditing(s)
    setEditName(s.name ?? '')
    setEditTagIds(s.tags.map(t => t.id))
  }

  const toggleEditTag = (id: string) => {
    setEditTagIds(prev => (prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]))
  }

  const saveEdit = () => {
    if (!editing) return
    startTransition(async () => {
      try {
        const updated = await updateSubscriber(editing.id, {
          name: editName,
          tagIds: editTagIds,
        })
        const nextTags = updated.tags as SubTag[]
        setSubs(prev =>
          prev.map(s =>
            s.id === editing.id
              ? { ...s, name: updated.name, tags: nextTags }
              : s,
          ),
        )
        setEditing(null)
        showToast('Subscriber updated')
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Update failed')
      }
    })
  }

  const counts = {
    ALL: subs.length,
    ACTIVE: subs.filter(isEligible).length,
    PENDING: subs.filter(s => s.active && !s.confirmedAt).length,
    INACTIVE: subs.filter(s => !s.active).length,
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '.6rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {(['ALL', 'ACTIVE', 'PENDING', 'INACTIVE'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)} style={pillStyle(filter === f)}>
            {f} ({counts[f]})
          </button>
        ))}
        <button type="button" onClick={exportCSV} style={btnStyle}>↓ Export</button>
        <button type="button" onClick={() => setImportOpen(true)} style={btnStyle}>↑ Import CSV</button>
        <Link href="/admin/newsletter/campaigns" style={{ ...btnStyle, textDecoration: 'none' }}>Campaign history</Link>
        <button
          type="button"
          onClick={composeWithSelected}
          disabled={selected.size === 0}
          style={{ ...btnStyle, marginLeft: 'auto', background: selected.size ? '#C8102E' : '#fff', color: selected.size ? '#fff' : '#444', borderColor: selected.size ? '#C8102E' : '#e5e5e5' }}
        >
          Compose to selected ({selected.size})
        </button>
      </div>

      {selected.size > 0 && (
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '.75rem 1rem', background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8 }}>
          <span style={{ fontSize: '.78rem', color: '#666' }}>{selected.size} selected</span>
          <select
            value={applyTagId}
            onChange={e => setApplyTagId(e.target.value)}
            className={styles.input}
            style={{ maxWidth: 200, fontSize: '.8rem' }}
          >
            <option value="">Apply tag…</option>
            {tags.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button type="button" onClick={applyTagToSelected} disabled={isPending || !applyTagId} style={btnStyle}>
            Apply to selected
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px', background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, padding: '1rem' }}>
          <div style={labelStyle}>Tags</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '.6rem' }}>
            {tags.map(t => (
              <span key={t.id} style={{ fontSize: '.72rem', background: 'rgba(200,16,46,.08)', color: '#C8102E', padding: '.2rem .55rem', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}>
                {t.name}
                <button type="button" onClick={() => removeTag(t.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', fontSize: '.9rem' }}>×</button>
              </span>
            ))}
            {!tags.length && <span style={{ fontSize: '.78rem', color: '#aaa' }}>No tags yet</span>}
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="new-tag" className={styles.input} style={{ flex: 1, fontSize: '.8rem' }} />
            <button type="button" onClick={addTag} disabled={isPending} style={btnStyle}>Add tag</button>
          </div>
        </div>
        <div style={{ flex: '1 1 280px', background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, padding: '1rem' }}>
          <div style={labelStyle}>Add subscriber manually</div>
          <input value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="email@domain.com" className={styles.input} style={{ marginBottom: '.5rem', fontSize: '.8rem' }} />
          <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Name (optional)" className={styles.input} style={{ marginBottom: '.5rem', fontSize: '.8rem' }} />
          <div style={{ marginBottom: '.5rem' }}>
            <div style={{ ...labelStyle, marginBottom: '.35rem' }}>Tags (optional)</div>
            {tags.length === 0 ? (
              <span style={{ fontSize: '.78rem', color: '#aaa' }}>Create a tag first (left)</span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                {tags.map(t => {
                  const on = manualTagIds.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleManualTag(t.id)}
                      style={{
                        fontSize: '.72rem',
                        padding: '.25rem .55rem',
                        borderRadius: 20,
                        border: '1px solid',
                        cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                        background: on ? 'rgba(200,16,46,.1)' : '#fff',
                        color: on ? '#C8102E' : '#666',
                        borderColor: on ? '#C8102E' : '#e5e5e5',
                      }}
                    >
                      {t.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <button type="button" onClick={addManual} disabled={isPending} style={btnStyle}>Add (confirmed)</button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={filtered.filter(isEligible).length > 0 && filtered.filter(isEligible).every(s => selected.has(s.id))}
                  onChange={toggleAll}
                  aria-label="Select all eligible"
                />
              </th>
              <th>Email</th>
              <th>Name</th>
              <th>Source</th>
              <th>Tags</th>
              <th>Status</th>
              <th>Subscribed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className={styles.empty}>No subscribers.</td></tr>
            )}
            {filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    disabled={!isEligible(s)}
                    onChange={() => toggleOne(s.id)}
                    aria-label={`Select ${s.email}`}
                  />
                </td>
                <td className={styles.postTitle}>{s.email}</td>
                <td className={styles.date}>{s.name ?? '—'}</td>
                <td className={styles.date}>{s.source}</td>
                <td className={styles.date}>{s.tags.map(t => t.name).join(', ') || '—'}</td>
                <td>
                  <span className={`${styles.status} ${!s.active ? styles.draft : s.confirmedAt ? styles.pub : styles.draft}`}>
                    {!s.active ? 'Unsubscribed' : s.confirmedAt ? 'Confirmed' : 'Pending'}
                  </span>
                </td>
                <td className={styles.date}>{new Date(s.createdAt).toLocaleDateString('en-GB')}</td>
                <td>
                  <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                    <button type="button" disabled={isPending} onClick={() => openEdit(s)} className={styles.actionBtn}>Edit</button>
                    <button disabled={isPending} onClick={() => remove(s.id)} className={`${styles.actionBtn} ${styles.del}`}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {importOpen && (
        <div style={overlayStyle} onClick={() => setImportOpen(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 .5rem', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '.06em' }}>Import CSV</h3>
            <p style={{ fontSize: '.8rem', color: '#666', marginBottom: '.75rem' }}>
              First row: <code>email,name,tags</code>. Tags semicolon-separated.
            </p>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              rows={8}
              placeholder={'email,name,tags\nuser@example.com,Jane,afroqueens-rap'}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '.78rem', padding: '.6rem', border: '1px solid #e5e5e5', borderRadius: 6 }}
            />
            <label style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start', marginTop: '.75rem', fontSize: '.8rem', color: '#444', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={importAsConfirmed}
                onChange={e => setImportAsConfirmed(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span>
                <strong>Import as confirmed</strong> (ready to receive emails). Use this for Google Form / event lists where people already opted in.
                Uncheck to send a double opt-in confirm email instead.
              </span>
            </label>
            <div style={{ display: 'flex', gap: '.6rem', marginTop: '.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setImportOpen(false)} style={btnStyle}>Cancel</button>
              <button type="button" onClick={runImport} disabled={isPending} style={{ ...btnStyle, background: '#C8102E', color: '#fff', borderColor: '#C8102E' }}>Import</button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div style={overlayStyle} onClick={() => setEditing(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 .35rem', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '.06em' }}>Edit subscriber</h3>
            <p style={{ fontSize: '.8rem', color: '#888', margin: '0 0 1rem' }}>{editing.email}</p>
            <div style={labelStyle}>Name</div>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className={styles.input}
              style={{ marginBottom: '.85rem', fontSize: '.8rem' }}
            />
            <div style={labelStyle}>Tags</div>
            {tags.length === 0 ? (
              <p style={{ fontSize: '.78rem', color: '#aaa', marginBottom: '.85rem' }}>Create a tag first, then come back here.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginBottom: '.85rem' }}>
                {tags.map(t => {
                  const on = editTagIds.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleEditTag(t.id)}
                      style={{
                        fontSize: '.72rem',
                        padding: '.25rem .55rem',
                        borderRadius: 20,
                        border: '1px solid',
                        cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                        background: on ? 'rgba(200,16,46,.1)' : '#fff',
                        color: on ? '#C8102E' : '#666',
                        borderColor: on ? '#C8102E' : '#e5e5e5',
                      }}
                    >
                      {t.name}
                    </button>
                  )
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setEditing(null)} style={btnStyle}>Cancel</button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={isPending}
                style={{ ...btnStyle, background: '#C8102E', color: '#fff', borderColor: '#C8102E' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={toastStyle}>{toast}</div>}
    </>
  )
}

const pillStyle = (active: boolean): React.CSSProperties => ({
  padding: '.35rem .9rem', border: '1px solid', borderRadius: 6,
  fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em',
  textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
  background: active ? '#C8102E' : '#fff',
  color: active ? '#fff' : '#888',
  borderColor: active ? '#C8102E' : '#e5e5e5',
})

const btnStyle: React.CSSProperties = {
  padding: '.35rem 1rem', border: '1px solid #e5e5e5', borderRadius: 6,
  fontSize: '.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', background: '#fff', color: '#444',
}

const labelStyle: React.CSSProperties = {
  fontSize: '.68rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#888', marginBottom: '.5rem',
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 500,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
}

const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 10, padding: '1.25rem', maxWidth: 520, width: '100%',
}

const toastStyle: React.CSSProperties = {
  position: 'fixed', bottom: 24, right: 24, background: '#0a0a0a', color: '#fff',
  padding: '.75rem 1.2rem', borderRadius: 8, fontSize: '.82rem', zIndex: 600,
}
