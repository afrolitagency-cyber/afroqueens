// lib/theme.ts
import { prisma } from './prisma'

const DEFAULT_SETTINGS = {
  id: 'singleton' as const,
  theme: 'DARK' as const,
  design: 'ONE' as const,
  siteName: 'Afroqueens FM',
  siteDescription: 'Celebrating women in Afrobeats and African music culture.',
  contactEmail: '',
  socialInstagram: '',
  socialTwitter: '',
  socialYoutube: '',
  updatedAt: new Date(),
}

export async function getSiteSettings() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'singleton' },
    })
    return settings ?? DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function themeToDataAttr(theme: 'DARK' | 'LIGHT') {
  return theme === 'DARK' ? 'dark' : 'light'
}

export function designToDataAttr(design: 'ONE' | 'TWO') {
  return design === 'ONE' ? '1' : '2'
}
