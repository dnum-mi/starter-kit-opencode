// Plateforme cible (instance CPiN), partagée par console.mjs, vault.mjs et cpin-debug. Non secret.
//
// Ordre de résolution d'une URL de service : variable d'environnement > .cpin/instance.env > valeur
// connue de l'instance choisie. Sans fichier : SDID (Scaleway), comportement historique.
// Une URL inconnue pour l'instance reste vide : elle ne se devine pas d'après une autre instance.
import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ensureExcluded } from './secrets-file.mjs'

export const INSTANCE_FILE = resolve(process.env.CPIN_INSTANCE_FILE ?? resolve(process.cwd(), '.cpin/instance.env'))
export const URL_KEYS = ['CONSOLE_URL', 'ARGOCD_URL', 'HARBOR_URL', 'GITLAB_URL', 'VAULT_URL']
const DEFAULT_INSTANCE = 'sdid'

export const INSTANCES = {
  sdid: {
    label: 'Scaleway (SDID)',
    CONSOLE_URL: 'https://console.sdid.cpin.numerique-interieur.com',
    ARGOCD_URL: 'https://argocd.sdid.cpin.numerique-interieur.com',
    HARBOR_URL: 'https://harbor.sdid.cpin.numerique-interieur.com',
    GITLAB_URL: 'https://gitlab.sdid.cpin.numerique-interieur.com',
    VAULT_URL: 'https://vault.sdid.cpin.numerique-interieur.com',
  },
  // seule la console est connue : les autres URL se relèvent sur l'instance et se notent dans le fichier
  rie: {
    label: 'RIE',
    CONSOLE_URL: 'https://console.dso.interieur.rie.gouv.fr',
  },
}

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

// Instance courante : nom, libellé, URL de chaque service (undefined si inconnue), source du choix.
export function currentInstance({ env = process.env, file = readInstanceFile() } = {}) {
  const name = file?.INSTANCE ?? DEFAULT_INSTANCE
  const preset = INSTANCES[name] ?? {}
  const urls = {}
  for (const key of URL_KEYS) urls[key] = (env[key] ?? file?.[key] ?? preset[key])?.replace(/\/$/, '')
  return { name, label: preset.label ?? name, urls, source: file ? INSTANCE_FILE : 'défaut (aucun fichier)' }
}

export function instanceUrl(key) {
  return currentInstance().urls[key]
}

// « sdid », « rie » ou l'URL https d'une autre console. Renvoie le contenu à écrire, ou une erreur.
export function instanceFileContent(choice) {
  if (INSTANCES[choice]) return { content: `INSTANCE=${choice}\n` }
  if (/^https:\/\/console\.[^/\s]+\/?$/.test(choice ?? ''))
    return { content: `INSTANCE=autre\nCONSOLE_URL=${choice.replace(/\/$/, '')}\n` }
  return { error: `instance attendue : ${Object.keys(INSTANCES).join(' | ')} | https://console.<instance>` }
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

export function readInstanceText() {
  try {
    return readFileSync(INSTANCE_FILE, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return ''
    throw error
  }
}

export async function saveInstance(content) {
  await ensureExcluded()
  await writeFile(INSTANCE_FILE, content, 'utf8')
}
