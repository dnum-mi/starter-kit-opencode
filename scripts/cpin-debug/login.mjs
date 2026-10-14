import { firefox } from 'playwright'
import { saveSecret, redact } from './lib.mjs'

const ARGOCD_URL = process.env.ARGOCD_URL ?? 'https://argocd.sdid.cpin.numerique-interieur.com'
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000
const POLL_INTERVAL_MS = 1000

async function waitForToken(page) {
  const deadline = Date.now() + LOGIN_TIMEOUT_MS
  while (Date.now() < deadline) {
    try {
      const token = await page.evaluate(() => {
        const fromStorage = localStorage.getItem('argocd.token')
        if (fromStorage) return fromStorage
        const fromSession = sessionStorage.getItem('argocd.token')
        if (fromSession) return fromSession
        const fromCookie = document.cookie
          .split('; ')
          .find((c) => c.startsWith('argocd.token='))
        return fromCookie ? decodeURIComponent(fromCookie.split('=').slice(1).join('=')) : null
      })
      if (token) return token
    } catch {
      // page en cours de navigation (retour Keycloak → ArgoCD) : on réessaie
    }
    const cookies = await page.context().cookies(ARGOCD_URL)
    const tokenCookie = cookies.find((c) => c.name === 'argocd.token')
    if (tokenCookie) return tokenCookie.value
    await page.waitForTimeout(POLL_INTERVAL_MS)
  }
  throw new Error(`Aucun token ArgoCD détecté après ${LOGIN_TIMEOUT_MS / 1000}s.`)
}

const browser = await firefox.launch({ headless: false })
const page = await browser.newPage()
try {
  console.log(`Ouvre ${ARGOCD_URL} — connecte-toi via le SSO Keycloak dans le navigateur.`)
  await page.goto(ARGOCD_URL, { waitUntil: 'domcontentloaded' })
  if (!page.url().startsWith(ARGOCD_URL)) {
    console.log('Redirigé vers le SSO Keycloak — connecte-toi, tu seras ramené automatiquement.')
  }
  const token = await waitForToken(page)
  console.log(`Token ArgoCD capturé : ${redact(token)}`)
  await saveSecret('ARGOCD_TOKEN', token)
  console.log('ARGOCD_TOKEN écrit dans .cpin/.env.secrets (0600) — jamais affiché.')
} catch (error) {
  console.error(`Erreur : ${error.message}`)
  process.exitCode = 1
} finally {
  await browser.close()
}
