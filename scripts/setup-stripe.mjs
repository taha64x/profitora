// Legt die Abo-Produkte + Prices für das Profitora-Abomodell an (idempotent)
// und stellt sicher, dass der Webhook alle Abo-Events abonniert hat.
// Aufruf:  STRIPE_SECRET_KEY=sk_… node scripts/setup-stripe.mjs
// Gibt NUR die Env-Zeilen mit Price-IDs aus (keine Secrets).
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error('STRIPE_SECRET_KEY fehlt.')
  process.exit(1)
}
const stripe = new Stripe(key)
const mode = key.startsWith('sk_live') ? 'LIVE' : 'TEST'

const PRODUCTS = [
  { name: 'Profitora Starter', desc: 'Unternehmens-Cockpit — Finanzen im Griff' },
  { name: 'Profitora Business', desc: 'Unternehmens-Cockpit — der komplette Betrieb an einem Ort' },
  { name: 'Profitora Premium', desc: 'Unternehmens-Cockpit — mehr Standorte, volle Tiefe' },
  { name: 'Profitora KI-Analyse', desc: 'Vollständige KI-Wirtschaftlichkeitsanalyse (10-Abschnitt-Bericht)' },
]

// [Produktname, unit_amount (Cent), interval|null, Env-Name]
const PRICES = [
  ['Profitora Starter', 14900, 'month', 'STRIPE_PRICE_STARTER_MONTHLY'],
  ['Profitora Starter', 142800, 'year', 'STRIPE_PRICE_STARTER_YEARLY'],
  ['Profitora Business', 29900, 'month', 'STRIPE_PRICE_BUSINESS_MONTHLY'],
  ['Profitora Business', 286800, 'year', 'STRIPE_PRICE_BUSINESS_YEARLY'],
  ['Profitora Premium', 59900, 'month', 'STRIPE_PRICE_PREMIUM_MONTHLY'],
  ['Profitora Premium', 574800, 'year', 'STRIPE_PRICE_PREMIUM_YEARLY'],
  ['Profitora KI-Analyse', 249000, null, 'STRIPE_PRICE_ANALYSIS_SOLO'],
  ['Profitora KI-Analyse', 49900, null, 'STRIPE_PRICE_ANALYSIS_STARTER'],
  ['Profitora KI-Analyse', 29900, null, 'STRIPE_PRICE_ANALYSIS_BUSINESS'],
  ['Profitora KI-Analyse', 19900, null, 'STRIPE_PRICE_ANALYSIS_PREMIUM'],
]

const REQUIRED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
]

async function main() {
  console.error(`Modus: ${mode}`)

  // Produkte (per Name matchen, sonst anlegen)
  const existing = await stripe.products.list({ limit: 100, active: true })
  const productByName = new Map(existing.data.map((p) => [p.name, p]))
  for (const p of PRODUCTS) {
    if (!productByName.has(p.name)) {
      const created = await stripe.products.create({
        name: p.name,
        description: p.desc,
        metadata: { app: 'profitora' },
      })
      productByName.set(p.name, created)
      console.error(`Produkt angelegt: ${p.name}`)
    } else {
      console.error(`Produkt vorhanden: ${p.name}`)
    }
  }

  // Prices (per Produkt + Betrag + Intervall matchen, sonst anlegen)
  const envLines = []
  for (const [productName, amount, interval, envName] of PRICES) {
    const product = productByName.get(productName)
    const prices = await stripe.prices.list({ product: product.id, limit: 100, active: true })
    let price = prices.data.find(
      (pr) =>
        pr.unit_amount === amount &&
        pr.currency === 'eur' &&
        ((interval && pr.recurring?.interval === interval) || (!interval && !pr.recurring)),
    )
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        currency: 'eur',
        unit_amount: amount,
        ...(interval ? { recurring: { interval } } : {}),
        metadata: { app: 'profitora', env: envName },
      })
      console.error(`Price angelegt: ${envName} (${(amount / 100).toFixed(2)} €${interval ? '/' + interval : ''})`)
    } else {
      console.error(`Price vorhanden: ${envName}`)
    }
    envLines.push(`${envName}=${price.id}`)
  }

  // Webhook-Events sicherstellen (profitora.de-Endpoint)
  const hooks = await stripe.webhookEndpoints.list({ limit: 16 })
  const hook = hooks.data.find((h) => h.url.includes('profitora'))
  if (hook) {
    const missing = REQUIRED_EVENTS.filter((e) => !hook.enabled_events.includes(e) && !hook.enabled_events.includes('*'))
    if (missing.length > 0) {
      await stripe.webhookEndpoints.update(hook.id, {
        enabled_events: [...new Set([...hook.enabled_events, ...REQUIRED_EVENTS])],
      })
      console.error(`Webhook ${hook.id}: Events ergänzt → ${missing.join(', ')}`)
    } else {
      console.error(`Webhook ${hook.id}: alle Abo-Events bereits abonniert`)
    }
  } else {
    console.error('WARNUNG: Kein profitora-Webhook-Endpoint gefunden — Events manuell prüfen!')
  }

  console.log(envLines.join('\n'))
}

main().catch((err) => {
  console.error('Fehler:', err.message)
  process.exit(1)
})
