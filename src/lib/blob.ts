// Helfer für privaten Vercel Blob Storage.
//
// Dokumente werden privat (access: 'private') abgelegt – sie sind NICHT öffentlich
// abrufbar. Zur Analysezeit erzeugt `presignBlobGetUrl()` eine kurzlebige, signierte
// GET-URL, die die Python-Analyse einmalig per HTTPS lesen kann.
//
// Das Token (BLOB_READ_WRITE_TOKEN) wird automatisch aus der Umgebung gelesen,
// genau wie bei `put()` im Upload-Endpunkt.

import { issueSignedToken, presignUrl } from '@vercel/blob'

/** Standard-Gültigkeit einer signierten Download-URL: 10 Minuten. */
const DEFAULT_TTL_MS = 10 * 60 * 1000

/**
 * Erzeugt eine kurzlebige, signierte GET-URL für ein privates Blob-Objekt.
 * @param pathname Pfad des Objekts im Store, z. B. "uploads/<uuid>.csv"
 * @param ttlMs    Gültigkeitsdauer in Millisekunden (Default: 10 Minuten)
 */
export async function presignBlobGetUrl(pathname: string, ttlMs: number = DEFAULT_TTL_MS): Promise<string> {
  const validUntil = Date.now() + ttlMs

  const signed = await issueSignedToken({
    pathname,
    operations: ['get'],
    validUntil,
  })

  const { presignedUrl } = await presignUrl(signed, {
    operation: 'get',
    pathname,
    access: 'private',
  })

  return presignedUrl
}
