#!/usr/bin/env node
// Génère ou vérifie le index.json de chaque catalogue de skills servi via `skills.urls`.
// Catalogues : .agents/skills (socle) et skill-sets/<ensemble>/ (ensembles optionnels).
// Usage : node scripts/skills-index.mjs [--check] [<catalogue>...]
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const INDEX_FILE = 'index.json'
const SKILL_FILE = 'SKILL.md'
const CORE_CATALOG = '.agents/skills'
const SETS_DIR = 'skill-sets'

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

function defaultCatalogs() {
  const sets = existsSync(SETS_DIR)
    ? readdirSync(SETS_DIR, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => join(SETS_DIR, entry.name))
    : []
  return [CORE_CATALOG, ...sets]
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
