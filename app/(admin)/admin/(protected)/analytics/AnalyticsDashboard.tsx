'use client'

import { useState } from 'react'
import styles from './analytics.module.css'

type Range = '7d' | '28d' | '90d' | '12mo'

const RANGES: { id: Range; label: string }[] = [
  { id: '7d', label: '7 Days' },
  { id: '28d', label: '28 Days' },
  { id: '90d', label: '90 Days' },
  { id: '12mo', label: '12 Months' },
]

const DATA: Record<Range, {
  label: string
  realtime: number
  stats: { icon: string; bg: string; color: string; val: string; change: string; up: boolean; label: string }[]
  topPages: { path: string; views: number; pct: number }[]
  sources: { name: string; icon: string; bg: string; users: number; pct: number; bar: number }[]
  countries: { flag: string; name: string; users: number; pct: number; bar: number }[]
  devices: { mobile: number; desktop: number; tablet: number }
  newUsers: number
  returning: number
}> = {
  '7d': {
    label: 'Last 7 Days',
    realtime: 142,
    stats: [
      { icon: '◎', bg: '#C8102E18', color: '#C8102E', val: '31,208', change: '↑ 14.2%', up: true, label: 'Total Users' },
      { icon: '⊕', bg: '#2563eb18', color: '#2563eb', val: '49,610', change: '↑ 9.8%', up: true, label: 'Page Views' },
      { icon: '◷', bg: '#7c3aed18', color: '#7c3aed', val: '3m 08s', change: '↑ 5.1%', up: true, label: 'Avg. Session' },
      { icon: '◌', bg: '#0891b218', color: '#0891b2', val: '41.6%', change: '↓ 1.8%', up: false, label: 'Bounce Rate' },
    ],
    topPages: [
      { path: '/blog/how-afrobeats-rewired…', views: 6020, pct: 100 },
      { path: '/artists', views: 4686, pct: 78 },
      { path: '/ (Homepage)', views: 3825, pct: 63 },
      { path: '/blog/adaeze-silence-as-an-i…', views: 2470, pct: 41 },
      { path: '/episodes', views: 1885, pct: 31 },
      { path: '/blog/lagos-electronic-fest…', views: 1550, pct: 26 },
    ],
    sources: [
      { name: 'Google / Organic', icon: 'G', bg: '#4285F4', users: 13530, pct: 43, bar: 100 },
      { name: 'Instagram', icon: 'IG', bg: '#E1306C', users: 7110, pct: 23, bar: 53 },
      { name: 'X / Twitter', icon: 'X', bg: '#1DA1F2', users: 4055, pct: 13, bar: 30 },
      { name: 'Direct', icon: 'D', bg: '#0a0a0a', users: 3707, pct: 12, bar: 27 },
      { name: 'WhatsApp', icon: 'W', bg: '#25D366', users: 2804, pct: 9, bar: 21 },
    ],
    countries: [
      { flag: '🇳🇬', name: 'Nigeria', users: 12030, pct: 39, bar: 100 },
      { flag: '🇬🇧', name: 'United Kingdom', users: 6610, pct: 21, bar: 55 },
      { flag: '🇺🇸', name: 'United States', users: 5075, pct: 16, bar: 42 },
      { flag: '🇬🇭', name: 'Ghana', users: 2720, pct: 9, bar: 22 },
      { flag: '🇨🇦', name: 'Canada', users: 1686, pct: 5, bar: 14 },
      { flag: '🇿🇦', name: 'South Africa', users: 1255, pct: 4, bar: 10 },
      { flag: '🌍', name: 'Other', users: 1830, pct: 6, bar: 8 },
    ],
    devices: { mobile: 62, desktop: 28, tablet: 10 },
    newUsers: 68,
    returning: 32,
  },
  '28d': {
    label: 'Last 28 Days',
    realtime: 142,
    stats: [
      { icon: '◎', bg: '#C8102E18', color: '#C8102E', val: '124,830', change: '↑ 18.4%', up: true, label: 'Total Users' },
      { icon: '⊕', bg: '#2563eb18', color: '#2563eb', val: '198,442', change: '↑ 12.1%', up: true, label: 'Page Views' },
      { icon: '◷', bg: '#7c3aed18', color: '#7c3aed', val: '3m 24s', change: '↑ 8.7%', up: true, label: 'Avg. Session' },
      { icon: '◌', bg: '#0891b218', color: '#0891b2', val: '38.2%', change: '↓ 2.3%', up: false, label: 'Bounce Rate' },
    ],
    topPages: [
      { path: '/blog/how-afrobeats-rewired…', views: 24120, pct: 100 },
      { path: '/artists', views: 18744, pct: 78 },
      { path: '/ (Homepage)', views: 15302, pct: 63 },
      { path: '/blog/adaeze-silence-as-an-i…', views: 9881, pct: 41 },
      { path: '/episodes', views: 7540, pct: 31 },
      { path: '/blog/lagos-electronic-fest…', views: 6200, pct: 26 },
    ],
    sources: [
      { name: 'Google / Organic', icon: 'G', bg: '#4285F4', users: 54120, pct: 43, bar: 100 },
      { name: 'Instagram', icon: 'IG', bg: '#E1306C', users: 28440, pct: 23, bar: 53 },
      { name: 'X / Twitter', icon: 'X', bg: '#1DA1F2', users: 16220, pct: 13, bar: 30 },
      { name: 'Direct', icon: 'D', bg: '#0a0a0a', users: 14830, pct: 12, bar: 27 },
      { name: 'WhatsApp', icon: 'W', bg: '#25D366', users: 11218, pct: 9, bar: 21 },
    ],
    countries: [
      { flag: '🇳🇬', name: 'Nigeria', users: 48120, pct: 39, bar: 100 },
      { flag: '🇬🇧', name: 'United Kingdom', users: 26440, pct: 21, bar: 55 },
      { flag: '🇺🇸', name: 'United States', users: 20302, pct: 16, bar: 42 },
      { flag: '🇬🇭', name: 'Ghana', users: 10881, pct: 9, bar: 22 },
      { flag: '🇨🇦', name: 'Canada', users: 6744, pct: 5, bar: 14 },
      { flag: '🇿🇦', name: 'South Africa', users: 5021, pct: 4, bar: 10 },
      { flag: '🌍', name: 'Other', users: 7322, pct: 6, bar: 8 },
    ],
    devices: { mobile: 62, desktop: 28, tablet: 10 },
    newUsers: 68,
    returning: 32,
  },
  '90d': {
    label: 'Last 90 Days',
    realtime: 142,
    stats: [
      { icon: '◎', bg: '#C8102E18', color: '#C8102E', val: '382,410', change: '↑ 22.6%', up: true, label: 'Total Users' },
      { icon: '⊕', bg: '#2563eb18', color: '#2563eb', val: '608,220', change: '↑ 16.4%', up: true, label: 'Page Views' },
      { icon: '◷', bg: '#7c3aed18', color: '#7c3aed', val: '3m 31s', change: '↑ 11.2%', up: true, label: 'Avg. Session' },
      { icon: '◌', bg: '#0891b218', color: '#0891b2', val: '36.8%', change: '↓ 3.1%', up: false, label: 'Bounce Rate' },
    ],
    topPages: [
      { path: '/blog/how-afrobeats-rewired…', views: 72400, pct: 100 },
      { path: '/artists', views: 56200, pct: 78 },
      { path: '/ (Homepage)', views: 45800, pct: 63 },
      { path: '/blog/adaeze-silence-as-an-i…', views: 29600, pct: 41 },
      { path: '/episodes', views: 22600, pct: 31 },
      { path: '/blog/lagos-electronic-fest…', views: 18600, pct: 26 },
    ],
    sources: [
      { name: 'Google / Organic', icon: 'G', bg: '#4285F4', users: 164440, pct: 43, bar: 100 },
      { name: 'Instagram', icon: 'IG', bg: '#E1306C', users: 86400, pct: 23, bar: 53 },
      { name: 'X / Twitter', icon: 'X', bg: '#1DA1F2', users: 49280, pct: 13, bar: 30 },
      { name: 'Direct', icon: 'D', bg: '#0a0a0a', users: 45080, pct: 12, bar: 27 },
      { name: 'WhatsApp', icon: 'W', bg: '#25D366', users: 34100, pct: 9, bar: 21 },
    ],
    countries: [
      { flag: '🇳🇬', name: 'Nigeria', users: 146200, pct: 39, bar: 100 },
      { flag: '🇬🇧', name: 'United Kingdom', users: 80300, pct: 21, bar: 55 },
      { flag: '🇺🇸', name: 'United States', users: 61600, pct: 16, bar: 42 },
      { flag: '🇬🇭', name: 'Ghana', users: 33000, pct: 9, bar: 22 },
      { flag: '🇨🇦', name: 'Canada', users: 20460, pct: 5, bar: 14 },
      { flag: '🇿🇦', name: 'South Africa', users: 15240, pct: 4, bar: 10 },
      { flag: '🌍', name: 'Other', users: 22240, pct: 6, bar: 8 },
    ],
    devices: { mobile: 64, desktop: 26, tablet: 10 },
    newUsers: 66,
    returning: 34,
  },
  '12mo': {
    label: 'Last 12 Months',
    realtime: 142,
    stats: [
      { icon: '◎', bg: '#C8102E18', color: '#C8102E', val: '1.48M', change: '↑ 31.2%', up: true, label: 'Total Users' },
      { icon: '⊕', bg: '#2563eb18', color: '#2563eb', val: '2.36M', change: '↑ 24.8%', up: true, label: 'Page Views' },
      { icon: '◷', bg: '#7c3aed18', color: '#7c3aed', val: '3m 18s', change: '↑ 14.5%', up: true, label: 'Avg. Session' },
      { icon: '◌', bg: '#0891b218', color: '#0891b2', val: '37.4%', change: '↓ 4.2%', up: false, label: 'Bounce Rate' },
    ],
    topPages: [
      { path: '/blog/how-afrobeats-rewired…', views: 288000, pct: 100 },
      { path: '/artists', views: 224000, pct: 78 },
      { path: '/ (Homepage)', views: 182000, pct: 63 },
      { path: '/blog/adaeze-silence-as-an-i…', views: 118000, pct: 41 },
      { path: '/episodes', views: 90200, pct: 31 },
      { path: '/blog/lagos-electronic-fest…', views: 74400, pct: 26 },
    ],
    sources: [
      { name: 'Google / Organic', icon: 'G', bg: '#4285F4', users: 636400, pct: 43, bar: 100 },
      { name: 'Instagram', icon: 'IG', bg: '#E1306C', users: 334400, pct: 23, bar: 53 },
      { name: 'X / Twitter', icon: 'X', bg: '#1DA1F2', users: 190600, pct: 13, bar: 30 },
      { name: 'Direct', icon: 'D', bg: '#0a0a0a', users: 174400, pct: 12, bar: 27 },
      { name: 'WhatsApp', icon: 'W', bg: '#25D366', users: 131800, pct: 9, bar: 21 },
    ],
    countries: [
      { flag: '🇳🇬', name: 'Nigeria', users: 566000, pct: 39, bar: 100 },
      { flag: '🇬🇧', name: 'United Kingdom', users: 311000, pct: 21, bar: 55 },
      { flag: '🇺🇸', name: 'United States', users: 238000, pct: 16, bar: 42 },
      { flag: '🇬🇭', name: 'Ghana', users: 127400, pct: 9, bar: 22 },
      { flag: '🇨🇦', name: 'Canada', users: 79000, pct: 5, bar: 14 },
      { flag: '🇿🇦', name: 'South Africa', users: 58800, pct: 4, bar: 10 },
      { flag: '🌍', name: 'Other', users: 86200, pct: 6, bar: 8 },
    ],
    devices: { mobile: 65, desktop: 25, tablet: 10 },
    newUsers: 64,
    returning: 36,
  },
}

export default function AnalyticsDashboard({ gaConnected }: { gaConnected: boolean }) {
  const [range, setRange] = useState<Range>('28d')
  const d = DATA[range]
  const { mobile, desktop, tablet } = d.devices

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.sub}>Powered by Google Analytics 4 · Data updates every 24 hours</p>
      </div>

      <div className={styles.topBar}>
        <div className={styles.dateTabs}>
          {RANGES.map(r => (
            <button
              key={r.id}
              type="button"
              className={`${styles.dateTab} ${range === r.id ? styles.dateTabActive : ''}`}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className={styles.topBarRight}>
          <span className={styles.realtimeBadge}>
            <span className={styles.rtDot} />
            {d.realtime.toLocaleString()} users right now
          </span>
          <div className={styles.gaNotice}>
            <span className={`${styles.gaDot} ${!gaConnected ? styles.gaDotOff : ''}`} />
            {gaConnected ? (
              <>
                GA4 connected ·{' '}
                <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">
                  Open GA4 Dashboard ↗
                </a>
              </>
            ) : (
              <>
                GA4 not configured ·{' '}
                <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">
                  Set up GA4 ↗
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {d.stats.map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className={styles.statVal}>{s.val}</div>
            <div className={`${styles.statChange} ${s.up ? styles.up : styles.down}`}>{s.change}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>Traffic Overview — {d.label}</span>
          <div className={styles.chartLegend}>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: '#C8102E' }} />
              Users
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: '#e5e5e5' }} />
              Page Views
            </div>
          </div>
        </div>
        <div className={styles.chartRow}>
          <div className={styles.yLabels}>
            <span>8K</span><span>6K</span><span>4K</span><span>2K</span><span>0</span>
          </div>
          <div className={styles.chartArea}>
            <svg viewBox="0 0 700 180" preserveAspectRatio="none" className={styles.chartSvg}>
              <line x1="0" y1="0" x2="700" y2="0" stroke="#f5f5f5" strokeWidth="1" />
              <line x1="0" y1="45" x2="700" y2="45" stroke="#f5f5f5" strokeWidth="1" />
              <line x1="0" y1="90" x2="700" y2="90" stroke="#f5f5f5" strokeWidth="1" />
              <line x1="0" y1="135" x2="700" y2="135" stroke="#f5f5f5" strokeWidth="1" />
              <line x1="0" y1="180" x2="700" y2="180" stroke="#f5f5f5" strokeWidth="1" />
              <path
                d="M0,120 L25,115 L50,100 L75,108 L100,95 L125,90 L150,85 L175,92 L200,80 L225,75 L250,68 L275,72 L300,60 L325,55 L350,62 L375,50 L400,45 L425,52 L450,40 L475,35 L500,42 L525,30 L550,25 L575,32 L600,20 L625,28 L650,15 L675,22 L700,10 L700,180 L0,180 Z"
                fill="rgba(229,229,229,.35)" stroke="none"
              />
              <path
                d="M0,120 L25,115 L50,100 L75,108 L100,95 L125,90 L150,85 L175,92 L200,80 L225,75 L250,68 L275,72 L300,60 L325,55 L350,62 L375,50 L400,45 L425,52 L450,40 L475,35 L500,42 L525,30 L550,25 L575,32 L600,20 L625,28 L650,15 L675,22 L700,10"
                fill="none" stroke="#e5e5e5" strokeWidth="1.5"
              />
              <path
                d="M0,140 L25,135 L50,128 L75,132 L100,120 L125,115 L150,110 L175,118 L200,105 L225,100 L250,92 L275,98 L300,85 L325,80 L350,88 L375,72 L400,68 L425,75 L450,62 L475,56 L500,65 L525,50 L550,44 L575,52 L600,38 L625,46 L650,30 L675,38 L700,25 L700,180 L0,180 Z"
                fill="rgba(200,16,46,.12)" stroke="none"
              />
              <path
                d="M0,140 L25,135 L50,128 L75,132 L100,120 L125,115 L150,110 L175,118 L200,105 L225,100 L250,92 L275,98 L300,85 L325,80 L350,88 L375,72 L400,68 L425,75 L450,62 L475,56 L500,65 L525,50 L550,44 L575,52 L600,38 L625,46 L650,30 L675,38 L700,25"
                fill="none" stroke="#C8102E" strokeWidth="2"
              />
              <line x1="550" y1="0" x2="550" y2="180" stroke="#C8102E" strokeWidth="1" strokeDasharray="4,3" />
              <circle cx="550" cy="44" r="4" fill="#C8102E" />
              <rect x="540" y="14" width="90" height="24" rx="4" fill="#0a0a0a" />
              <text x="585" y="30" fill="#fff" fontSize="10" fontFamily="DM Sans,sans-serif" textAnchor="middle">
                4,820 users
              </text>
            </svg>
            <div className={styles.xLabels}>
              <span>Jun 1</span><span>Jun 5</span><span>Jun 10</span>
              <span>Jun 15</span><span>Jun 20</span><span>Jun 25</span><span>Jun 28</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.twoCol}>
        <div className={`${styles.chartCard} ${styles.noMargin}`}>
          <div className={styles.sectionTitle}>Top Pages</div>
          <table className={styles.table}>
            <thead>
              <tr><th>Page</th><th>Views</th><th>Share</th></tr>
            </thead>
            <tbody>
              {d.topPages.map(p => (
                <tr key={p.path}>
                  <td className={styles.pagePath}>{p.path}</td>
                  <td className={styles.pageViews}>{p.views.toLocaleString()}</td>
                  <td>
                    <div className={styles.barWrap}>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: `${p.pct}%` }} />
                      </div>
                      <span className={styles.barPct}>{p.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`${styles.chartCard} ${styles.noMargin}`}>
          <div className={styles.sectionTitle}>Traffic Sources</div>
          <table className={styles.table}>
            <thead>
              <tr><th>Source</th><th>Users</th><th>Share</th></tr>
            </thead>
            <tbody>
              {d.sources.map(s => (
                <tr key={s.name}>
                  <td>
                    <div className={styles.sourceRow}>
                      <div className={styles.sourceIcon} style={{ background: s.bg }}>{s.icon}</div>
                      <span className={styles.sourceName}>{s.name}</span>
                    </div>
                  </td>
                  <td className={styles.pageViews}>{s.users.toLocaleString()}</td>
                  <td>
                    <div className={styles.barWrap}>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: `${s.bar}%` }} />
                      </div>
                      <span className={styles.barPct}>{s.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.twoCol}>
        <div className={`${styles.chartCard} ${styles.noMargin}`}>
          <div className={styles.sectionTitle}>Top Countries</div>
          <div className={styles.geoList}>
            {d.countries.map(c => (
              <div key={c.name} className={styles.geoRow}>
                <span className={styles.geoFlag}>{c.flag}</span>
                <span className={styles.geoName}>{c.name}</span>
                <div className={styles.geoBarTrack}>
                  <div className={styles.geoBar} style={{ width: `${c.bar}%` }} />
                </div>
                <span className={styles.geoVal}>
                  {c.users.toLocaleString()} · {c.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.chartCard} ${styles.noMargin}`}>
          <div className={styles.sectionTitle}>Devices</div>
          <div className={styles.deviceSection}>
            <div className={styles.donutWrap}>
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="46" fill="none" stroke="#f0f0f0" strokeWidth="14" />
                <circle cx="60" cy="60" r="46" fill="none" stroke="#C8102E" strokeWidth="14"
                  strokeDasharray="289.02 466.16" strokeDashoffset="116.24" transform="rotate(-90 60 60)" />
                <circle cx="60" cy="60" r="46" fill="none" stroke="#0a0a0a" strokeWidth="14"
                  strokeDasharray="130.38 466.16" strokeDashoffset="405.26" transform="rotate(-90 60 60)" />
                <circle cx="60" cy="60" r="46" fill="none" stroke="#e5e5e5" strokeWidth="14"
                  strokeDasharray="46.60 466.16" strokeDashoffset="274.88" transform="rotate(-90 60 60)" />
              </svg>
              <div className={styles.donutCenter}>
                <div className={styles.donutMain}>{mobile}%</div>
                <div className={styles.donutSub}>Mobile</div>
              </div>
            </div>
            <div className={styles.deviceLegend}>
              <div className={styles.deviceItem}>
                <div className={styles.deviceDot} style={{ background: '#C8102E' }} />
                <span>Mobile — <strong>{mobile}%</strong></span>
              </div>
              <div className={styles.deviceItem}>
                <div className={styles.deviceDot} style={{ background: '#0a0a0a' }} />
                <span>Desktop — <strong>{desktop}%</strong></span>
              </div>
              <div className={styles.deviceItem}>
                <div className={styles.deviceDot} style={{ background: '#e5e5e5' }} />
                <span>Tablet — <strong>{tablet}%</strong></span>
              </div>
            </div>
          </div>

          <div className={styles.divider} />
          <div className={styles.sectionTitle}>New vs Returning</div>
          <div className={styles.newReturn}>
            <div>
              <div className={`${styles.nrVal} ${styles.nrValRed}`}>{d.newUsers}%</div>
              <div className={styles.nrLabel}>New Users</div>
            </div>
            <div>
              <div className={`${styles.nrVal} ${styles.nrValDark}`}>{d.returning}%</div>
              <div className={styles.nrLabel}>Returning</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.gaCta}>
        <div className={styles.gaCtaLeft}>
          <h3>Full Analytics in Google Analytics 4</h3>
          <p>
            This summary pulls key metrics from GA4. For conversion funnels, event tracking,
            audience segments, and real-time reports — open your full GA4 dashboard.
          </p>
        </div>
        <a
          href="https://analytics.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.gaBtn}
        >
          Open GA4 ↗
        </a>
      </div>
    </div>
  )
}
