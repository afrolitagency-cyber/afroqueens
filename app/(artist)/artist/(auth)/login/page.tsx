'use client'
// app/(artist)/artist/(auth)/login/page.tsx
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../../artist.module.css'

export default function ArtistLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    // Confirm role via a soft navigation; portal layout enforces ARTIST
    router.push('/artist')
    router.refresh()
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>
          <span className={styles.brandMark}>AQ</span>
          <span className={styles.brandSub}>Artist Portal</span>
        </div>
        <h1 className={styles.authTitle}>Sign in</h1>
        <p className={styles.authSub}>
          Manage your Afroqueens profile. Need access? Ask the team for an invite.
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <div className={styles.banner}>{error}</div>}
          <button type="submit" className={styles.primaryBtn} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.authSub} style={{ marginTop: '1.5rem', marginBottom: 0 }}>
          Staff? <Link href="/admin/login" style={{ color: '#fff' }}>Admin login</Link>
        </p>
      </div>
    </div>
  )
}
