'use client'
// app/(artist)/artist/(auth)/invite/[token]/page.tsx
import { useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { acceptArtistInvite } from '../../../(portal)/actions'
import styles from '../../../artist.module.css'

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await acceptArtistInvite({ token, name, password })
      if (!result.ok) {
        setError(result.error)
        return
      }

      const login = await signIn('credentials', {
        email: result.data,
        password,
        redirect: false,
      })

      if (login?.error) {
        router.push('/artist/login')
        return
      }

      router.push('/artist')
      router.refresh()
    })
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>
          <span className={styles.brandMark}>AQ</span>
          <span className={styles.brandSub}>Artist Portal</span>
        </div>
        <h1 className={styles.authTitle}>Set up access</h1>
        <p className={styles.authSub}>
          Create your password to start managing your artist profile.
        </p>

        <form onSubmit={submit}>
          <div className={styles.field}>
            <label className={styles.label}>Your name</label>
            <input
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Create password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error && <div className={styles.banner}>{error}</div>}
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isPending}
            style={{ width: '100%' }}
          >
            {isPending ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
