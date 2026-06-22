export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateBusinessReport } from '@/lib/ai'
import { getPlan } from '@/lib/plans'
import { sendAnalysisCompletedEmail } from '@/lib/email'
import { runEngineAnalysis } from '@/lib/analyze-engine'
import type { AnalysisResult } from '@/types'

interface TrackedFinanceData {
  source: string
  months: Array<{ month: string; revenues: number; expenses: number; balance: number }>
  expensesByCategory: Record<string, number>
  revenuesByCategory: Record<string, number>
  recurringExpenses: Array<{ description: string; amount: number; interval: string | null }>
}

type EnrichedResult = AnalysisResult & { trackedFinanceData?: TrackedFinanceData }

export async function POST() {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const membership = await db.organizationMember.findFirst({
      where: { userId: user.userId },
      include: { organization: { include: { subscription: true } } },
    })
    if (!membership) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 400 })

    const org = membership.organization
    const plan = getPlan(org.subscription?.planName)

    // Analyse-Limit des Tarifs prüfen
    if (plan.analysisLimit !== null && org.subscription &&
        org.subscription.usedAnalysesThisMonth >= plan.analysisLimit) {
      return NextResponse.json(
        {
          error: `Ihr Monatslimit von ${plan.analysisLimit} Analyse${plan.analysisLimit === 1 ? '' : 'n'} ist erreicht. Upgraden Sie für weitere Analysen.`,
          limitReached: true,
        },
        { status: 402 }
      )
    }

    const uploads = await db.upload.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        category: true,
        storagePath: true,
        columnMapping: true,
      },
    })

    const financeData = await loadTrackedFinanceData(org.id)

    if (uploads.length === 0 && !financeData) {
      return NextResponse.json(
        { error: 'Bitte laden Sie zuerst Dateien hoch oder tragen Sie Einnahmen und Ausgaben im Finanztracking ein.' },
        { status: 400 }
      )
    }

    const report = await db.analysisReport.create({
      data: {
        title: `Analyse ${new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`,
        organizationId: org.id,
        createdById: user.userId,
        status: 'PROCESSING',
        uploads: {
          create: uploads.map((u) => ({ uploadId: u.id })),
        },
      },
    })

    if (org.subscription) {
      await db.subscription.update({
        where: { id: org.subscription.id },
        data: { usedAnalysesThisMonth: { increment: 1 } },
      })
    }

    const task = runAnalysis(report.id, uploads, org, plan.id, plan.aiModel, financeData, user.email).catch(
      async (err) => {
        console.error('[analyze] Fehler:', err)
        await db.analysisReport.update({
          where: { id: report.id },
          data: { status: 'FAILED' },
        })
      },
    )

    // Auf Vercel-Serverless wird die Funktion nach der Response eingefroren –
    // waitUntil hält sie am Leben, bis die Analyse fertig ist (bis maxDuration).
    waitUntil(task)

    return NextResponse.json({ success: true, reportId: report.id })
  } catch (err) {
    console.error('[analyze]', err)
    return NextResponse.json({ error: 'Analyse konnte nicht gestartet werden.' }, { status: 500 })
  }
}

/** Eingetragene Finanzdaten (Finanztracking) der letzten 12 Monate aggregieren */
async function loadTrackedFinanceData(organizationId: string): Promise<TrackedFinanceData | null> {
  const since = new Date()
  since.setMonth(since.getMonth() - 12)

  const [expenses, revenues] = await Promise.all([
    db.expense.findMany({
      where: { organizationId, date: { gte: since } },
      select: { date: true, category: true, description: true, amount: true, isRecurring: true, recurrenceInterval: true },
    }),
    db.revenue.findMany({
      where: { organizationId, date: { gte: since } },
      select: { date: true, category: true, amount: true },
    }),
  ])

  if (expenses.length === 0 && revenues.length === 0) return null

  const byMonth: Record<string, { revenues: number; expenses: number }> = {}
  const expensesByCategory: Record<string, number> = {}
  const revenuesByCategory: Record<string, number> = {}

  for (const e of expenses) {
    const key = e.date.toISOString().slice(0, 7)
    byMonth[key] = byMonth[key] ?? { revenues: 0, expenses: 0 }
    byMonth[key].expenses += e.amount
    expensesByCategory[e.category] = (expensesByCategory[e.category] ?? 0) + e.amount
  }
  for (const r of revenues) {
    const key = r.date.toISOString().slice(0, 7)
    byMonth[key] = byMonth[key] ?? { revenues: 0, expenses: 0 }
    byMonth[key].revenues += r.amount
    revenuesByCategory[r.category] = (revenuesByCategory[r.category] ?? 0) + r.amount
  }

  return {
    source: 'Vom Nutzer im Profitora-Finanztracking eingetragene Einnahmen und Ausgaben (letzte 12 Monate)',
    months: Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        revenues: Math.round(v.revenues * 100) / 100,
        expenses: Math.round(v.expenses * 100) / 100,
        balance: Math.round((v.revenues - v.expenses) * 100) / 100,
      })),
    expensesByCategory,
    revenuesByCategory,
    recurringExpenses: expenses
      .filter((e) => e.isRecurring)
      .map((e) => ({ description: e.description, amount: e.amount, interval: e.recurrenceInterval })),
  }
}

async function runAnalysis(
  reportId: string,
  uploads: Array<{ category: string; storagePath: string; columnMapping: unknown }>,
  org: { name: string; unitCount: number | null; businessType: string },
  planId: string,
  aiModel: string,
  financeData: TrackedFinanceData | null,
  userEmail?: string,
) {
  let analysisResult: EnrichedResult

  if (uploads.length > 0) {
    const filesByCategory: Record<string, string[]> = {}
    const columnMappingByCategory: Record<string, Record<string, string>> = {}

    for (const u of uploads) {
      if (!filesByCategory[u.category]) filesByCategory[u.category] = []
      filesByCategory[u.category].push(u.storagePath)

      if (u.columnMapping && typeof u.columnMapping === 'object') {
        columnMappingByCategory[u.category] = u.columnMapping as Record<string, string>
      }
    }

    const config = {
      files: filesByCategory,
      column_mapping: columnMappingByCategory,
      unit_count: org.unitCount,
      business_type: org.businessType,
      business_name: org.name,
    }

    try {
      analysisResult = await runEngineAnalysis<EnrichedResult>(config)
    } catch (err) {
      console.error('[analyze] Python-Fehler:', err)
      throw new Error('Python-Analyse fehlgeschlagen')
    }
  } else {
    // Analyse rein aus dem Finanztracking – ohne Datei-Uploads
    analysisResult = {
      businessType: org.businessType,
      businessName: org.name,
      unitCount: org.unitCount,
      dataBasis: 'finanztracking',
    } as unknown as EnrichedResult
  }

  if (financeData) {
    analysisResult.trackedFinanceData = financeData
  }

  const htmlContent = await generateBusinessReport(analysisResult, { model: aiModel })

  // Tarif-Snapshot: bestimmt später das Teaser-Gating im Bericht (siehe report-teaser.ts).
  // Erst nach der KI-Generierung gesetzt, damit es nicht in den Prompt gelangt.
  ;(analysisResult as EnrichedResult & { planId?: string }).planId = planId

  const updatedReport = await db.analysisReport.update({
    where: { id: reportId },
    data: {
      status: 'COMPLETED',
      htmlContent,
      metadata: analysisResult as object,
    },
  })

  if (userEmail) {
    sendAnalysisCompletedEmail(userEmail, org.name, reportId, updatedReport.title).catch(console.error)
  }
}
