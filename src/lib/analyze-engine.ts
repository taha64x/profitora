/**
 * Brücke zur Python-Analyse-Engine.
 *
 * - Lokal (`next dev`): ruft `python3 python/analyze_csv.py` via child_process auf.
 * - Auf Vercel (serverless, kein python3 im Node-Runtime): ruft die separate
 *   Vercel-Python-Funktion unter `/api/py/analyze` per HTTP auf.
 *
 * Die Umschaltung erfolgt über `process.env.VERCEL` (von Vercel automatisch gesetzt).
 */
import { execFile } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'

const execFileAsync = promisify(execFile)

const isServerless = !!process.env.VERCEL

export interface HeadersResult {
  success: boolean
  columns?: string[]
  error?: string
}

/** Absolute URL der Vercel-Python-Funktion. */
function pythonEndpoint(): string {
  if (process.env.PYTHON_ANALYZE_URL) return process.env.PYTHON_ANALYZE_URL
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  if (!base) {
    throw new Error(
      'Python-Endpunkt nicht konfiguriert: NEXT_PUBLIC_APP_URL oder PYTHON_ANALYZE_URL setzen.',
    )
  }
  return `${base.replace(/\/$/, '')}/api/py/analyze`
}

async function callPythonFunction<T>(body: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (process.env.PY_INTERNAL_TOKEN) headers['x-internal-token'] = process.env.PY_INTERNAL_TOKEN

  const res = await fetch(pythonEndpoint(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as T
  if (!res.ok) {
    const err = (data as { error?: string })?.error || `HTTP ${res.status}`
    throw new Error(`Python-Analyse fehlgeschlagen: ${err}`)
  }
  return data
}

const scriptPath = () => join(process.cwd(), 'python', 'analyze_csv.py')

/** Führt die vollständige KPI-Analyse aus und liefert das Ergebnis-Objekt. */
export async function runEngineAnalysis<T = unknown>(config: unknown): Promise<T> {
  if (isServerless) {
    return callPythonFunction<T>({ mode: 'analyze', config })
  }
  const { stdout } = await execFileAsync('python3', [
    scriptPath(),
    '--config-json',
    JSON.stringify(config),
  ])
  return JSON.parse(stdout) as T
}

/** Liest die Spaltennamen einer hochgeladenen Datei (für das Spalten-Mapping). */
export async function getColumnHeaders(filePath: string): Promise<HeadersResult> {
  if (isServerless) {
    return callPythonFunction<HeadersResult>({ mode: 'headers', file: filePath })
  }
  const { stdout } = await execFileAsync('python3', [
    scriptPath(),
    '--mode',
    'headers',
    '--file',
    filePath,
  ])
  return JSON.parse(stdout) as HeadersResult
}
