import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateBusinessReport } from '@/lib/ai'
import { sendAnalysisCompletedEmail } from '@/lib/email'
import type { AnalysisResult } from '@/types'

const execFileAsync = promisify(execFile)

export async function POST() {
  try {
    const user = getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

    const membership = await db.organizationMember.findFirst({
      where: { userId: user.userId },
      include: { organization: true },
    })
    if (!membership) return NextResponse.json({ error: 'Kein Unternehmen gefunden.' }, { status: 400 })

    const org = membership.organization

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

    if (uploads.length === 0) {
      return NextResponse.json({ error: 'Bitte laden Sie zuerst Dateien hoch.' }, { status: 400 })
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

    runAnalysis(report.id, uploads, org, user.email).catch(async (err) => {
      console.error('[analyze] Fehler:', err)
      await db.analysisReport.update({
        where: { id: report.id },
        data: { status: 'FAILED' },
      })
    })

    return NextResponse.json({ success: true, reportId: report.id })
  } catch (err) {
    console.error('[analyze]', err)
    return NextResponse.json({ error: 'Analyse konnte nicht gestartet werden.' }, { status: 500 })
  }
}

async function runAnalysis(
  reportId: string,
  uploads: Array<{ category: string; storagePath: string; columnMapping: unknown }>,
  org: { name: string; unitCount: number | null; businessType: string },
  userEmail?: string,
) {
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

  let analysisResult: AnalysisResult

  try {
    const { stdout } = await execFileAsync('python3', [
      join(process.cwd(), 'python', 'analyze_csv.py'),
      '--config-json',
      JSON.stringify(config),
    ])
    analysisResult = JSON.parse(stdout) as AnalysisResult
  } catch (err) {
    console.error('[analyze] Python-Fehler:', err)
    throw new Error('Python-Analyse fehlgeschlagen')
  }

  const htmlContent = await generateBusinessReport(analysisResult)

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
