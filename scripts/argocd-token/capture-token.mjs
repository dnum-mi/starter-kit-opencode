import { firefox } from 'playwright'
import { writeFile, chmod } from 'node:fs/promises'
import { resolve } from 'node:path'

const ARGOCD_URL = process.env.ARGOCD_URL ?? 'https://argocd.sdid.cpin.numerique-interieur.com'
const HARBOR_URL = process.env.HARBOR_URL ?? 'https://harbor.sdid.cpin.numerique-interieur.com'
const GITLAB_URL = process.env.GITLAB_URL ?? 'https://gitlab.sdid.cpin.numerique-interieur.com'
const TOKEN_FILE = process.env.TOKEN_FILE ?? resolve(import.meta.dirname, '.token')
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000
const POLL_INTERVAL_MS = 1000

function redact(value) {
  if (!value) return '<absent>'
  return `${value.slice(0, 8)}…${value.slice(-4)} (${value.length} chars)`
}

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

async function saveToken(token) {
  await writeFile(TOKEN_FILE, token, { encoding: 'utf8', flag: 'w' })
  await chmod(TOKEN_FILE, 0o600)
  console.log(`Token sauvegardé (0600) : ${TOKEN_FILE}`)
}

async function testService(name, url, path, headers = {}) {
  if (!url) {
    console.log(`${name} : URL non configurée (variable d'env manquante)`)
    return
  }
  try {
    const response = await fetch(`${url}${path}`, {
      headers: { Authorization: `Bearer ${await readToken()}`, ...headers },
    })
    console.log(`${name} : GET ${path} → ${response.status}`)
  } catch (error) {
    console.log(`${name} : erreur réseau → ${error.message}`)
  }
}

async function readToken() {
  const { readFile } = await import('node:fs/promises')
  return (await readFile(TOKEN_FILE, 'utf8')).trim()
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
  await saveToken(token)
  await testService('ArgoCD', ARGOCD_URL, '/api/v1/applications')
  await testService('Harbor', HARBOR_URL, '/api/v2.0/projects')
  await testService('GitLab', GITLAB_URL, '/api/v4/user')
} catch (error) {
  console.error(`Erreur : ${error.message}`)
  process.exitCode = 1
} finally {
  await browser.close()
}
