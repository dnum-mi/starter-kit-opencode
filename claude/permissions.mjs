#!/usr/bin/env node
// Hook PreToolUse du plugin Claude Code : applique aux agents du kit leurs règles `permission` OpenCode
// (claude/permissions.json, généré par scripts/claude-plugin.mjs). Un agent de plugin ignore permissionMode
// et hooks : ce hook est le seul garde-fou par commande. Hors agent du kit, il ne dit rien.
// Sémantique OpenCode : `*` couvre tout, la dernière règle qui correspond l'emporte.
// Une erreur (règles illisibles, entrée invalide) bloque l'outil (code 2) : jamais de passage sans décision.
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { resolve } from 'node:path'

const POLICY_FILE = new URL('permissions.json', import.meta.url)
const BLOCKING_EXIT = 2
const ANY_SUFFIX = ' .*'
// Séparateurs de commandes : &&, ||, ;, |, & seul (hors redirection 2>&1) et retour à la ligne.
const COMMAND_SEPARATORS = /&&|\|\||;|\|&?|(?<![<>])&(?!>)|\n/
// Redirections sans effet sur un fichier : 2>&1, >/dev/null.
const HARMLESS_REDIRECTS = /\d*>>?\s*(?:&\d\b|\/dev\/null\b)/g
// Seule une commande faite de ces caractères est autorisée sans demander : guillemets, `\`, `$`, parenthèses,
// redirections ou jokers changent ce que bash exécute, et la règle, qui lit le texte, ne le verrait pas.
const PLAIN_COMMAND = /^[\w ./:=@%+,-]*$/
const QUOTING = /["'\\]/g
const SEVERITY = { allow: 0, ask: 1, deny: 2 }
const BLANKS = /\s+/g
const MCP_TOOL = /^mcp__/
// Champ qui porte le motif de fichiers lus (le `pattern` de Grep est une regex de contenu).
const FILE_GLOB = { Glob: 'pattern', Grep: 'glob' }

function unprefixed(name = '') {
  return name.split(':').pop()
}

function wildcard(pattern) {
  const source = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*').replaceAll('?', '.')
  // Comme OpenCode : "ls *" couvre aussi "ls" seul.
  const body = source.endsWith(ANY_SUFFIX) ? `${source.slice(0, -ANY_SUFFIX.length)}( .*)?` : source
  return new RegExp(`^${body}$`, 's')
}

function decide(rules, subject) {
  const match = rules.findLast(([pattern]) => wildcard(pattern).test(subject))
  return match?.[1] ?? 'ask'
}

function worst(decisions) {
  return decisions.reduce((current, d) => (SEVERITY[d] > SEVERITY[current] ? d : current), 'allow')
}

// Un morceau de commande : refus jugé sur le texte brut et sans guillemets ; autorisation seulement si simple.
function judgeCommandPart(rules, part) {
  const unquoted = part.replace(QUOTING, '')
  return worst([decide(rules, part), decide(rules, unquoted), PLAIN_COMMAND.test(part) ? 'allow' : 'ask'])
}

function commandParts(command) {
  return command.replace(HARMLESS_REDIRECTS, '').split(COMMAND_SEPARATORS)
    .map(part => part.replace(BLANKS, ' ').trim()).filter(Boolean)
}

// Chemin absolu, lien symbolique suivi s'il existe. Un chemin absent de l'entrée est une erreur (outil bloqué).
function filePath(cwd, ...segments) {
  if (segments.some(segment => typeof segment !== 'string'))
    throw new Error('chemin absent de l\'entrée de l\'outil')
  const path = resolve(cwd, ...segments)
  return existsSync(path) ? realpathSync(path) : path
}

// Grep et Glob lisent ce que couvre leur motif de fichiers sous le dossier, pas seulement le dossier.
function readPaths(tool, input, cwd) {
  if (!(tool in FILE_GLOB))
    return [filePath(cwd, input.file_path)]
  const dir = filePath(cwd, input.path ?? '.')
  const glob = input[FILE_GLOB[tool]]
  return glob ? [dir, resolve(dir, glob)] : [dir]
}

// Ce que la règle de chaque permission juge, et comment.
const JUDGES = {
  bash: ({ input }, rules) => commandParts(input.command).map(part => judgeCommandPart(rules, part)),
  skill: ({ input }, rules) => [decide(rules, unprefixed(input.skill))],
  task: ({ input }, rules) => [decide(rules, unprefixed(input.subagent_type))],
  webfetch: ({ input }, rules) => [decide(rules, input.url ?? input.query ?? '')],
  read: ({ tool, input, cwd }, rules) => readPaths(tool, input, cwd).map(path => decide(rules, path)),
  edit: ({ input, cwd }, rules) => [decide(rules, filePath(cwd, input.file_path ?? input.notebook_path))],
}

function verdict(event, permission, rules) {
  const judge = JUDGES[permission]
  if (!judge)
    throw new Error(`permission « ${permission} » sans juge`)
  const call = { tool: event.tool_name, input: event.tool_input ?? {}, cwd: event.cwd ?? process.cwd() }
  return worst(judge(call, rules))
}

function respond(decision, reason) {
  const output = { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason }
  process.stdout.write(JSON.stringify({ hookSpecificOutput: output }))
}

function main(event) {
  if (!event.agent_type)
    return
  const policy = JSON.parse(readFileSync(POLICY_FILE, 'utf8'))
  const agent = unprefixed(event.agent_type)
  // Un agent principal lancé comme sous-agent ne pourrait pas tenir ses portes avec l'humain.
  if (policy.primary.includes(agent) && event.agent_id)
    return respond('deny', `starter-kit : ${agent} est un agent principal, à lancer avec claude --agent`)
  if (!policy.agents[agent] || policy.safe.includes(event.tool_name))
    return
  const permission = policy.tools[event.tool_name]
  if (!permission)
    return respondUnknown(agent, event.tool_name)
  const rules = policy.agents[agent][permission]
  if (!rules)
    return
  const decision = verdict(event, permission, rules)
  respond(decision, `starter-kit : règle « ${permission} » de l'agent ${agent} → ${decision}`)
}

// Outil hors de la table : MCP refusé (aucune règle OpenCode ne le couvre), le reste soumis à l'humain.
function respondUnknown(agent, tool) {
  const decision = MCP_TOOL.test(tool) ? 'deny' : 'ask'
  respond(decision, `starter-kit : outil ${tool} hors des règles de l'agent ${agent} → ${decision}`)
}

try {
  main(JSON.parse(readFileSync(0, 'utf8')))
}
catch (error) {
  console.error(`starter-kit : garde-fou des agents indisponible, outil bloqué : ${error.message}`)
  process.exit(BLOCKING_EXIT)
}
