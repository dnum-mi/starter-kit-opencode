#!/usr/bin/env node
// API Vault (kv v2) pour le debug et l'alimentation des secrets applicatifs. Sans dépendance.
//
//   node vault.mjs whoami                                  qui est le jeton : politiques, expiration (jamais sa valeur)
//   node vault.mjs mounts                                  mounts kv visibles par le jeton
//   node vault.mjs capabilities --path <mount>/<secret>    droits du jeton sur ce secret (read, update, patch…)
//   node vault.mjs list [--path <mount>[/<dossier>]]       NOMS des secrets (jamais leur contenu)
//   node vault.mjs metadata --path <mount>/<secret>        version courante, dates, suppression (jamais les valeurs)
//   node vault.mjs put --path <mount>/<secret> --env-file <.env> [--keys A,B] [--apply]
//                                                          pousse les valeurs du .env ; simulation sans --apply
//
// VAULT_TOKEN est lu dans <dossier courant>/.cpin/.env.secrets (UI Vault > 👤 > « Copy token »).
//
// GARANTIE : ce script ne lit JAMAIS le contenu d'un secret. Toute requête passe par request(), qui n'accepte
// qu'une liste fermée de routes (voir ROUTES) ; GET <mount>/data/... n'en fait pas partie et une écriture
// n'affiche que le numéro de version créé. Les valeurs du .env et le jeton sont masqués en sortie.
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { loadSecrets, SECRETS_FILE } from '../cpin-debug/lib.mjs'
import { instanceUrl } from './instance.mjs'

const VAULT_URL = instanceUrl('VAULT_URL') ?? ''

// --- garde-fou : routes autorisées ------------------------------------------------------------
// Un mount DSO est un seul segment (<organisation>-<projet>) ; le reste du chemin ne peut pas remonter.
const SEGMENT = '(?!\\.{1,2}(?:/|$))[A-Za-z0-9._-]+' // ni « . » ni « .. »
const SUBPATH = `${SEGMENT}(?:/${SEGMENT})*`
export const ROUTES = [
  { method: 'GET', re: /^auth\/token\/lookup-self$/ },
  { method: 'GET', re: /^sys\/internal\/ui\/mounts$/ },
  { method: 'POST', re: /^sys\/capabilities-self$/ },
  { method: 'GET', re: new RegExp(`^${SEGMENT}/metadata(?:/${SUBPATH})?$`) }, // lecture : métadonnées et LIST seulement
  { method: 'PATCH', re: new RegExp(`^${SEGMENT}/data/${SUBPATH}$`), write: true },
  { method: 'POST', re: new RegExp(`^${SEGMENT}/data/${SUBPATH}$`), write: true },
]

export function isAllowed(method, path) {
  return ROUTES.some(route => route.method === method && route.re.test(path))
}

// --- sortie masquée ---------------------------------------------------------------------------
const known = new Set()
function remember(value) {
  if (typeof value === 'string' && value.length >= 4) known.add(value)
}
function scrub(text) {
  let out = String(text)
  for (const value of known) out = out.split(value).join('***')
  return out.replace(/\b(?:hvs|hvb|hvr|s)\.[A-Za-z0-9_-]{16,}/g, '***')
}
const say = (...parts) => console.log(scrub(parts.join(' ')))
function fail(message) {
  console.error(scrub(message))
  process.exit(1)
}

// --- requête ----------------------------------------------------------------------------------
let TOKEN
async function request(method, path, { query = '', body, contentType = 'application/json' } = {}) {
  if (!isAllowed(method, path)) fail(`route refusée par le garde-fou : ${method} ${path}`)
  const response = await fetch(`${VAULT_URL}/v1/${path}${query}`, {
    method,
    headers: { 'X-Vault-Token': TOKEN, ...(body ? { 'Content-Type': contentType } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: response.status, json, errors: json?.errors ?? [] }
}

function explain(res, what) {
  if (res.status === 403) fail(`${what} : 403 — le jeton n'a pas ce droit (ou il a expiré : « whoami »)`)
  if (res.status === 404) fail(`${what} : 404 — chemin introuvable`)
  fail(`${what} : HTTP ${res.status}${res.errors.length ? ` — ${res.errors.join('; ')}` : ''}`)
}

function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) { args._.push(arg); continue }
    const key = arg.slice(2)
    if (key === 'apply') args.apply = true
    else args[key] = argv[++i]
  }
  return args
}

function cleanPath(value, what) {
  const path = String(value ?? '').replace(/^\/+|\/+$/g, '')
  if (!path) fail(`${what} requis`)
  if (!new RegExp(`^${SUBPATH}$`).test(path)) fail(`${what} invalide : « ${path} » (segments [A-Za-z0-9._-], pas de « .. »)`)
  if (path.split('/').some(part => part === '..')) fail(`${what} invalide : « .. » interdit`)
  return path
}

function splitMount(value) {
  const path = cleanPath(value, '--path')
  const [mount, ...rest] = path.split('/')
  return { mount, secret: rest.join('/') }
}

// --- .env -------------------------------------------------------------------------------------
// Sémantique dotenv usuelle : guillemets retirés, commentaire après une valeur entre guillemets ignoré,
// commentaire non quoté seulement s'il est précédé d'un blanc (« a#b » reste « a#b », un jeton peut contenir #).
// L'analyseur de Node (util.parseEnv) coupe à tout « # » et tronquerait de tels secrets.
export function parseEnv(content) {
  const env = {}
  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/)
    if (!match) continue
    const rest = match[2].trimStart()
    const quoted = rest.match(/^(["'])(.*?)\1(?:\s.*)?$/)
    env[match[1]] = quoted ? quoted[2] : rest.replace(/(^|\s)#.*$/, '').trim()
  }
  return env
}

// --- commandes --------------------------------------------------------------------------------
const commands = {
  async whoami() {
    const res = await request('GET', 'auth/token/lookup-self')
    if (res.status !== 200) explain(res, 'lookup du jeton')
    const d = res.json.data
    say(`jeton       : ${d.display_name ?? '?'} (${d.renewable ? 'renouvelable' : 'non renouvelable'})`)
    say(`expiration  : ${d.expire_time ?? 'jamais'} (ttl ${d.ttl}s)`)
    say(`politiques  : ${(d.policies ?? []).join(', ')}`)
    say('garantie    : ce script ne lit jamais le contenu d\'un secret (noms, versions et droits seulement)')
  },

  async mounts() {
    const res = await request('GET', 'sys/internal/ui/mounts')
    if (res.status !== 200) explain(res, 'liste des mounts')
    const secret = res.json.data?.secret ?? {}
    for (const [path, info] of Object.entries(secret))
      say(`${path.padEnd(40)} ${info.type}${info.options?.version ? ` v${info.options.version}` : ''}`)
  },

  async capabilities(args) {
    const { mount, secret } = splitMount(args.path)
    // les droits se testent sur la route data/ : c'est une question de politique, rien n'est lu
    const target = secret ? `${mount}/data/${secret}` : `${mount}/data/`
    const res = await request('POST', 'sys/capabilities-self', { body: { paths: [target] } })
    if (res.status !== 200) explain(res, 'capabilities')
    const caps = res.json.data?.[target] ?? res.json.capabilities ?? []
    say(`${target} : ${caps.join(', ') || 'aucun droit'}`)
  },

  async list(args) {
    const { mount, secret } = args.path ? splitMount(args.path) : { mount: null }
    if (!mount) return commands.mounts()
    const path = `${mount}/metadata${secret ? `/${secret}` : ''}`
    const res = await request('GET', path, { query: '?list=true' })
    if (res.status === 404) return say('(vide)')
    if (res.status !== 200) explain(res, 'list')
    for (const key of res.json.data?.keys ?? []) say(key)
  },

  async metadata(args) {
    const { mount, secret } = splitMount(args.path)
    if (!secret) fail('--path doit désigner un secret : <mount>/<secret>')
    const res = await request('GET', `${mount}/metadata/${secret}`)
    if (res.status !== 200) explain(res, 'metadata')
    const d = res.json.data
    say(`version courante : ${d.current_version} (max ${d.max_versions || 'illimité'})`)
    say(`créé              : ${d.created_time}`)
    say(`modifié           : ${d.updated_time}`)
    const versions = Object.entries(d.versions ?? {})
    for (const [number, v] of versions.slice(-5))
      say(`  v${number} ${v.created_time}${v.deletion_time ? ` supprimée ${v.deletion_time}` : ''}${v.destroyed ? ' détruite' : ''}`)
  },

  async put(args) {
    const { mount, secret } = splitMount(args.path)
    if (!secret) fail('--path doit désigner un secret : <mount>/<secret>')
    if (!args['env-file']) fail('--env-file requis')
    const env = parseEnv(await readFile(args['env-file'], 'utf8'))
    const wanted = args.keys ? args.keys.split(',').map(k => k.trim()).filter(Boolean) : Object.keys(env)
    for (const value of Object.values(env)) remember(value)

    const data = {}
    const empty = []
    const missing = []
    for (const key of wanted) {
      if (!(key in env)) missing.push(key)
      else if (env[key] === '') empty.push(key)
      else data[key] = env[key]
    }
    say(`cible : ${mount}/${secret} (kv v2)`)
    for (const key of Object.keys(data)) say(`  ${key} : renseigné → sera envoyé`)
    for (const key of empty) say(`  ${key} : vide → ignoré`)
    for (const key of missing) say(`  ${key} : absent de ${args['env-file']} → ignoré`)
    if (!Object.keys(data).length) fail('aucune valeur renseignée à envoyer')
    if (!args.apply) return say('\nSimulation : rien n\'a été écrit (relancer avec --apply après accord de l\'humain).')

    // PATCH fusionne avec les clés existantes sans les lire. POST écraserait le secret : seulement s'il n'existe pas.
    let res = await request('PATCH', `${mount}/data/${secret}`, {
      body: { data }, contentType: 'application/merge-patch+json',
    })
    // cas: 0 : création seulement. Si un autre écrivain a créé le secret entre-temps, Vault refuse au lieu d'écraser.
    if (res.status === 404) res = await request('POST', `${mount}/data/${secret}`, { body: { options: { cas: 0 }, data } })
    if (res.status !== 200 && res.status !== 204) explain(res, 'écriture')
    say(`écrit : ${Object.keys(data).length} clé(s), version ${res.json?.data?.version ?? '?'}`)
  },
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = parseArgs(process.argv.slice(2))
  const command = args._[0]
  if (!commands[command]) fail(`commande inconnue : ${command ?? '(aucune)'} — voir l'en-tête de vault.mjs`)
  if (!VAULT_URL.startsWith('https://')) fail('VAULT_URL inconnue pour cette instance ou pas en https:// (voir console.mjs instance)')
  TOKEN = (await loadSecrets()).VAULT_TOKEN
  if (!TOKEN) fail(`VAULT_TOKEN vide ou absent de ${SECRETS_FILE} (UI Vault > 👤 > Copy token, à coller dans ce fichier)`)
  remember(TOKEN)
  await commands[command](args)
}
