#!/usr/bin/env node
// Génère la version Claude Code des agents et commandes OpenCode (source unique : opencode/).
// Écrit claude/agents/<groupe>/, claude/commands/<groupe>/, claude/permissions.json (lu par le hook
// claude/permissions.mjs) et, dans .claude-plugin/marketplace.json, les clés agents/commands des plugins et le
// matcher du hook des permissions. Le reste du marketplace s'écrit à la main.
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
const BOOLEANS = { true: true, false: false }
// Une règle par ligne dans permissions.json : ["motif", "action"].
const RULE_ON_ONE_LINE = /\[\n\s+("[^"\n]*"),\n\s+("[^"\n]*")\n\s+\]/g
const INDENT = 2
const KINDS = ['agents', 'commands']
const [AGENTS, COMMANDS] = KINDS
const HOOK_SCRIPT = 'claude/permissions.mjs'
const KIT_ROOT = /\{\{KIT_ROOT\}\}/g
const CLAUDE_ROOT = '${CLAUDE_PLUGIN_ROOT}'
const GENERATED = `# Généré par scripts/claude-plugin.mjs depuis ${SOURCE_DIR}/ : ne pas modifier.`
// Outil Claude Code → permission OpenCode qui le gouverne. Seule table : règles du hook et disallowedTools
// (permission refusée en bloc) en découlent. Le hook voit passer tous les outils (matcher `*`).
const TOOL_PERMISSION = {
  Bash: 'bash',
  Monitor: 'bash',
  Read: 'read',
  Grep: 'read',
  Glob: 'read',
  Edit: 'edit',
  MultiEdit: 'edit',
  Write: 'edit',
  NotebookEdit: 'edit',
  WebFetch: 'webfetch',
  WebSearch: 'webfetch',
  Skill: 'skill',
  Agent: 'task',
  Task: 'task',
}
// Outils sans effet hors de la session (suivi, recherche d'outils, reprise d'un sous-agent) : laissés libres.
// Tout autre outil absent de TOOL_PERMISSION demande l'accord (PowerShell : sa syntaxe n'est pas celle des règles
// bash), et un outil MCP est refusé aux agents du kit.
const SAFE_TOOLS = ['TodoWrite', 'TaskCreate', 'TaskUpdate', 'TaskList', 'TaskGet', 'ToolSearch', 'SendMessage']
const HOOK_MATCHER = '*'
const ERROR_PREFIX = 'claude-plugin :'

function scalar(text) {
  if (text.startsWith('"'))
    return JSON.parse(text)
  if (text in BOOLEANS)
    return BOOLEANS[text]
  return NUMBER.test(text) ? Number(text) : text
}

// Sous-ensemble YAML du frontmatter : clés, scalaires, blocs indentés de 2 espaces.
function parseYaml(lines, depth = 0) {
  const result = {}
  while (lines.length) {
    const match = lines[0].match(YAML_LINE)
    if (!match)
      throw new Error(`${ERROR_PREFIX} ligne YAML non gérée : ${lines[0]}`)
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
    throw new Error(`${ERROR_PREFIX} frontmatter absent dans ${file}`)
  return { meta: parseYaml(match[1].split('\n').filter(Boolean)), body: match[2].trim().replace(KIT_ROOT, CLAUDE_ROOT) }
}

function markdownFiles(dir, { recursive } = { recursive: false }) {
  if (!existsSync(dir))
    return []
  return readdirSync(dir, { recursive }).filter(file => file.endsWith('.md')).sort()
}

function frontmatter(fields) {
  const lines = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? JSON.stringify(value) : value}`)
  return `---\n${GENERATED}\n${lines.join('\n')}\n---\n`
}

function deniedTools(permission = {}) {
  const tools = Object.keys(TOOL_PERMISSION).filter(tool => permission[TOOL_PERMISSION[tool]] === 'deny')
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
  if (meta.subtask === true)
    throw new Error(`${ERROR_PREFIX} commande ${name} : subtask non géré`)
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
  const agentDir = join(SOURCE_DIR, AGENTS, group)
  const agents = Object.fromEntries(markdownFiles(agentDir)
    .map(file => [file.replace(/\.md$/, ''), readMarkdown(join(agentDir, file))]))
  const commandDir = join(SOURCE_DIR, COMMANDS, group)
  const files = {}
  for (const [name, agent] of Object.entries(agents))
    files[join(TARGET_DIR, AGENTS, group, `${name}.md`)] = agentFile(group, name, agent)
  for (const file of markdownFiles(commandDir))
    files[join(TARGET_DIR, COMMANDS, group, file)] = commandFile(file, readMarkdown(join(commandDir, file)), agents)
  const permissions = Object.fromEntries(Object.entries(agents)
    .map(([name, agent]) => [name, permissionRules(agent.meta.permission)]))
  const primary = Object.keys(agents).filter(name => agents[name].meta.mode === 'primary')
  return { files, permissions, primary }
}

function sourceGroups() {
  const dirs = KINDS.map(kind => join(SOURCE_DIR, kind)).filter(existsSync)
  return [...new Set(dirs.flatMap(dir => readdirSync(dir)))].sort()
}

// Le hook des permissions doit voir passer tous les outils, pour refuser ou faire valider ceux qu'il ne connaît pas.
function withHookMatcher(hooks = {}) {
  const preToolUse = hooks.PreToolUse?.map(group =>
    group.hooks.some(hook => hook.command?.includes(HOOK_SCRIPT))
      ? { ...group, matcher: HOOK_MATCHER }
      : group)
  return preToolUse ? { ...hooks, PreToolUse: preToolUse } : hooks
}

function withPluginEntries(marketplace, files) {
  const inside = dir => Object.keys(files).filter(file => file.startsWith(`${dir}/`))
  const plugins = marketplace.plugins.map((plugin) => {
    const { agents: _agents, commands: _commands, ...entry } = plugin
    const agents = inside(join(TARGET_DIR, AGENTS, plugin.name))
    const commands = join(TARGET_DIR, COMMANDS, plugin.name)
    const hasCommands = inside(commands).length > 0
    return {
      ...entry,
      ...(entry.hooks && { hooks: withHookMatcher(entry.hooks) }),
      ...(agents.length && { agents: agents.map(file => `./${file}`) }),
      ...(hasCommands && { commands: `./${commands}` }),
    }
  })
  return { ...marketplace, plugins }
}

function json(value) {
  return `${JSON.stringify(value, null, INDENT)}\n`
}

function buildOutputs() {
  const files = {}
  const policy = { tools: TOOL_PERMISSION, safe: SAFE_TOOLS, primary: [], agents: {} }
  for (const group of sourceGroups()) {
    const outputs = groupOutputs(group)
    Object.assign(files, outputs.files)
    Object.assign(policy.agents, outputs.permissions)
    policy.primary.push(...outputs.primary)
  }
  files[PERMISSIONS] = json(policy).replace(RULE_ON_ONE_LINE, '[$1, $2]')
  const marketplace = JSON.parse(readFileSync(MARKETPLACE, 'utf8'))
  files[MARKETPLACE] = json(withPluginEntries(marketplace, files))
  return files
}

function check(files) {
  const stale = Object.entries(files)
    .filter(([file, content]) => !existsSync(file) || readFileSync(file, 'utf8') !== content)
  const orphans = KINDS.map(kind => join(TARGET_DIR, kind))
    .flatMap(dir => markdownFiles(dir, { recursive: true }).map(file => join(dir, file)))
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
  for (const kind of KINDS)
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
