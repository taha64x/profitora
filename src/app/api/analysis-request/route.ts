import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { AnalysisRequestPayload } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body: AnalysisRequestPayload = await req.json()

    if (!body.consentConfirmed || !body.privacyConfirmed) {
      return NextResponse.json(
        { error: 'Zustimmung zu Nutzungsbedingungen und Datenschutz erforderlich.' },
        { status: 400 }
      )
    }

    if (!body.industry || body.analysisTypes.length === 0) {
      return NextResponse.json(
        { error: 'Branche und mindestens eine Analyseart sind erforderlich.' },
        { status: 400 }
      )
    }

    // Optional: Nutzer-Zuordnung falls eingeloggt
    const user = getCurrentUser()
    const orgId = user?.organizationId ?? undefined

    const request = await db.analysisRequest.create({
      data: {
        industry:            body.industry,
        analysisTypes:       body.analysisTypes,
        accuracyLevel:       body.accuracyLevel,
        inputMethod:         body.inputMethod,
        goals:               body.goals,
        questionnaireData:   body.questionnaireData ? (body.questionnaireData as object) : undefined,
        uploadedFiles:       body.uploadedFiles ?? [],
        consentConfirmed:    body.consentConfirmed,
        privacyConfirmed:    body.privacyConfirmed,
        uploadAuthConfirmed: body.uploadAuthConfirmed ?? false,
        organizationId:      orgId ?? null,
        status:              'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id:     request.id,
        status: request.status,
      },
    })
  } catch (err) {
    console.error('[analysis-request] Fehler:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    const request = await db.analysisRequest.findUnique({ where: { id } })
    if (!request) {
      return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: request })
  }

  const requests = await db.analysisRequest.findMany({
    where: { organizationId: user.organizationId ?? undefined },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ success: true, data: requests })
}
