'use client'
// components/admin/AdminSidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './AdminSidebar.module.css'

const NAV = [
  {
    label: 'Content',
    items: [
      { href: '/admin/dashboard',        icon: '▣', label: 'Dashboard'  },
      { href: '/admin/blogs',            icon: '✎', label: 'Blog Posts' },
      { href: '/admin/artists',          icon: '♪', label: 'Artists'    },
      { href: '/admin/gallery',          icon: '⊡', label: 'Gallery'    },
      { href: '/admin/episodes',         icon: '◉', label: 'Episodes'   },
    ],
  },
  {
    label: 'Community',
    items: [
      { href: '/admin/comments',   icon: '◻', label: 'Comments'   },
      { href: '/admin/newsletter', icon: '✉', label: 'Newsletter' },
      { href: '/admin/inbox',      icon: '⊠', label: 'Inbox'      },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/admin/analytics', icon: '◈', label: 'Analytics' },
    ],
  },
  {
    label: 'Site',
    items: [
      { href: '/admin/widgets',          icon: '⊞', label: 'Widget Panel'   },
      { href: '/admin/settings/theme',   icon: '◐', label: 'Theme & Design' },
      { href: '/admin/settings/general', icon: '⚙', label: 'General'        },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoAcc}>AQ</span>
        <span className={styles.logoText}>Admin</span>
      </div>

      {/* Nav groups */}
      {NAV.map(group => (
        <div key={group.label} className={styles.group}>
          <div className={styles.groupLabel}>{group.label}</div>
          {group.items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname.startsWith(item.href) ? styles.active : ''}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      ))}

      {/* Sign out */}
      <div className={styles.bottom}>
        <Link href="/api/auth/signout" className={styles.signout}>
          ← Sign Out
        </Link>
      </div>
    </aside>
  )
}
