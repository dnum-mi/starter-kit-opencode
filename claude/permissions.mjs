#!/usr/bin/env node
// Hook PreToolUse du plugin Claude Code : applique aux agents du kit leurs règles `permission` OpenCode
// (claude/permissions.json, généré par scripts/claude-plugin.mjs). Un agent de plugin ignore permissionMode
// et hooks : ce hook est le seul garde-fou par commande. Hors agent du kit, il ne dit rien.
// Sémantique OpenCode : `*` couvre tout, la dernière règle qui correspond l'emporte.
import { readFileSync } from 'node:fs'

const RULES = JSON.parse(readFileSync(new URL('permissions.json', import.meta.url), 'utf8'))
const TOOL_PERMISSION = {
  Bash: 'bash',
  Read: 'read',
  Edit: 'edit',
  MultiEdit: 'edit',
  Write: 'edit',
  NotebookEdit: 'edit',
  WebFetch: 'webfetch',
  Skill: 'skill',
  Agent: 'task',
  Task: 'task',
}
const COMMAND_SEPARATORS = /&&|\|\||;|\||\n/
const SUBSTITUTION = /\$\(|`/
const SEVERITY = { allow: 0, ask: 1, deny: 2 }

function unprefixed(name = '') {
  return name.split(':').pop()
}

function wildcard(pattern) {
  const source = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*').replaceAll('?', '.')
  // Comme OpenCode : "ls *" couvre aussi "ls" seul.
  return new RegExp(`^${source.endsWith(' .*') ? `${source.slice(0, -3)}( .*)?` : source}$`, 's')
}

function decide(rules, subject) {
  const match = rules.findLast(([pattern]) => wildcard(pattern).test(subject))
  return match?.[1] ?? 'ask'
}

function subjects(tool, input) {
  if (tool === 'Bash')
    return input.command.split(COMMAND_SEPARATORS).map(part => part.trim()).filter(Boolean)
  if (tool === 'Skill')
    return [unprefixed(input.skill)]
  if (tool === 'Agent' || tool === 'Task')
    return [unprefixed(input.subagent_type)]
  return [input.file_path ?? input.notebook_path ?? input.url ?? '']
}

function verdict(tool, input, rules) {
  const decisions = subjects(tool, input).map(subject => decide(rules, subject))
  if (tool === 'Bash' && SUBSTITUTION.test(input.command))
    decisions.push('ask')
  return decisions.reduce((worst, d) => (SEVERITY[d] > SEVERITY[worst] ? d : worst), 'allow')
}

function main(event) {
  const agent = unprefixed(event.agent_type)
  const permission = TOOL_PERMISSION[event.tool_name]
  const rules = RULES[agent]?.[permission]
  if (!rules)
    return
  const decision = verdict(event.tool_name, event.tool_input ?? {}, rules)
  const output = {
    hookEventName: 'PreToolUse',
    permissionDecision: decision,
    permissionDecisionReason: `starter-kit : règle « ${permission} » de l'agent ${agent} → ${decision}`,
  }
  process.stdout.write(JSON.stringify({ hookSpecificOutput: output }))
}

main(JSON.parse(readFileSync(0, 'utf8')))
