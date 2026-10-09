import { readFile, writeFile, chmod } from 'node:fs/promises'
import { resolve } from 'node:path'

export const SECRETS_FILE = resolve(import.meta.dirname, '.env.secrets')

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
  await writeFile(SECRETS_FILE, content, { encoding: 'utf8', flag: 'w' })
  await chmod(SECRETS_FILE, 0o600)
}

export function redact(value) {
  if (!value) return '<absent>'
  return `${value.slice(0, 8)}…${value.slice(-4)} (${value.length} chars)`
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
