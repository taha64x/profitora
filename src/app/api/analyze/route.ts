export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateBusinessReport } from '@/lib/ai'
import { PLANS } from '@/lib/plans'
import { canUseIncludedAnalysis, getEntitlements, startOfQuarter, subscriptionsLive } from '@/lib/entitlements'
import { sendAnalysisCompletedEmail } from '@/lib/email'
import { runEngineAnalysis } from '@/lib/analyze-engine'
import { presignBlobGetUrl } from '@/lib/blob'
import type { AnalysisResult } from '@/types'

interface TrackedFinanceData {
  source: string
  months: Array<{ month: string; revenues: number; expenses: number; balance: number }>
  expensesByCategory: Record<string, number>
  revenuesByCategory: Record<string, number>
  recurringExpenses: Array<{ description: string; amount: number; interval: string | null }>
}

type EnrichedResult = AnalysisResult & { trackedFinanceData?: TrackedFinanceData }

export async function POST(req: Request) {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    // Optionaler Fragebogen (zweite Datenquelle neben Dateien/Finanztracking).
    // Größe begrenzen, damit kein überlanger Prompt entsteht.
    let questionnaireData: Record<string, unknown> | null = null
    try {
      const body = await req.json()
      if (body?.questionnaireData && typeof body.questionnaireData === 'object') {
        if (JSON.stringify(body.questionnaireData).length > 60_000) {
          return NextResponse.json({ error: 'Fragebogen-Daten zu umfangreich.' }, { status: 400 })
        }
        questionnaireData = body.questionnaireData
      }
    } catch {
      // Kein/ungültiger Body = Analyse ohne Fragebogen (bisheriges Verhalten)
    }

    const membership = await db.organizationMember.findFirst({
      where: { userId: user.userId },
      include: { organization: { include: { subscription: true } } },
    })
    if (!membership) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 400 })

    const org = membership.organization
    // Bezahlte Analysen laufen immer in voller Qualität (Opus, kein Teaser).
    const plan = PLANS.premium

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

    if (uploads.length === 0 && !financeData && !questionnaireData) {
      return NextResponse.json(
        { error: 'Bitte laden Sie Dateien hoch, füllen Sie den Fragebogen aus oder tragen Sie Einnahmen und Ausgaben im Finanztracking ein.' },
        { status: 400 }
      )
    }

    // Bezahlmodell: jede Analyse verbraucht genau 1 Credit. Der Abzug ist atomar
    // (nur wenn noch mindestens 1 Credit da ist) und damit race-sicher; ohne
    // Subscription-Zeile oder ohne Guthaben wird nichts gestartet.
    // Premium-Abo hat zusätzlich 1 Inklusivanalyse pro Kalenderquartal.
    let consumedIncluded = false
    const charged = await db.subscription.updateMany({
      where: { organizationId: org.id, analysisCredits: { gte: 1 } },
      data: {
        analysisCredits: { decrement: 1 },
        usedAnalysesThisMonth: { increment: 1 },
      },
    })
    if (charged.count === 0) {
      if (subscriptionsLive() && canUseIncludedAnalysis(org.subscription)) {
        // Atomar: nur wenn in diesem Kalenderquartal noch keine Inklusivanalyse lief.
        const included = await db.subscription.updateMany({
          where: {
            organizationId: org.id,
            planName: 'premium',
            status: 'active',
            OR: [
              { lastIncludedAnalysisAt: null },
              { lastIncludedAnalysisAt: { lt: startOfQuarter(new Date()) } },
            ],
          },
          data: {
            lastIncludedAnalysisAt: new Date(),
            usedAnalysesThisMonth: { increment: 1 },
          },
        })
        consumedIncluded = included.count > 0
      }
      if (!consumedIncluded) {
        if (subscriptionsLive()) {
          const ent = getEntitlements(org.subscription)
          return NextResponse.json(
            {
              error:
                ent.planId === 'free'
                  ? 'Kein Analyse-Guthaben verfügbar. Kaufen Sie eine Einzelanalyse – oder sichern Sie sich das Abo mit deutlich günstigeren Analysen.'
                  : `Kein Analyse-Guthaben verfügbar. Mit Ihrem ${ent.planId.charAt(0).toUpperCase() + ent.planId.slice(1)}-Abo kostet die Analyse nur ${(ent.analysisPriceCents / 100).toLocaleString('de-DE')} €.`,
              needCredits: true,
              analysisPriceCents: ent.analysisPriceCents,
              planId: ent.planId,
            },
            { status: 402 }
          )
        }
        return NextResponse.json(
          {
            error: 'Kein Analyse-Guthaben verfügbar. Kaufen Sie eine Einzelanalyse oder sparen Sie mit dem 3er-/5er-Paket.',
            needCredits: true,
          },
          { status: 402 }
        )
      }
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

    const task = runAnalysis(report.id, uploads, org, plan.id, plan.aiModel, financeData, questionnaireData, user.email).catch(
      async (err) => {
        console.error('[analyze] Fehler:', err)
        await db.analysisReport.update({
          where: { id: report.id },
          data: { status: 'FAILED' },
        })
        // Fehlgeschlagene Analyse darf nichts kosten: Credit zurück bzw.
        // Inklusivanalyse wieder freigeben.
        await (consumedIncluded
          ? db.subscription.updateMany({
              where: { organizationId: org.id },
              data: { lastIncludedAnalysisAt: null },
            })
          : db.subscription.updateMany({
              where: { organizationId: org.id },
              data: { analysisCredits: { increment: 1 } },
            })
        ).catch((refundErr) => console.error('[analyze] Rückgabe fehlgeschlagen:', refundErr))
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
  questionnaireData: Record<string, unknown> | null,
  userEmail?: string,
) {
  let analysisResult: EnrichedResult

  if (uploads.length > 0) {
    const filesByCategory: Record<string, string[]> = {}
    const columnMappingByCategory: Record<string, Record<string, string>> = {}

    for (const u of uploads) {
      if (!filesByCategory[u.category]) filesByCategory[u.category] = []

      // Produktion: storagePath ist ein privater Blob-Pfad → kurzlebige signierte
      // URL erzeugen, die die Python-Analyse einmalig lesen kann.
      // Lokal: storagePath ist ein absoluter Dateipfad → unverändert weitergeben.
      const isBlobPath = !!process.env.BLOB_READ_WRITE_TOKEN && !u.storagePath.startsWith('/')
      const filePath = isBlobPath ? await presignBlobGetUrl(u.storagePath) : u.storagePath
      filesByCategory[u.category].push(filePath)

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
    // Analyse ohne Datei-Uploads – Basis ist Fragebogen und/oder Finanztracking
    analysisResult = {
      businessType: org.businessType,
      businessName: org.name,
      unitCount: org.unitCount,
      dataBasis: questionnaireData ? 'fragebogen' : 'finanztracking',
    } as unknown as EnrichedResult
  }

  if (financeData) {
    analysisResult.trackedFinanceData = financeData
  }
  if (questionnaireData) {
    // Vom Nutzer ausgefüllter Strukturfragebogen – geht 1:1 als Datenquelle in den Prompt
    ;(analysisResult as EnrichedResult & { questionnaireData?: unknown }).questionnaireData = questionnaireData
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
