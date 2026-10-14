import { loadSecrets } from './lib.mjs'

// Gestion des secrets Vault via l'API (kv-v2). Lit VAULT_TOKEN dans .cpin/.env.secrets.
// Usage (depuis le dossier du projet) :
//   node vault-secret.mjs list <mount> [prefix]
//   node vault-secret.mjs read <mount>/<path>
//   node vault-secret.mjs write <mount>/<path> KEY1 KEY2 ...
//   node vault-secret.mjs delete <mount>/<path>
// write : les valeurs sont lues dans les variables d'environnement du même nom
//         (jamais passées en argument, jamais affichées).

const VAULT_URL = process.env.VAULT_URL ?? 'https://vault.sdid.cpin.numerique-interieur.com'

const [command, secretPath, ...keys] = process.argv.slice(2)

function usage() {
  console.error(`Usage : node vault-secret.mjs <list|read|write|delete> <mount>/<path> [KEY ...]`)
  process.exit(1)
}

if (!command || !secretPath) usage()
const [mount, ...pathParts] = secretPath.split('/')
if (!mount) usage()
const path = pathParts.join('/')
if (command !== 'list' && pathParts.length === 0) usage()

async function api(method, urlPath, body, { tolerate404 = false } = {}) {
  const secrets = await loadSecrets()
  if (!secrets.VAULT_TOKEN) {
    console.error('VAULT_TOKEN manquant dans .cpin/.env.secrets — lance d\'abord vault-login.mjs.')
    process.exit(1)
  }
  const response = await fetch(`${VAULT_URL}/v1/${urlPath}`, {
    method,
    headers: {
      'X-Vault-Token': secrets.VAULT_TOKEN,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    if (tolerate404 && response.status === 404) return null
    const text = await response.text()
    console.error(`Vault ${method} ${urlPath} → ${response.status} : ${text.slice(0, 300)}`)
    process.exit(1)
  }
  return response.status === 204 ? null : response.json()
}

async function listSecrets(prefix) {
  const urlPath = prefix ? `${mount}/metadata/${prefix}?list=true` : `${mount}/metadata?list=true`
  const data = await api('GET', urlPath, undefined, { tolerate404: true })
  const keys = data?.data?.keys ?? []
  if (keys.length === 0) {
    console.log(`Aucun secret sous ${mount}/${prefix}.`)
    return
  }
  console.log(`Secrets sous ${mount}/${prefix} :`)
  for (const key of keys) console.log(`  ${key}`)
}

async function readSecret() {
  const data = await api('GET', `${mount}/data/${path}`, undefined, { tolerate404: true })
  if (!data) {
    console.log(`Secret ${mount}/${path} : inexistant.`)
    return
  }
  const entries = Object.entries(data?.data?.data ?? {})
  if (entries.length === 0) {
    console.log(`Secret ${mount}/${path} : vide.`)
    return
  }
  console.log(`Secret ${mount}/${path} : ${entries.length} clé(s)`)
  for (const [key, value] of entries) {
    console.log(`  ${key} : ${typeof value === 'string' ? `${value.length} caractères` : typeof value}`)
  }
}

async function writeSecret() {
  if (keys.length === 0) usage()
  const data = {}
  for (const key of keys) {
    if (!process.env[key]) {
      console.error(`Variable d'environnement ${key} absente — fournis-la (ex. ${key}=... node vault-secret.mjs ...).`)
      process.exit(1)
    }
    data[key] = process.env[key]
  }
  await api('POST', `${mount}/data/${path}`, { data })
  console.log(`Secret ${mount}/${path} écrit (${keys.length} clé(s)) — valeurs jamais affichées.`)
}

async function deleteSecret() {
  await api('DELETE', `${mount}/data/${path}`)
  console.log(`Secret ${mount}/${path} supprimé.`)
}

switch (command) {
  case 'list':
    await listSecrets(path)
    break
  case 'read':
    await readSecret()
    break
  case 'write':
    await writeSecret()
    break
  case 'delete':
    await deleteSecret()
    break
  default:
    usage()
}
