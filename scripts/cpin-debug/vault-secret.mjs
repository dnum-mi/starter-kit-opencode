import { loadSecrets } from './lib.mjs'

// Gestion des secrets Vault via l'API (kv-v2). Lit VAULT_TOKEN dans .cpin/.env.secrets.
// Usage (depuis le dossier du projet) :
//   node vault-secret.mjs list <mount> [prefix]
//   node vault-secret.mjs read <mount>/<path>
//   node vault-secret.mjs write <mount>/<path> KEY1 KEY2 ... [--dry-run] [--yes]
//   node vault-secret.mjs delete <mount>/<path> [--dry-run] [--yes]
// write : les valeurs sont lues dans les variables d'environnement du même nom (jamais en argument,
//         jamais affichées). PATCH merge-patch : ne remplace que les clés fournies.
// write/delete : simulation avec --dry-run, exécution uniquement avec --yes explicite.
// read : métadonnées uniquement (versions, dates) — aucune valeur lue.

const VAULT_URL = process.env.VAULT_URL ?? 'https://vault.sdid.cpin.numerique-interieur.com'

const [command, secretPath, ...rest] = process.argv.slice(2)
const dryRun = rest.includes('--dry-run')
const yes = rest.includes('--yes')
const keys = rest.filter((a) => !a.startsWith('--'))

function usage() {
  console.error('Usage : node vault-secret.mjs <list|read|write|delete> <mount>/<path> [KEY ...] [--dry-run] [--yes]')
  process.exit(1)
}

if (!command || !secretPath) usage()
const [mount, ...pathParts] = secretPath.split('/')
if (!mount) usage()
const path = pathParts.join('/')
if (command !== 'list' && pathParts.length === 0) usage()

const secrets = await loadSecrets()
if (!secrets.VAULT_TOKEN) {
  console.error('VAULT_TOKEN manquant dans .cpin/.env.secrets — lance d\'abord vault-login.mjs.')
  process.exit(1)
}
const token = secrets.VAULT_TOKEN

async function api(method, urlPath, body, contentType) {
  const response = await fetch(`${VAULT_URL}/v1/${urlPath}`, {
    method,
    headers: {
      'X-Vault-Token': token,
      ...(body ? { 'Content-Type': contentType ?? 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    const text = await response.text()
    const error = new Error(`Vault ${method} ${urlPath} → ${response.status} : ${text.slice(0, 300)}`)
    error.status = response.status
    throw error
  }
  return response.status === 204 ? null : response.json()
}

async function listSecrets(prefix) {
  const urlPath = prefix ? `${mount}/metadata/${prefix}?list=true` : `${mount}/metadata?list=true`
  let data
  try {
    data = await api('GET', urlPath)
  } catch (error) {
    if (error.status === 404) {
      console.log(`Aucun secret sous ${mount}/${prefix}.`)
      return
    }
    throw error
  }
  const found = data?.data?.keys ?? []
  if (found.length === 0) {
    console.log(`Aucun secret sous ${mount}/${prefix}.`)
    return
  }
  console.log(`Secrets sous ${mount}/${prefix} :`)
  for (const key of found) console.log(`  ${key}`)
}

async function readSecret() {
  let data
  try {
    data = await api('GET', `${mount}/metadata/${path}`)
  } catch (error) {
    if (error.status === 404) {
      console.log(`Secret ${mount}/${path} : inexistant.`)
      return
    }
    throw error
  }
  const meta = data?.data ?? {}
  const versions = Object.keys(meta.versions ?? {}).length
  console.log(`Secret ${mount}/${path} : ${versions} version(s), dernière ${meta.current_version ?? '?'} (${meta.created_time ?? '?'}).`)
  console.log('Noms de clés : voir l\'UI Vault (la lecture des valeurs est exclue).')
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
  console.log(`Écriture ${mount}/${path} : ${keys.join(', ')}`)
  if (dryRun) {
    console.log('Simulation (--dry-run) : aucune écriture effectuée.')
    return
  }
  if (!yes) {
    console.error('Confirme avec --yes pour exécuter.')
    process.exit(1)
  }
  try {
    await api('PATCH', `${mount}/data/${path}`, { data }, 'application/merge-patch+json')
  } catch (error) {
    if (error.status === 404) {
      await api('POST', `${mount}/data/${path}`, { data })
    } else {
      throw error
    }
  }
  console.log(`Secret ${mount}/${path} écrit (${keys.length} clé(s)) — valeurs jamais affichées.`)
}

async function deleteSecret() {
  console.log(`Suppression complète de ${mount}/${path} (toutes versions).`)
  if (dryRun) {
    console.log('Simulation (--dry-run) : aucune suppression effectuée.')
    return
  }
  if (!yes) {
    console.error('Confirme avec --yes pour exécuter.')
    process.exit(1)
  }
  await api('DELETE', `${mount}/metadata/${path}`)
  console.log(`Secret ${mount}/${path} supprimé.`)
}

try {
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
} catch (error) {
  console.error(`Erreur : ${error.message}`)
  process.exit(1)
}
