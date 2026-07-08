'use client'

import { useState, useEffect } from 'react'
import styles from './Hero.module.css'

export const HERO_SLIDES = [
  '/images/hero/hero-1.png',
  '/images/hero/hero-2.png',
  '/images/hero/hero-3.png',
] as const

const INTERVAL_MS = 6000

interface HeroSlideshowProps {
  variant: 'full' | 'panel'
  className?: string
}

export default function HeroSlideshow({ variant, className }: HeroSlideshowProps) {
  const [active, setActive] = useState(0)

  // Preload remaining slides so transitions stay smooth
  useEffect(() => {
    HERO_SLIDES.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setActive(prev => (prev + 1) % HERO_SLIDES.length)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const wrapClass = variant === 'full' ? styles.slideshowFull : styles.slideshowPanel
  const overlayClass = variant === 'full' ? styles.overlayD1 : styles.overlayD2

  return (
    <div className={`${wrapClass} ${className ?? ''}`} aria-hidden="true">
      {HERO_SLIDES.map((src, i) => (
        <div
          key={src}
          className={`${styles.slide} ${i === active ? styles.slideActive : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <div className={overlayClass} />
    </div>
  )
}
