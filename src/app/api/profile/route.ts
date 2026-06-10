import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await db.user.findUnique({ where: { id: user.userId } })
  const member = await db.organizationMember.findFirst({ where: { userId: user.userId }, include: { organization: true } })
  const org = member?.organization

  return NextResponse.json({
    success: true,
    data: {
      name: dbUser?.name ?? '',
      email: dbUser?.email ?? '',
      businessName: org?.name ?? '',
      businessType: org?.businessType ?? '',
      website: (org as { website?: string } | null)?.website ?? '',
      phone: (dbUser as { phone?: string } | null)?.phone ?? '',
      street: (org as { street?: string } | null)?.street ?? '',
      city: (org as { city?: string } | null)?.city ?? '',
      zip: (org as { zip?: string } | null)?.zip ?? '',
      country: (org as { country?: string } | null)?.country ?? 'Deutschland',
    },
  })
}

export async function PUT(req: Request) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, businessName, businessType } = body

  await db.user.update({
    where: { id: user.userId },
    data: { name: name ?? undefined },
  })

  const member = await db.organizationMember.findFirst({ where: { userId: user.userId } })
  if (member) {
    await db.organization.update({
      where: { id: member.organizationId },
      data: {
        name: businessName ?? undefined,
        businessType: businessType ?? undefined,
      },
    })
  }

  return NextResponse.json({ success: true })
}
