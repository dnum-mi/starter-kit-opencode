/**
 * Plugin OpenCode du starter-kit CoFabNum.
 *
 * Installe le socle AGENTS.md puis, pour chaque groupe choisi, ses instructions, ses skills,
 * ses agents (agents/<groupe>/*.md) et ses commandes (commands/<groupe>/*.md) :
 *
 *   "plugin": [["starter-kit-opencode@git+https://github.com/dnum-mi/starter-kit-opencode.git",
 *               { "groups": ["dso"] }]]
 *
 * Ce que l'utilisateur déclare lui-même dans opencode.json (agent ou commande du même nom) l'emporte.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GROUPS_DIR = path.join(ROOT, '.agents/skills')
const DEFAULT_GROUPS = ['dev']
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/

function readMarkdown(file) {
  const match = fs.readFileSync(file, 'utf8').match(FRONTMATTER)
  if (!match)
    throw new Error(`starter-kit : frontmatter absent dans ${file}`)
  return { meta: Bun.YAML.parse(match[1]) ?? {}, body: match[2].trim() }
}

function markdownFiles(dir) {
  if (!fs.existsSync(dir))
    return []
  return fs.readdirSync(dir).filter(file => file.endsWith('.md')).sort().map(file => path.join(dir, file))
}

function addUnique(list, value) {
  if (!list.includes(value))
    list.push(value)
}

function register(target, dir, bodyKey) {
  for (const file of markdownFiles(dir)) {
    const name = path.basename(file, '.md')
    const { meta, body } = readMarkdown(file)
    target[name] = { ...meta, [bodyKey]: body, ...target[name] }
  }
}

function installGroup(config, group) {
  const skills = path.join(GROUPS_DIR, group)
  if (!fs.existsSync(path.join(skills, 'index.json')))
    throw new Error(`starter-kit : groupe inconnu '${group}' (attendu : ${fs.readdirSync(GROUPS_DIR).join(', ')})`)
  addUnique(config.instructions, path.join(skills, 'instructions.md'))
  addUnique(config.skills.paths, skills)
  register(config.agent, path.join(ROOT, 'agents', group), 'prompt')
  register(config.command, path.join(ROOT, 'commands', group), 'template')
}

export const StarterKitPlugin = async ({ client }, options = {}) => ({
  config: async (config) => {
    config.instructions ??= []
    config.skills ??= {}
    config.skills.paths ??= []
    config.agent ??= {}
    config.command ??= {}
    addUnique(config.instructions, path.join(ROOT, 'AGENTS.md'))
    // Commandes racine (ex. /feedback) dans commands/root/
    register(config.command, path.join(ROOT, 'commands', 'root'), 'template')
    for (const group of options.groups ?? DEFAULT_GROUPS)
      installGroup(config, group)
  },
  // Proposer d'ouvrir une issue de feedback quand un skill échoue
  event: async ({ event }) => {
    if (event.type !== 'session.error')
      return
    const message = event.properties.error?.message ?? ''
    // Déclenche uniquement si l'erreur mentionne un skill ou une contradiction
    if (!/skill|contradiction/i.test(message))
      return
    await client.tui.showToast({
      body: { message: 'Erreur de skill détectée — /feedback pour ouvrir une issue', variant: 'warning' },
    })
    await client.tui.appendPrompt({
      body: { text: `/feedback ${JSON.stringify(message)}` },
    })
  },
})
