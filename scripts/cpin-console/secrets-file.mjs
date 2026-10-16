// Création et protection du fichier de secrets, partagées par console.mjs (init) et cpin-debug/lib.mjs
// (login, saveSecret) : quel que soit le point d'entrée, les exclusions Git et Docker sont posées AVANT que
// la moindre valeur ne soit écrite, et une erreur d'écriture remonte à l'appelant.
import { readFile, writeFile, chmod, mkdir } from 'node:fs/promises'
import { basename, dirname, relative, resolve, isAbsolute } from 'node:path'

export const SECRETS_FILE = resolve(process.env.CPIN_SECRETS_FILE ?? resolve(process.cwd(), '.cpin/.env.secrets'))

async function readOrNull(file) {
  try { return await readFile(file, 'utf8') } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

// Ajoute les lignes manquantes en conservant l'existant ; renvoie les lignes réellement ajoutées.
async function ensureLines(file, wanted) {
  const current = (await readOrNull(file)) ?? ''
  const present = new Set(current.split('\n').map(line => line.trim()))
  const missing = wanted.filter(line => !present.has(line))
  if (missing.length) {
    await writeFile(file, `${current}${current && !current.endsWith('\n') ? '\n' : ''}${missing.join('\n')}\n`)
  }
  return missing
}

// Chemin du fichier relatif au projet (dossier courant), ou null s'il est hors du projet.
function projectRelative(file) {
  const rel = relative(process.cwd(), file)
  return rel && !rel.startsWith('..') && !isAbsolute(rel) ? rel.split('\\').join('/') : null
}

// Git : un .gitignore à côté du fichier, créé ou complété sans écraser les règles existantes.
// Docker : un .dockerignore à la racine du projet, même sans Dockerfile racine (docker build -f a/Dockerfile .).
// `file` : le fichier à protéger (par défaut le fichier de secrets ; aussi .cpin/instance.env).
export async function ensureExcluded(file = SECRETS_FILE) {
  const dir = dirname(file)
  await mkdir(dir, { recursive: true })
  const dedicated = basename(dir) === '.cpin'
  await ensureLines(resolve(dir, '.gitignore'), [dedicated ? '*' : basename(file)])

  const rel = projectRelative(file)
  const dockerLines = ['.cpin/']
  if (rel && !rel.startsWith('.cpin/')) dockerLines.push(rel)
  const added = await ensureLines(resolve(process.cwd(), '.dockerignore'), dockerLines)
  return { dockerAdded: added }
}

// Écrit le fichier avec le mode 0600 dès la création (pas de fenêtre en 0644 sous umask 022).
export async function writeSecretsFile(content) {
  await ensureExcluded()
  await writeFile(SECRETS_FILE, content, { encoding: 'utf8', mode: 0o600 })
  await chmod(SECRETS_FILE, 0o600)
}
