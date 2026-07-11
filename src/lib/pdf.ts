import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

/**
 * Browser-Start für PDF-Generierung: auf Vercel das serverless-taugliche
 * @sparticuz/chromium, lokal ein installiertes Chrome/Chromium
 * (Pfad via LOCAL_CHROME_PATH override).
 */
export async function launchBrowser() {
  if (process.env.VERCEL) {
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }
  const localChrome =
    process.env.LOCAL_CHROME_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  return puppeteer.launch({
    executablePath: localChrome,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
}

/** HTML zu PDF (A4) rendern und als Buffer zurückgeben. */
export async function htmlToPdf(html: string) {
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
