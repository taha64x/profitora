import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await db.organizationMember.findFirst({ where: { userId: user.userId } })
  if (!member) return NextResponse.json({ success: true, data: null })

  const settings = await db.settings.findUnique({ where: { organizationId: member.organizationId } })
  return NextResponse.json({ success: true, data: settings })
}

export async function PUT(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await db.organizationMember.findFirst({ where: { userId: user.userId } })
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const body = await req.json()
  const { language, currency, emailNotifications, monthlyReminder, defaultAnalysisPeriod } = body

  const settings = await db.settings.upsert({
    where: { organizationId: member.organizationId },
    update: {
      language: language ?? undefined,
      currency: currency ?? undefined,
      emailNotifications: emailNotifications ?? undefined,
      monthlyReminder: monthlyReminder ?? undefined,
      defaultAnalysisPeriod: defaultAnalysisPeriod ?? undefined,
    },
    create: {
      organizationId: member.organizationId,
      language: language ?? 'de',
      currency: currency ?? 'EUR',
      emailNotifications: emailNotifications ?? true,
      monthlyReminder: monthlyReminder ?? true,
      defaultAnalysisPeriod: defaultAnalysisPeriod ?? 'last_month',
    },
  })

  return NextResponse.json({ success: true, data: settings })
}
