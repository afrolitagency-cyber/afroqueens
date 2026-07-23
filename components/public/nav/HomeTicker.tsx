'use client'

import { usePathname } from 'next/navigation'
import Ticker from './Ticker'

/** Scrolling update bar — homepage only, sits just above the footer. */
export default function HomeTicker() {
  const pathname = usePathname()
  if (pathname !== '/') return null
  return <Ticker />
}
