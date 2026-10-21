#!/usr/bin/env node
// Génère la version Claude Code des agents et commandes OpenCode (source unique : opencode/).
// Écrit claude/agents/<groupe>/, claude/commands/<groupe>/, claude/permissions.json (lu par le hook
// claude/permissions.mjs) et les clés agents/commands des plugins de .claude-plugin/marketplace.json.
// Usage : node scripts/claude-plugin.mjs [--check]
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const SOURCE_DIR = 'opencode'
const TARGET_DIR = 'claude'
const MARKETPLACE = '.claude-plugin/marketplace.json'
const PERMISSIONS = join(TARGET_DIR, 'permissions.json')
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/
const YAML_LINE = /^( *)("[^"]*"|[^:"]+):(?: (.*))?$/
const NUMBER = /^-?\d+(?:\.\d+)?$/
// Une règle par ligne dans permissions.json : ["motif", "action"].
const RULE_ON_ONE_LINE = /\[\n\s+("[^"\n]*"),\n\s+("[^"\n]*")\n\s+\]/g
const INDENT = 2
const KIT_ROOT = /\{\{KIT_ROOT\}\}/g
const CLAUDE_ROOT = '${CLAUDE_PLUGIN_ROOT}'
const GENERATED = `# Généré par scripts/claude-plugin.mjs depuis ${SOURCE_DIR}/ : ne pas modifier.`
// Permission OpenCode refusée en bloc → outils Claude Code retirés de l'agent.
const DENIED_TOOLS = { edit: ['Write', 'Edit', 'NotebookEdit'], webfetch: ['WebFetch'], task: ['Agent'] }

function scalar(text) {
  if (text.startsWith('"'))
    return JSON.parse(text)
  return NUMBER.test(text) ? Number(text) : text
}

// Sous-ensemble YAML du frontmatter : clés, scalaires, blocs indentés de 2 espaces.
function parseYaml(lines, depth = 0) {
  const result = {}
  while (lines.length) {
    const match = lines[0].match(YAML_LINE)
    if (!match)
      throw new Error(`claude-plugin : ligne YAML non gérée : ${lines[0]}`)
    if (match[1].length < depth * INDENT)
      return result
    lines.shift()
    const key = scalar(match[2].trim())
    result[key] = match[3] === undefined ? parseYaml(lines, depth + 1) : scalar(match[3].trim())
  }
  return result
}

function readMarkdown(file) {
  const match = readFileSync(file, 'utf8').match(FRONTMATTER)
  if (!match)
    throw new Error(`claude-plugin : frontmatter absent dans ${file}`)
  return { meta: parseYaml(match[1].split('\n').filter(Boolean)), body: match[2].trim().replace(KIT_ROOT, CLAUDE_ROOT) }
}

function markdownFiles(dir) {
  if (!existsSync(dir))
    return []
  return readdirSync(dir).filter(file => file.endsWith('.md')).sort()
}

function frontmatter(fields) {
  const lines = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? JSON.stringify(value) : value}`)
  return `---\n${GENERATED}\n${lines.join('\n')}\n---\n`
}

function deniedTools(permission = {}) {
  const tools = Object.entries(DENIED_TOOLS).filter(([key]) => permission[key] === 'deny').flatMap(([, list]) => list)
  return tools.length ? tools.join(', ') : undefined
}

function agentFile(group, name, { meta, body }) {
  const primary = meta.mode === 'primary'
  const description = primary
    ? `Agent principal : à lancer avec \`claude --agent ${group}:${name}\`, jamais comme sous-agent. `
    + meta.description
    : meta.description
  const fields = { name, description, maxTurns: meta.steps, disallowedTools: deniedTools(meta.permission) }
  return `${frontmatter(fields)}\n${body}\n`
}

// Une commande dont l'agent est un agent principal du kit embarque son prompt : elle tourne dans la session.
function commandFile(name, { meta, body }, agents) {
  if (meta.subtask === 'true')
    throw new Error(`claude-plugin : commande ${name} : subtask non géré`)
  const agent = agents[meta.agent]
  const prompt = agent?.meta.mode === 'primary' ? `${agent.body}\n\n## Demande\n\n${body}` : body
  return `${frontmatter({ description: meta.description })}\n${prompt}\n`
}

// Règles normalisées : { <outil>: [[motif, action], ...] }, l'ordre OpenCode est conservé.
function permissionRules(permission = {}) {
  return Object.fromEntries(Object.entries(permission).map(([tool, rule]) =>
    [tool, typeof rule === 'string' ? [['*', rule]] : Object.entries(rule)]))
}

function groupOutputs(group) {
  const agentDir = join(SOURCE_DIR, 'agents', group)
  const agents = Object.fromEntries(markdownFiles(agentDir)
    .map(file => [file.replace(/\.md$/, ''), readMarkdown(join(agentDir, file))]))
  const commandDir = join(SOURCE_DIR, 'commands', group)
  const files = {}
  for (const [name, agent] of Object.entries(agents))
    files[join(TARGET_DIR, 'agents', group, `${name}.md`)] = agentFile(group, name, agent)
  for (const file of markdownFiles(commandDir))
    files[join(TARGET_DIR, 'commands', group, file)] = commandFile(file, readMarkdown(join(commandDir, file)), agents)
  const permissions = Object.fromEntries(Object.entries(agents)
    .map(([name, agent]) => [name, permissionRules(agent.meta.permission)]))
  return { files, permissions }
}

function sourceGroups() {
  const dirs = ['agents', 'commands'].map(kind => join(SOURCE_DIR, kind)).filter(existsSync)
  return [...new Set(dirs.flatMap(dir => readdirSync(dir)))].sort()
}

function withPluginEntries(marketplace, files) {
  const plugins = marketplace.plugins.map((plugin) => {
    const { agents: _agents, commands: _commands, ...entry } = plugin
    const agents = Object.keys(files).filter(f => f.startsWith(join(TARGET_DIR, 'agents', plugin.name, '/')))
    const commands = join(TARGET_DIR, 'commands', plugin.name)
    const hasCommands = Object.keys(files).some(f => f.startsWith(`${commands}/`))
    return {
      ...entry,
      ...(agents.length && { agents: agents.map(file => `./${file}`) }),
      ...(hasCommands && { commands: `./${commands}` }),
    }
  })
  return { ...marketplace, plugins }
}

function buildOutputs() {
  const files = {}
  const permissions = {}
  for (const group of sourceGroups()) {
    const outputs = groupOutputs(group)
    Object.assign(files, outputs.files)
    Object.assign(permissions, outputs.permissions)
  }
  files[PERMISSIONS] = `${JSON.stringify(permissions, null, 2).replace(RULE_ON_ONE_LINE, '[$1, $2]')}\n`
  const marketplace = JSON.parse(readFileSync(MARKETPLACE, 'utf8'))
  files[MARKETPLACE] = `${JSON.stringify(withPluginEntries(marketplace, files), null, 2)}\n`
  return files
}

function generatedFiles(dir) {
  if (!existsSync(dir))
    return []
  return readdirSync(dir, { recursive: true }).map(file => join(dir, file)).filter(file => file.endsWith('.md'))
}

function check(files) {
  const stale = Object.entries(files)
    .filter(([file, content]) => !existsSync(file) || readFileSync(file, 'utf8') !== content)
  const orphans = ['agents', 'commands']
    .flatMap(kind => generatedFiles(join(TARGET_DIR, kind)))
    .filter(file => !(file in files))
  for (const file of [...stale.map(([file]) => file), ...orphans])
    console.error(`à régénérer : ${file}`)
  if (stale.length || orphans.length) {
    console.error('Lancer : node scripts/claude-plugin.mjs')
    process.exit(1)
  }
  console.log(`OK   version Claude Code à jour (${Object.keys(files).length} fichiers)`)
}

function write(files) {
  for (const kind of ['agents', 'commands'])
    rmSync(join(TARGET_DIR, kind), { recursive: true, force: true })
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, content)
  }
  console.log(`${Object.keys(files).length} fichiers générés`)
}

const files = buildOutputs()
if (process.argv.includes('--check'))
  check(files)
else
  write(files)
