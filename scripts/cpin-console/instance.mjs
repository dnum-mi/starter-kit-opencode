// Plateforme cible (instance CPiN), partagée par console.mjs, vault.mjs et cpin-debug. Non secret.
//
// Ordre de résolution d'une URL de service : variable d'environnement > .cpin/instance.env.
// Aucune URL n'est codée en dur : sans fichier, toutes restent vides et se relèvent sur l'instance.
// Une URL inconnue pour l'instance reste vide : elle ne se devine pas d'après une autre instance.
import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ensureExcluded } from './secrets-file.mjs'

export const INSTANCE_FILE = resolve(process.env.CPIN_INSTANCE_FILE ?? resolve(process.cwd(), '.cpin/instance.env'))
export const URL_KEYS = ['CONSOLE_URL', 'ARGOCD_URL', 'HARBOR_URL', 'GITLAB_URL', 'VAULT_URL']

// name de plugin (réponse /projects/{id}/services) → clé d'URL. Les URL de base sont celles de l'instance :
// n'importe quel projet accessible les donne (le chemin, lui, est propre au projet et n'est pas retenu).
export const SERVICE_URL_KEYS = { argocd: 'ARGOCD_URL', gitlab: 'GITLAB_URL', registry: 'HARBOR_URL', vault: 'VAULT_URL' }

export function parseEnv(text) {
  const values = {}
  for (const line of text.split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (match && match[2].trim()) values[match[1]] = match[2].trim()
  }
  return values
}

function readInstanceFile() {
  const text = readInstanceText()
  return text ? parseEnv(text) : null
}

// Instance courante : URL de chaque service (undefined si inconnue) et source du fichier.
export function currentInstance({ env = process.env, file = readInstanceFile() } = {}) {
  const urls = {}
  for (const key of URL_KEYS) urls[key] = (env[key] ?? file?.[key])?.replace(/\/$/, '')
  return { urls, source: file ? INSTANCE_FILE : 'aucun fichier' }
}

// Contenu initial de .cpin/instance.env : placeholders, aucune URL réelle versionnée.
export function instanceEnvTemplate() {
  return [
    '# Plateforme cible CPiN (non secret). Remplir les URL relevées sur l\'instance.',
    ...URL_KEYS.map(key => `${key}=`),
    '',
  ].join('\n')
}

export function instanceUrl(key) {
  return currentInstance().urls[key]
}

// URL https de la console. Renvoie le contenu à écrire (URL de service remises à zéro), ou une erreur.
export function instanceFileContent(choice) {
  if (/^https:\/\/console\.[^/\s]+\/?$/.test(choice ?? ''))
    return { content: `CONSOLE_URL=${choice.replace(/\/$/, '')}\n` }
  return { error: 'instance attendue : https://console.<instance>' }
}

// Ajoute ou remplace des URL (« ARGOCD_URL=https://… ») dans le contenu du fichier.
export function withUrls(content, specs) {
  const values = parseEnv(content)
  for (const spec of specs) {
    const [key, url] = [spec.slice(0, spec.indexOf('=')), spec.slice(spec.indexOf('=') + 1)]
    if (!URL_KEYS.includes(key)) return { error: `${spec} : clé attendue parmi ${URL_KEYS.join(', ')}` }
    if (!/^https:\/\/[^/\s]+/.test(url)) return { error: `${spec} : URL https:// attendue` }
    values[key] = url.replace(/\/$/, '')
  }
  return { content: `${Object.entries(values).map(([k, v]) => `${k}=${v}`).join('\n')}\n` }
}

// URL de base (origine) des services d'un projet, au format « CLÉ=https://… » accepté par withUrls.
// On ne garde que l'origine : le chemin (/forge-mi/projects/…, /harbor/projects/…) est propre au projet.
export function urlsFromServices(services) {
  const specs = []
  for (const service of services ?? []) {
    const key = SERVICE_URL_KEYS[service?.name]
    const to = service?.urls?.[0]?.to
    if (!key || !to) continue
    try { specs.push(`${key}=${new URL(to).origin}`) } catch {}
  }
  return specs
}

export function readInstanceText() {
  try {
    return readFileSync(INSTANCE_FILE, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return ''
    throw error
  }
}

export async function saveInstance(content) {
  await ensureExcluded(INSTANCE_FILE)
  await writeFile(INSTANCE_FILE, content, 'utf8')
}
