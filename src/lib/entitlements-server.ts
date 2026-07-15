// DB-lesende Entitlement-Guards für Server-Pages und API-Routen.
// Alle Gates greifen NUR mit Launch-Flag (subscriptionsLive) — davor verhält
// sich die App exakt wie bisher.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getEntitlements, subscriptionsLive, type Entitlements } from '@/lib/entitlements'

export interface OrgContext {
  userId: string
  organizationId: string
  subscription: Awaited<ReturnType<typeof db.subscription.findUnique>>
  entitlements: Entitlements
}

/** Org + Entitlements des eingeloggten Nutzers laden (null = kein Login / keine Org) */
export async function getOrgContext(): Promise<OrgContext | null> {
  const user = getCurrentUser()
  if (!user) return null
  const membership = await db.organizationMember.findFirst({
    where: { userId: user.userId },
  })
  if (!membership) return null
  const subscription = await db.subscription.findUnique({
    where: { organizationId: membership.organizationId },
  })
  return {
    userId: user.userId,
    organizationId: membership.organizationId,
    subscription,
    entitlements: getEntitlements(subscription),
  }
}

/** true = Zugriff auf Cockpit-Features verweigern (Seite → redirect, API → 403) */
export async function cockpitBlocked(): Promise<boolean> {
  if (!subscriptionsLive()) return false
  const ctx = await getOrgContext()
  return !ctx || !ctx.entitlements.cockpit
}

/** Einheitliche 403-Antwort für gesperrte Cockpit-APIs */
export function cockpitForbiddenResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Diese Funktion ist Teil des Profitora-Abos.', upgradeRequired: true },
    { status: 403 },
  )
}
