import { firefox } from 'playwright'
import { writeFile, chmod } from 'node:fs/promises'
import { resolve } from 'node:path'
import { instanceUrl } from '../cpin-console/instance.mjs'

const ARGOCD_URL = instanceUrl('ARGOCD_URL')
const HARBOR_URL = instanceUrl('HARBOR_URL')
const GITLAB_URL = instanceUrl('GITLAB_URL')
const TOKEN_FILE = process.env.TOKEN_FILE ?? resolve(import.meta.dirname, '.token')
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000
const POLL_INTERVAL_MS = 1000

function redact(value) {
  if (!value) return '<absent>'
  return `<${value.length} caractères, masqué>`
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
  await writeFile(TOKEN_FILE, token, { encoding: 'utf8', mode: 0o600 })
  await chmod(TOKEN_FILE, 0o600)
  console.log(`Token sauvegardé (0600) : ${TOKEN_FILE}`)
}

async function testService(name, url, path, headers = {}) {
  if (!url) {
    console.log(`${name} : URL inconnue (à noter dans .cpin/instance.env, voir console.mjs instance)`)
    return
  }
  try {
    const response = await fetch(`${url}${path}`, {
      headers: { Authorization: `Bearer ${await readToken()}`, ...headers },
    })
    console.log(`${name} : GET ${path} → ${response.status}`)
    if (response.ok && name === 'ArgoCD') await printApplications(response)
  } catch (error) {
    console.log(`${name} : erreur réseau → ${error.message}`)
  }
}

// Noms, santé et synchro seulement : jamais le corps complet de la réponse.
async function printApplications(response) {
  const { items } = await response.json()
  if (!items?.length) return console.log('  aucune application visible')
  for (const app of items) {
    const health = app.status?.health?.status ?? '?'
    const sync = app.status?.sync?.status ?? '?'
    console.log(`  ${app.metadata?.name} — santé ${health}, synchro ${sync}`)
  }
}

async function readToken() {
  const { readFile } = await import('node:fs/promises')
  return (await readFile(TOKEN_FILE, 'utf8')).trim()
}

if (!ARGOCD_URL) {
  console.error('ARGOCD_URL inconnue : la noter dans .cpin/instance.env (voir console.mjs instance).')
  process.exit(1)
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
