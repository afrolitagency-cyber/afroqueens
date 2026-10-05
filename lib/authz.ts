// lib/authz.ts — authorisation for admin and artist server code.
//
// Contract:
// - Every exported function in an admin 'use server' file starts with `await requireStaff()`.
//   `scripts/check-authz.mjs` fails the build if one doesn't.
// - Every /api/admin route starts with `requireStaffApi()`.
// - Irreversible or publishing operations pass `{ fresh: true }` so the role is read from the
//   database, not the JWT (a demoted user keeps their old JWT claim until it expires).
import { getServerSession, type Session } from 'next-auth'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { Role } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const STAFF_ROLES: readonly Role[] = ['SUPER_ADMIN', 'EDITOR']

export function isStaffRole(role: Role | null | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role)
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

async function freshRole(userId: string): Promise<Role | null> {
  if (!userId) return null
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  return user?.role ?? null
}

/** Server actions: redirects when signed out, throws when signed in without a staff role. */
export async function requireStaff(opts: { fresh?: boolean } = {}): Promise<Session> {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/admin/login')
  if (session.user.role === 'ARTIST') redirect('/artist')
  if (!isStaffRole(session.user.role)) throw new ForbiddenError()

  if (opts.fresh) {
    const role = await freshRole(session.user.id)
    if (!isStaffRole(role)) throw new ForbiddenError()
  }
  return session
}

/** Route handlers: returns a 401/403 response instead of redirecting. */
export async function requireStaffApi(
  opts: { fresh?: boolean } = {},
): Promise<{ session: Session; response?: undefined } | { session?: undefined; response: NextResponse }> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const role = opts.fresh ? await freshRole(session.user.id) : session.user.role
  if (!isStaffRole(role)) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { session }
}

/** Any signed-in staff member or artist (shared upload endpoints). */
export async function requireUploaderApi(): Promise<
  | { session: Session; isStaff: boolean; artistId: string | null; response?: undefined }
  | { session?: undefined; isStaff?: undefined; artistId?: undefined; response: NextResponse }
> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (isStaffRole(session.user.role)) {
    return { session, isStaff: true, artistId: null }
  }
  if (session.user.role === 'ARTIST' && session.user.artistId) {
    return { session, isStaff: false, artistId: session.user.artistId }
  }
  return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}
