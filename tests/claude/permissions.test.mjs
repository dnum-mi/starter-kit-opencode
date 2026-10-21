// Décisions du hook claude/permissions.mjs sur les règles OpenCode des agents du kit.
// Usage : node --test tests/claude/
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

const HOOK = new URL('../../claude/permissions.mjs', import.meta.url).pathname

function decision(agent, tool, input) {
  const event = { hook_event_name: 'PreToolUse', agent_type: agent, tool_name: tool, tool_input: input }
  const run = spawnSync('node', [HOOK], { input: JSON.stringify(event), encoding: 'utf8' })
  assert.equal(run.status, 0, run.stderr)
  return run.stdout ? JSON.parse(run.stdout).hookSpecificOutput.permissionDecision : 'aucune'
}

test('hors agent du kit, le hook ne dit rien', () => {
  assert.equal(decision(undefined, 'Bash', { command: 'rm -rf build' }), 'aucune')
  assert.equal(decision('general-purpose', 'Read', { file_path: '/p/.env' }), 'aucune')
})

test('bash : liste blanche, dernière règle gagnante, préfixe du plugin ignoré', () => {
  assert.equal(decision('dev:dev-review', 'Bash', { command: 'pnpm run typecheck' }), 'allow')
  assert.equal(decision('dev:dev-review', 'Bash', { command: 'pnpm add left-pad' }), 'deny')
  assert.equal(decision('dev-review', 'Bash', { command: 'curl https://example.org' }), 'deny')
  assert.equal(decision('dso:cpin-plan', 'Bash', { command: 'ls' }), 'allow')
})

test('bash : chaque morceau d\'une commande composée est vérifié', () => {
  assert.equal(decision('dev-review', 'Bash', { command: 'git diff && rm -rf src' }), 'deny')
  assert.equal(decision('dev-review', 'Bash', { command: 'git status; git log -1' }), 'allow')
  assert.equal(decision('dev-review', 'Bash', { command: 'ls $(cat .env)' }), 'ask')
})

test('bash : demande d\'accord quand la règle OpenCode vaut ask', () => {
  const apply = 'node /kit/scripts/cpin-console/console.mjs apply --apply'
  assert.equal(decision('cpin-orchestrateur', 'Bash', { command: apply }), 'ask')
  const plan = 'node /kit/scripts/cpin-console/console.mjs plan'
  assert.equal(decision('cpin-orchestrateur', 'Bash', { command: plan }), 'allow')
})

test('fichiers : secrets illisibles, écriture refusée aux agents en lecture seule', () => {
  assert.equal(decision('cpin-build', 'Read', { file_path: '/p/.cpin/.env.secrets' }), 'deny')
  assert.equal(decision('cpin-build', 'Read', { file_path: '/p/chart/values.yaml' }), 'allow')
  assert.equal(decision('cpin-build', 'Write', { file_path: '/p/.env' }), 'deny')
  assert.equal(decision('cpin-build', 'Edit', { file_path: '/p/chart/values.yaml' }), 'allow')
  assert.equal(decision('cpin-plan', 'Edit', { file_path: '/p/chart/values.yaml' }), 'deny')
})

test('skills et sous-agents : seuls ceux de la règle', () => {
  assert.equal(decision('cpin-plan', 'Skill', { skill: 'dso:helm-chart-cpin' }), 'allow')
  assert.equal(decision('cpin-plan', 'Skill', { skill: 'dev:outils-dev' }), 'deny')
  assert.equal(decision('cpin-orchestrateur', 'Agent', { subagent_type: 'dso:cpin-build' }), 'allow')
  assert.equal(decision('cpin-orchestrateur', 'Agent', { subagent_type: 'general-purpose' }), 'deny')
  assert.equal(decision('dev-review', 'Agent', { subagent_type: 'Explore' }), 'deny')
})
