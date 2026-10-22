// Décisions du hook claude/permissions.mjs sur les règles OpenCode des agents du kit.
// Usage : node --test tests/claude/
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const HOOK = new URL('../../claude/permissions.mjs', import.meta.url).pathname
const GENERATOR = new URL('../../scripts/claude-plugin.mjs', import.meta.url).pathname
const KIT_ROOT = new URL('../..', import.meta.url).pathname

function runHook(input) {
  return spawnSync('node', [HOOK], { input, encoding: 'utf8' })
}

function decision(agent, tool, input, extra = {}) {
  const event = { hook_event_name: 'PreToolUse', agent_type: agent, tool_name: tool, tool_input: input, ...extra }
  const run = runHook(JSON.stringify(event))
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
  assert.equal(decision('dev-review', 'Bash', { command: 'ls & pnpm add left-pad' }), 'deny')
  assert.equal(decision('dev-review', 'Bash', { command: 'pnpm run lint 2>&1 | ls' }), 'allow')
  assert.equal(decision('dev-review', 'Bash', { command: 'pnpm  add\tleft-pad' }), 'deny')
})

test('autres outils : Monitor et WebSearch suivent leur règle, MCP refusé, inconnu soumis à l\'humain', () => {
  assert.equal(decision('cpin-plan', 'Monitor', { command: 'cat .cpin/.env.secrets' }), 'deny')
  assert.equal(decision('cpin-plan', 'PowerShell', { command: 'ls (Remove-Item C:\\x)' }), 'ask')
  assert.equal(decision('cpin-plan', 'WebSearch', { query: 'helm' }), 'deny')
  assert.equal(decision('cpin-plan', 'mcp__github__get_file', { path: '.env' }), 'deny')
  assert.equal(decision('cpin-plan', 'OutilInconnu', {}), 'ask')
  assert.equal(decision('cpin-orchestrateur', 'TodoWrite', { todos: [] }), 'aucune')
})

test('bash : guillemets et échappements ne contournent pas un refus', () => {
  assert.equal(decision('dev-review', 'Bash', { command: 'pnpm "add" x' }), 'deny')
  assert.equal(decision('dev-review', 'Bash', { command: "pnpm a''dd x" }), 'deny')
  assert.equal(decision('dev-review', 'Bash', { command: 'pnpm ad\\d x' }), 'deny')
  assert.equal(decision('dev-review', 'Bash', { command: 'pnpm ${X}add x' }), 'ask')
  assert.equal(decision('dev-review', 'Bash', { command: 'git log --format="$(id)"' }), 'ask')
})

test('bash : commandes réelles des agents, lues comme bash les lit', () => {
  const check = 'helm template app ./chart -f values.yaml \\\n  | uv run x/check-cpin-rules.py \\\n  --quota-cpu 2'
  assert.equal(decision('cpin-review', 'Bash', { command: check }), 'allow')
  assert.equal(decision('dev-review', 'Bash', { command: 'git log --format="%h;%s"' }), 'allow')
  const console = 'node \'/x/My Kit/scripts/cpin-console/console.mjs\' instance --set sdid'
  assert.equal(decision('cpin-orchestrateur', 'Bash', { command: console }), 'allow')
  const plan = `node /kit/scripts/cpin-console/console.mjs plan --plan '{"env":["dev"],"$x":1}'`
  assert.equal(decision('cpin-orchestrateur', 'Bash', { command: plan }), 'allow')
  assert.equal(decision('dev-review', 'Bash', { command: 'git diff HEAD~1' }), 'allow')
  assert.equal(decision('dev-verif-plan', 'Bash', { command: 'npm view zod@^3 version' }), 'allow')
  assert.equal(decision('dev-review', 'Bash', { command: 'ls ~/secrets' }), 'ask')
})

test('bash : redirection vers ou depuis un fichier → demande d\'accord', () => {
  assert.equal(decision('cpin-plan', 'Bash', { command: 'ls > .cpin/.env.secrets' }), 'ask')
  assert.equal(decision('cpin-plan', 'Bash', { command: 'ls <(cat .cpin/.env.secrets)' }), 'ask')
  assert.equal(decision('cpin-plan', 'Bash', { command: 'ls 2>/dev/null' }), 'allow')
  assert.equal(decision('dev-review', 'Bash', { command: 'ls >&1/../victim' }), 'ask')
  assert.equal(decision('dev-review', 'Bash', { command: 'ls 2>&1.txt' }), 'ask')
  assert.equal(decision('dev-review', 'Bash', { command: 'ls >/dev/null.txt' }), 'ask')
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

test('fichiers : Grep, Glob et chemins relatifs suivent la règle read', () => {
  assert.equal(decision('cpin-plan', 'Grep', { pattern: 'TOKEN', path: '/p/.cpin/.env.secrets' }), 'deny')
  assert.equal(decision('cpin-plan', 'Grep', { pattern: 'port', path: '/p/chart' }), 'allow')
  assert.equal(decision('cpin-plan', 'Read', { file_path: '.env' }, { cwd: '/p' }), 'deny')
  assert.equal(decision('cpin-plan', 'Grep', { pattern: 'T', path: '/r', glob: '**/.env.secrets' }), 'deny')
  assert.equal(decision('cpin-plan', 'Grep', { pattern: '.env.secrets', path: '/r' }), 'allow')
  assert.equal(decision('cpin-plan', 'Glob', { pattern: '**/.env', path: '/r' }), 'deny')
})

test('fichiers : un lien symbolique est jugé sur sa cible', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-'))
  t.after(() => rmSync(dir, { recursive: true }))
  writeFileSync(join(dir, '.env.secrets'), '')
  symlinkSync(join(dir, '.env.secrets'), join(dir, 'notes.txt'))
  assert.equal(decision('cpin-plan', 'Read', { file_path: join(dir, 'notes.txt') }), 'deny')
})

test('agent principal : refusé comme sous-agent, permis avec --agent', () => {
  const ls = { command: 'ls' }
  assert.equal(decision('dso:cpin-orchestrateur', 'Bash', ls, { agent_id: 'a1' }), 'deny')
  assert.equal(decision('dso:cpin-orchestrateur', 'Bash', ls), 'allow')
})

test('entrée illisible ou incomplète : outil bloqué (code 2), jamais laissé passer', () => {
  const incomplete = [
    { agent_type: 'cpin-build', tool_name: 'Edit', tool_input: {} },
    { agent_type: 'cpin-plan', tool_name: 'Skill', tool_input: {} },
    { agent_type: 'cpin-plan', tool_name: 'Bash', tool_input: {} },
  ]
  for (const input of ['pas du json', ...incomplete.map(event => JSON.stringify(event))]) {
    const run = runHook(input)
    assert.equal(run.status, 2, input)
    assert.match(run.stderr, /garde-fou des agents indisponible/)
  }
})

test('la version Claude Code est à jour de opencode/', () => {
  const run = spawnSync('node', [GENERATOR, '--check'], { cwd: KIT_ROOT, encoding: 'utf8' })
  assert.equal(run.status, 0, run.stderr)
})

test('skills et sous-agents : seuls ceux de la règle', () => {
  assert.equal(decision('cpin-plan', 'Skill', { skill: 'dso:helm-chart-cpin' }), 'allow')
  assert.equal(decision('cpin-plan', 'Skill', { skill: 'dev:outils-dev' }), 'deny')
  assert.equal(decision('cpin-orchestrateur', 'Agent', { subagent_type: 'dso:cpin-build' }), 'allow')
  assert.equal(decision('cpin-orchestrateur', 'Agent', { subagent_type: 'general-purpose' }), 'deny')
  assert.equal(decision('dev-review', 'Agent', { subagent_type: 'Explore' }), 'deny')
})
