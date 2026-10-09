import { chromium } from 'playwright'

const ARGOCD_URL = process.env.ARGOCD_URL ?? 'https://argocd.sdid.cpin.numerique-interieur.com'
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000
const POLL_INTERVAL_MS = 1000

function redact(value) {
  if (!value) return '<absent>'
  return `${value.slice(0, 8)}…${value.slice(-4)} (${value.length} chars)`
}

async function waitForToken(page) {
  const deadline = Date.now() + LOGIN_TIMEOUT_MS
  while (Date.now() < deadline) {
    const token = await page.evaluate(() => {
      const fromStorage = localStorage.getItem('argocd.token')
      if (fromStorage) return fromStorage
      const fromCookie = document.cookie
        .split('; ')
        .find((c) => c.startsWith('argocd.token='))
      return fromCookie ? decodeURIComponent(fromCookie.split('=').slice(1).join('=')) : null
    })
    if (token) return token
    await page.waitForTimeout(POLL_INTERVAL_MS)
  }
  throw new Error(`Aucun token ArgoCD détecté après ${LOGIN_TIMEOUT_MS / 1000}s.`)
}

async function checkApplications(token) {
  const response = await fetch(`${ARGOCD_URL}/api/v1/applications`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const status = response.status
  if (!response.ok) {
    console.log(`GET /api/v1/applications → ${status}`)
    return
  }
  const data = await response.json()
  const apps = (data.items ?? []).map((app) => ({
    name: app.metadata?.name,
    health: app.status?.health?.status,
    sync: app.status?.sync?.status,
  }))
  console.log(`GET /api/v1/applications → ${status} (${apps.length} applications)`)
  for (const app of apps) {
    console.log(`  - ${app.name}: health=${app.health ?? '?'} sync=${app.sync ?? '?'}`)
  }
}

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()
try {
  console.log(`Ouvre ${ARGOCD_URL} — connecte-toi via le SSO Keycloak dans le navigateur.`)
  await page.goto(ARGOCD_URL, { waitUntil: 'domcontentloaded' })
  const token = await waitForToken(page)
  console.log(`Token ArgoCD capturé : ${redact(token)}`)
  await checkApplications(token)
} finally {
  await browser.close()
}
