export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getPlan } from '@/lib/plans'
import { getEntitlements, subscriptionsLive } from '@/lib/entitlements'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const MAX_HISTORY = 20
const MAX_MESSAGE_LENGTH = 4000

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const membership = await db.organizationMember.findFirst({
    where: { userId: user.userId },
    include: { organization: { include: { subscription: true } } },
  })
  if (!membership) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 404 })

  const org = membership.organization
  const plan = getPlan(org.subscription?.planName)

  // Monatslimit: mit Launch-Flag aus den Entitlements (free = 0 → Abo-CTA),
  // davor Legacy-Verhalten über plans.ts.
  // Bekannte Lücke: assistantMsgsThisMonth hat noch keinen Monats-Reset (Phase-2-Cron).
  if (subscriptionsLive()) {
    const ent = getEntitlements(org.subscription)
    if (ent.assistantMsgsPerMonth <= 0) {
      return NextResponse.json(
        { error: 'Der KI-Assistent ist Teil des Profitora-Abos.', upgradeRequired: true },
        { status: 403 },
      )
    }
    if ((org.subscription?.assistantMsgsThisMonth ?? 0) >= ent.assistantMsgsPerMonth) {
      return NextResponse.json(
        {
          error: `Ihr Monatslimit von ${ent.assistantMsgsPerMonth} Fragen ist erreicht. Upgraden Sie für mehr Fragen.`,
          limitReached: true,
        },
        { status: 429 },
      )
    }
  } else if (plan.assistantLimit !== null && org.subscription) {
    if (org.subscription.assistantMsgsThisMonth >= plan.assistantLimit) {
      return NextResponse.json(
        {
          error: `Ihr Monatslimit von ${plan.assistantLimit} Fragen ist erreicht. Upgraden Sie für mehr Fragen.`,
          limitReached: true,
        },
        { status: 429 }
      )
    }
  }

  const body = await req.json().catch(() => null)
  const history: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : []
  if (history.length === 0) {
    return NextResponse.json({ error: 'Keine Nachricht übermittelt.' }, { status: 400 })
  }
  const messages = history
    .slice(-MAX_HISTORY)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }))

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'KI-Anbieter nicht konfiguriert.' }, { status: 500 })
  }

  // ── Kontext aus den Daten des Unternehmens aufbauen ──────────────────────────
  const since = new Date()
  since.setMonth(since.getMonth() - 6)

  const [expenses, revenues, latestReport] = await Promise.all([
    db.expense.findMany({
      where: { organizationId: org.id, date: { gte: since } },
      orderBy: { date: 'desc' },
      take: 300,
      select: { date: true, category: true, description: true, amount: true, vendor: true, isRecurring: true },
    }),
    db.revenue.findMany({
      where: { organizationId: org.id, date: { gte: since } },
      orderBy: { date: 'desc' },
      take: 300,
    }),
    db.analysisReport.findFirst({
      where: { organizationId: org.id, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      select: { htmlContent: true, createdAt: true },
    }),
  ])

  // Monatsaggregation statt Rohdaten – kompakt und aussagekräftig
  const byMonth: Record<string, { expenses: number; revenues: number }> = {}
  const expenseByCategory: Record<string, number> = {}
  for (const e of expenses) {
    const key = e.date.toISOString().slice(0, 7)
    byMonth[key] = byMonth[key] ?? { expenses: 0, revenues: 0 }
    byMonth[key].expenses += e.amount
    expenseByCategory[e.category] = (expenseByCategory[e.category] ?? 0) + e.amount
  }
  for (const r of revenues as Array<{ date: Date; amount: number }>) {
    const key = r.date.toISOString().slice(0, 7)
    byMonth[key] = byMonth[key] ?? { expenses: 0, revenues: 0 }
    byMonth[key].revenues += r.amount
  }

  const monthLines = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => `${m}: Einnahmen ${v.revenues.toFixed(0)} EUR, Ausgaben ${v.expenses.toFixed(0)} EUR, Saldo ${(v.revenues - v.expenses).toFixed(0)} EUR`)
    .join('\n')

  const categoryLines = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([c, sum]) => `${c}: ${sum.toFixed(0)} EUR (6 Monate)`)
    .join('\n')

  const reportExcerpt = latestReport?.htmlContent
    ? latestReport.htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 5000)
    : null

  const systemPrompt = `Du bist der Profitora KI-Assistent – ein betriebswirtschaftlicher Berater für kleine und mittlere Unternehmen.

UNTERNEHMENSKONTEXT:
- Name: ${org.name}
- Branche: ${org.businessType}
${monthLines ? `\nMONATSÜBERSICHT (eingetragene Finanzdaten, letzte 6 Monate):\n${monthLines}` : '\nEs wurden noch keine Finanzdaten eingetragen.'}
${categoryLines ? `\nTOP-KOSTENBEREICHE:\n${categoryLines}` : ''}
${reportExcerpt ? `\nAUSZUG AUS DER LETZTEN KI-ANALYSE (${latestReport!.createdAt.toLocaleDateString('de-DE')}):\n${reportExcerpt}` : '\nEs liegt noch keine abgeschlossene Analyse vor.'}

VERHALTENSREGELN (zwingend):
1. Beziehe dich auf die echten Daten oben. Erfinde NIEMALS Zahlen. Fehlen Daten, sage klar: "Dazu liegen mir keine Daten vor."
2. Antworte auf Deutsch, prägnant und praxisnah. Konkrete Handlungsempfehlungen mit Zahlenbezug, wo möglich.
3. Empfehlungen im Konjunktiv ("sollte", "wird empfohlen") – nie als Vorschrift.
4. Du ersetzt keine Steuer- oder Rechtsberatung. Bei steuerlichen/rechtlichen Detailfragen auf professionelle Beratung verweisen.
5. Keine Bewertung einzelner Mitarbeiter – nur betriebliche Kennzahlen.
6. Keine Emojis. Strukturiere längere Antworten mit kurzen Absätzen oder Listen.`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  try {
    const response = await client.messages.create({
      model: plan.aiModel,
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    })
    const reply = response.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('\n')

    if (org.subscription) {
      await db.subscription.update({
        where: { id: org.subscription.id },
        data: { assistantMsgsThisMonth: { increment: 1 } },
      })
    }

    const remaining =
      plan.assistantLimit !== null && org.subscription
        ? Math.max(0, plan.assistantLimit - org.subscription.assistantMsgsThisMonth - 1)
        : null

    return NextResponse.json({ success: true, reply, remaining, model: plan.aiModelLabel })
  } catch (err) {
    console.error('Assistant-Fehler:', err instanceof Error ? err.message : 'unbekannt')
    return NextResponse.json({ error: 'Der KI-Assistent ist gerade nicht erreichbar. Bitte versuchen Sie es erneut.' }, { status: 502 })
  }
}
