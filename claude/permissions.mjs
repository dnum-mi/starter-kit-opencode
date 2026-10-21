#!/usr/bin/env node
// Hook PreToolUse du plugin Claude Code : applique aux agents du kit leurs règles `permission` OpenCode
// (claude/permissions.json, généré par scripts/claude-plugin.mjs). Un agent de plugin ignore permissionMode
// et hooks : ce hook est le seul garde-fou par commande. Hors agent du kit, il ne dit rien.
// Sémantique OpenCode : `*` couvre tout, la dernière règle qui correspond l'emporte.
// Une erreur (règles illisibles, entrée invalide) bloque l'outil (code 2) : jamais de passage sans décision.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const POLICY_FILE = new URL('permissions.json', import.meta.url)
const BLOCKING_EXIT = 2
const ANY_SUFFIX = ' .*'
// Séparateurs de commandes : &&, ||, ;, |, & seul (hors redirection 2>&1) et retour à la ligne.
const COMMAND_SEPARATORS = /&&|\|\||;|\|&?|(?<![<>])&(?!>)|\n/
// Redirections sans effet sur un fichier : 2>&1, >/dev/null.
const HARMLESS_REDIRECTS = /\d*>>?\s*(?:&\d|\/dev\/null)/g
// Sous-commande ($(…), `…`, <(…)) ou redirection vers/depuis un fichier : la liste blanche n'y voit rien.
const OPAQUE_SHELL = /\$\(|`|[<>]/
const SEVERITY = { allow: 0, ask: 1, deny: 2 }
const BLANKS = /\s+/g
const MCP_TOOL = /^mcp__/

// Ce que la règle de chaque permission juge, à partir de l'entrée de l'outil.
const SUBJECTS = {
  bash: input => input.command.split(COMMAND_SEPARATORS).map(part => part.replace(BLANKS, ' ').trim()).filter(Boolean),
  skill: input => [unprefixed(input.skill)],
  task: input => [unprefixed(input.subagent_type)],
  webfetch: input => [input.url ?? input.query ?? ''],
  read: (input, cwd) => [resolve(cwd, input.file_path ?? input.path ?? '.')],
  edit: (input, cwd) => [resolve(cwd, input.file_path ?? input.notebook_path ?? '')],
}

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

function verdict(event, permission, rules) {
  const input = event.tool_input ?? {}
  const subjects = SUBJECTS[permission]
  if (!subjects)
    throw new Error(`permission « ${permission} » sans extracteur de sujet`)
  const decisions = subjects(input, event.cwd ?? process.cwd()).map(subject => decide(rules, subject))
  if (permission === 'bash' && OPAQUE_SHELL.test(input.command.replace(HARMLESS_REDIRECTS, '')))
    decisions.push('ask')
  return decisions.reduce((worst, d) => (SEVERITY[d] > SEVERITY[worst] ? d : worst), 'allow')
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
