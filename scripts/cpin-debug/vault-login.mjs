import { firefox } from 'playwright'
import { loadSecrets, saveSecret, redact } from './lib.mjs'

const VAULT_URL = process.env.VAULT_URL ?? 'https://vault.sdid.cpin.numerique-interieur.com'
const KEYCLOAK_DOMAIN = process.env.KEYCLOAK_DOMAIN ?? 'keycloak.sdid.cpin.numerique-interieur.com'
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000
const POLL_INTERVAL_MS = 1000

// Cookies SSO Keycloak écrits par login.mjs (domaine keycloak).
const KC_COOKIE_NAMES = [
  'KEYCLOAK_IDENTITY',
  'KEYCLOAK_SESSION',
  'KEYCLOAK_REMEMBER_ME',
  'KEYCLOAK_LOCALE',
  'KC_AUTH_SESSION_HASH',
  'KC_AUTH_SESSION_ID',
]

async function injectKeycloakCookies(context) {
  const secrets = await loadSecrets()
  const cookies = []
  for (const name of KC_COOKIE_NAMES) {
    if (secrets[name]) {
      cookies.push({
        name,
        value: secrets[name],
        domain: KEYCLOAK_DOMAIN,
        path: '/',
        httpOnly: true,
        secure: true,
      })
    }
  }
  if (cookies.length) await context.addCookies(cookies)
  return cookies.map((c) => c.name)
}

async function readVaultToken(page) {
  return page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key.includes('vault-token')) continue
      try {
        const parsed = JSON.parse(localStorage.getItem(key))
        if (parsed && typeof parsed.token === 'string' && /^(?:hvs|hvb|hvr|s|v)\.[A-Za-z0-9+/=._-]{20,}$/.test(parsed.token)) {
          return parsed.token
        }
      } catch {
        // valeur non JSON : on ignore
      }
    }
    return null
  })
}

async function waitForDashboard(page) {
  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    if (page.url().includes('/ui/vault/dashboard')) return true
    await page.waitForTimeout(1000)
  }
  return false
}

async function clickRenewToken(page) {
  const userMenu = page.locator('[data-test-icon="user"], button:has-text("User menu")').first()
  if (await userMenu.count() > 0) {
    await userMenu.click()
    await page.waitForTimeout(1000)
  }
  const renew = page.locator('button:has-text("Renew token"), a:has-text("Renew token")').first()
  if (await renew.count() > 0) {
    await renew.click()
    console.log('Token Vault renouvelé.')
    return true
  }
  console.log('Bouton "Renew token" non trouvé (token déjà présent ?)')
  return false
}

const browser = await firefox.launch({ headless: false })
const context = await browser.newContext()
const page = await context.newPage()
try {
  const injected = await injectKeycloakCookies(context)
  console.log(`Cookies SSO Keycloak injectés : ${injected.join(', ') || 'aucun'}`)
  console.log(`Ouvre ${VAULT_URL}`)
  await page.goto(VAULT_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  const btn = page.locator('button:has-text("Sign in with OIDC")')
  if (await btn.count() > 0) {
    console.log('Clic sur "Sign in with OIDC provider" — auto-login SSO attendu.')
    await btn.first().click()
  }
  const onDashboard = await waitForDashboard(page)
  console.log(`Dashboard Vault : ${onDashboard ? 'oui' : 'non'}`)
  if (onDashboard) {
    await clickRenewToken(page)
    await page.waitForTimeout(2000)
  }
  const deadline = Date.now() + LOGIN_TIMEOUT_MS
  let token = null
  while (Date.now() < deadline) {
    try {
      token = await readVaultToken(page)
      if (token) break
    } catch {
      // page en cours de navigation : on réessaie
    }
    await page.waitForTimeout(POLL_INTERVAL_MS)
  }
  if (!token) throw new Error(`Aucun token Vault détecté après ${LOGIN_TIMEOUT_MS / 1000}s.`)
  console.log(`Token Vault capturé : ${redact(token)}`)
  await saveSecret('VAULT_TOKEN', token)
  console.log('VAULT_TOKEN écrit dans .cpin/.env.secrets (0600) — jamais affiché.')
} catch (error) {
  console.error(`Erreur : ${error.message}`)
  process.exitCode = 1
} finally {
  await browser.close()
}
