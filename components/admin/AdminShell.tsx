'use client'
// components/admin/AdminShell.tsx
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import styles from '@/app/(admin)/admin/(protected)/admin.module.css'

interface Props {
  user?: { name?: string | null; email?: string | null } | null
  children: React.ReactNode
}

export default function AdminShell({ user, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [menuOpen])

  return (
    <div className={styles.shell}>
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={styles.main}>
        <AdminTopbar
          user={user}
          onMenuToggle={() => setMenuOpen(o => !o)}
          menuOpen={menuOpen}
        />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
