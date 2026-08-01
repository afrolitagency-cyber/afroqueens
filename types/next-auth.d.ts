// types/next-auth.d.ts
import { DefaultSession } from 'next-auth'
import type { Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      artistId?: string | null
    } & DefaultSession['user']
  }

  interface User {
    role: Role
    artistId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role
    artistId?: string | null
  }
}
