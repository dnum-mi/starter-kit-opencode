#!/usr/bin/env node
// Génère ou vérifie le index.json de chaque catalogue de skills servi via `skills.urls`.
// Catalogues : un groupe par dossier de .agents/skills/ qui porte un index.json — les
// groupes peuvent être imbriqués (ex. gouv-fr/anssi, gouv-fr/interieur/code), chacun avec son index.json.
// Usage : node scripts/skills-index.mjs [--check] [<catalogue>...]
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const INDEX_FILE = 'index.json'
const SKILL_FILE = 'SKILL.md'
const GROUPS_DIR = '.agents/skills'

function listFiles(dir, root = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path, root) : [relative(root, path)]
  })
}

function skillEntry(catalog, name) {
  const files = listFiles(join(catalog, name)).sort()
  return { name, files: [SKILL_FILE, ...files.filter(file => file !== SKILL_FILE)] }
}

function buildIndex(catalog) {
  const skills = readdirSync(catalog, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(catalog, entry.name, SKILL_FILE)))
    .map(entry => skillEntry(catalog, entry.name))
    .sort((a, b) => a.name.localeCompare(b.name))
  return { skills }
}

function hasSkills(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .some(entry => entry.isDirectory() && existsSync(join(dir, entry.name, SKILL_FILE)))
}

function defaultCatalogs() {
  // Un catalogue peut être imbriqué (ex. gouv-fr/interieur/code) : on parcourt
  // l'arbre et on retient tout dossier qui contient directement des skills.
  const catalogs = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory())
        continue
      const path = join(dir, entry.name)
      if (hasSkills(path))
        catalogs.push(path)
      walk(path)
    }
  }
  walk(GROUPS_DIR)
  return catalogs.sort()
}

function normalize(index) {
  return JSON.stringify(index.skills.map(({ name, files }) => ({ name, files: [...files].sort() })))
}

function isUpToDate(catalog, expected) {
  const file = join(catalog, INDEX_FILE)
  return existsSync(file) && normalize(JSON.parse(readFileSync(file, 'utf8'))) === normalize(expected)
}

function checkCatalog(catalog) {
  const ok = isUpToDate(catalog, buildIndex(catalog))
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${catalog}/${INDEX_FILE}`)
  return ok
}

function writeCatalog(catalog) {
  writeFileSync(join(catalog, INDEX_FILE), `${JSON.stringify(buildIndex(catalog), null, 2)}\n`)
  console.log(`écrit ${catalog}/${INDEX_FILE}`)
  return true
}

const args = process.argv.slice(2)
const check = args.includes('--check')
const explicit = args.filter(arg => !arg.startsWith('--'))
const catalogs = explicit.length > 0 ? explicit : defaultCatalogs()
const results = catalogs.map(check ? checkCatalog : writeCatalog)
process.exit(results.every(Boolean) ? 0 : 1)
