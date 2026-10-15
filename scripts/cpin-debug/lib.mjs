import { readFile } from 'node:fs/promises'
import { SECRETS_FILE, writeSecretsFile } from '../cpin-console/secrets-file.mjs'

export { SECRETS_FILE }

// Même fichier que scripts/cpin-console (voir secrets-file.mjs). Lancer ces scripts depuis le dossier du
// projet, jamais depuis le dossier du kit (cache du plugin, vidable).

export async function loadSecrets() {
  try {
    const content = await readFile(SECRETS_FILE, 'utf8')
    const secrets = {}
    for (const line of content.split('\n')) {
      const match = line.match(/^([A-Z_]+)=(.*)$/)
      if (match) secrets[match[1]] = match[2]
    }
    return secrets
  } catch {
    return {}
  }
}

export async function saveSecret(key, value) {
  const secrets = await loadSecrets()
  secrets[key] = value
  const content = `${Object.entries(secrets)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')}\n`
  await writeSecretsFile(content)
}

export async function purgeSecrets(names) {
  const secrets = await loadSecrets()
  for (const name of names) delete secrets[name]
  const content = `${Object.entries(secrets)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')}\n`
  await writeFile(SECRETS_FILE, content, { encoding: 'utf8', flag: 'w' })
  await chmod(SECRETS_FILE, 0o600)
}

// Cookies SSO Keycloak (domaine keycloak) : valent un accès SSO complet à tout ce que l'humain peut
// atteindre, pas seulement à Vault. À purger après usage (vault-login.mjs purge).
export const KEYCLOAK_COOKIE_NAMES = [
  'KEYCLOAK_IDENTITY',
  'KEYCLOAK_SESSION',
  'KEYCLOAK_REMEMBER_ME',
  'KEYCLOAK_LOCALE',
  'KC_AUTH_SESSION_HASH',
  'KC_AUTH_SESSION_ID',
]

export function redact(value) {
  if (!value) return '<absent>'
  return `<${value.length} caractères, masqué>`
}

export async function checkService(name, url, path, token, { header = 'Authorization', prefix = 'Bearer ' } = {}) {
  if (!url) {
    console.log(`${name} : URL non configurée`)
    return
  }
  if (!token) {
    console.log(`${name} : token manquant (voir .env.secrets)`)
    return
  }
  try {
    const response = await fetch(`${url}${path}`, {
      headers: { [header]: `${prefix}${token}` },
    })
    console.log(`${name} : GET ${path} → ${response.status}`)
  } catch (error) {
    console.log(`${name} : erreur réseau → ${error.message}`)
  }
}
