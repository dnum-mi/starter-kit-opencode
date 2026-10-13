#!/usr/bin/env node
// Console CPiN par son API (swagger : <console>/swagger-ui). Sans dépendance.
//
//   node console.mjs init                         crée .env.secrets (0600, valeurs vides) s'il manque, dit quels noms sont renseignés
//   node console.mjs version
//   node console.mjs catalog                      stages, clusters, zones disponibles
//   node console.mjs plan  --plan '<json>'        valide le plan, n'écrit rien (aussi : apply sans --apply)
//   node console.mjs apply --plan '<json>' --apply   crée projet, environnements, dépôts, membres
//   node console.mjs secrets-list --project <nom>    NOMS des secrets du projet (jamais les valeurs)
//   node console.mjs secrets-push --project <nom> --repo <org/dépôt> --secret NOM=service.clé --var NOM=service.clé
//
// DSO_TOKEN (jeton API console) est lu dans scripts/cpin-console/.env.secrets (0600).
// INFRA_REPO_USER / INFRA_REPO_TOKEN y sont lus pour un dépôt privé. Aucune valeur n'est jamais affichée.
import { readFile, writeFile, chmod } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const CONSOLE_URL = process.env.CONSOLE_URL ?? 'https://console.sdid.cpin.numerique-interieur.com'
const SECRETS_FILE = resolve(import.meta.dirname, '.env.secrets')

async function loadSecrets() {
  const secrets = {}
  try {
    for (const line of (await readFile(SECRETS_FILE, 'utf8')).split('\n')) {
      const match = line.match(/^([A-Z_]+)=(.*)$/)
      if (match) secrets[match[1]] = match[2]
    }
  } catch {}
  return secrets
}

function fail(message) {
  console.error(`ERREUR : ${message}`)
  process.exit(1)
}

function parseArgs(argv) {
  const args = { _: [], multi: {} }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) { args._.push(arg); continue }
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) { args[key] = true; continue }
    i++
    if (key === 'secret' || key === 'var') (args.multi[key] ??= []).push(next)
    else args[key] = next
  }
  return args
}

async function api(method, path, { body, query, token } = {}) {
  const url = new URL(`${CONSOLE_URL}/api/v1${path}`)
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v)
  const response = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { 'x-dso-token': token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let data = text
  try { data = JSON.parse(text) } catch {}
  if (!response.ok) {
    // le message d'erreur de la console ne contient pas de valeur de secret ; on n'affiche jamais le corps envoyé
    fail(`${method} ${path} → ${response.status} ${typeof data === 'string' ? data.slice(0, 300) : JSON.stringify(data.message ?? data.error ?? data).slice(0, 300)}`)
  }
  return data
}

async function requireToken() {
  const { DSO_TOKEN } = await loadSecrets()
  if (!DSO_TOKEN) fail(`DSO_TOKEN vide ou absent de ${SECRETS_FILE} (lancer « init », puis y coller le jeton API : console > profil > jetons)`)
  return DSO_TOKEN
}

// --- validation du plan, d'après le swagger 9.9.0 ---------------------------------------------

const RULES = {
  projet: [/^[a-z0-9]{2,20}$/, '2 à 20 caractères, [a-z0-9] uniquement'],
  environnement: [/^[a-z0-9]{2,11}$/, '2 à 11 caractères, [a-z0-9] uniquement'],
  dépôt: [/^[a-z0-9][a-z0-9-]{0,18}[a-z0-9]$/, '2 à 20 caractères, [a-z0-9-], ni début ni fin par « - »'],
}

function validatePlan(plan) {
  const errors = []
  const check = (kind, value) => {
    const [re, hint] = RULES[kind]
    if (!re.test(value ?? '')) errors.push(`${kind} « ${value} » invalide : ${hint}`)
  }
  check('projet', plan.project?.name)
  if ((plan.project?.description ?? '').length > 280) errors.push('description > 280 caractères')
  // Prod : pas encore pris en charge. Le palier prod part à 0 (withTiers) et un stage « prod » est refusé.
  // À réactiver le jour où la prod est visée :
  // const used = { prod: stages.includes('prod'), hprod: stages.some(stage => stage !== 'prod') }
  // puis exiger project.prod.{cpu,gpu,memory} quand used.prod (et hprod seulement quand used.hprod).
  for (const key of ['cpu', 'gpu', 'memory'])
    if (typeof plan.project?.hprod?.[key] !== 'number') errors.push(`project.hprod.${key} requis (nombre)`)
  if (plan.project?.prod) errors.push('project.prod : la prod n\'est pas encore prise en charge')
  if ((plan.environments ?? []).some(env => env.stage === 'prod'))
    errors.push('stage « prod » : la prod n\'est pas encore prise en charge')
  if (!plan.environments?.length) errors.push('au moins un environnement requis')
  for (const env of plan.environments ?? []) {
    check('environnement', env.name)
    for (const key of ['stage', 'cluster']) if (!env[key]) errors.push(`environnement ${env.name} : ${key} requis`)
    for (const key of ['cpu', 'gpu', 'memory'])
      if (typeof env[key] !== 'number') errors.push(`environnement ${env.name} : ${key} requis (nombre)`)
  }
  for (const repo of plan.repositories ?? []) {
    check('dépôt', repo.name)
    if (!/^https:\/\/.*\.git$/.test(repo.url ?? '')) errors.push(`dépôt ${repo.name} : url https://….git requise`)
    if (typeof repo.private !== 'boolean' || typeof repo.infra !== 'boolean')
      errors.push(`dépôt ${repo.name} : private et infra requis (booléens)`)
  }
  return errors
}

async function resolveIds(plan, token) {
  const [stages, clusters] = await Promise.all([api('GET', '/stages', { token }), api('GET', '/clusters', { token })])
  if (!Array.isArray(stages) || !Array.isArray(clusters)) fail('réponse inattendue de la console : DSO_TOKEN invalide ou expiré ?')
  const errors = []
  const environments = plan.environments.map((env) => {
    const stage = stages.find(s => s.name === env.stage)
    const cluster = clusters.find(c => c.label === env.cluster)
    if (!stage) errors.push(`stage « ${env.stage} » inconnu (disponibles : ${stages.map(s => s.name).join(', ')})`)
    if (!cluster) errors.push(`cluster « ${env.cluster} » inconnu (disponibles : ${clusters.map(c => c.label).join(', ')})`)
    else if (stage && !stage.clusterIds.includes(cluster.id))
      errors.push(`cluster « ${env.cluster} » non autorisé pour le stage « ${env.stage} »`)
    return { ...env, stageId: stage?.id, clusterId: cluster?.id }
  })
  return { environments, errors }
}

const ZERO = { cpu: 0, gpu: 0, memory: 0 }

function withTiers(project) {
  return { ...project, hprod: { ...ZERO, ...project.hprod }, prod: { ...ZERO, ...project.prod } }
}

function describe(plan, environments) {
  const p = plan.project
  console.log(`Projet        ${p.name} — « ${p.description ?? ''} » (limitless: ${Boolean(p.limitless)})`)
  console.log(`  quota hprod  cpu ${p.hprod.cpu} · gpu ${p.hprod.gpu} · mémoire ${p.hprod.memory}`)
  console.log(`  quota prod   cpu ${p.prod.cpu} · gpu ${p.prod.gpu} · mémoire ${p.prod.memory}`)
  for (const e of environments)
    console.log(`Environnement ${e.name} — stage ${e.stage}, cluster ${e.cluster}, cpu ${e.cpu} · gpu ${e.gpu} · mémoire ${e.memory}`)
  for (const r of plan.repositories ?? [])
    console.log(`Dépôt         ${r.name} — ${r.url} (${r.private ? 'privé' : 'public'}, ${r.infra ? 'infra' : 'applicatif'})`)
  for (const m of plan.members ?? []) console.log(`Membre        ${m.email}`)
}

// --- commandes --------------------------------------------------------------------------------

const SECRET_NAMES = ['DSO_TOKEN', 'INFRA_REPO_USER', 'INFRA_REPO_TOKEN']

const commands = {
  // Crée le fichier (jamais écrasé) avec des valeurs vides ; l'humain y colle ses valeurs.
  // Ne rapporte que « renseigné » / « vide » : la valeur n'est jamais lue vers la sortie.
  async init() {
    const current = await loadSecrets()
    let created = false
    try {
      await readFile(SECRETS_FILE, 'utf8')
    } catch {
      await writeFile(SECRETS_FILE, `${SECRET_NAMES.map(name => `${name}=`).join('\n')}\n`, { mode: 0o600 })
      created = true
    }
    await chmod(SECRETS_FILE, 0o600)
    console.log(`${created ? 'créé' : 'existant'} : ${SECRETS_FILE} (0600)`)
    for (const name of SECRET_NAMES) console.log(`  ${name} : ${current[name] ? 'renseigné' : 'vide'}`)
  },

  async version() {
    console.log(`${CONSOLE_URL} → ${JSON.stringify(await api('GET', '/version'))}`)
  },

  async catalog() {
    const token = await requireToken()
    const [stages, clusters, zones] = await Promise.all(
      ['/stages', '/clusters', '/zones'].map(path => api('GET', path, { token })),
    )
    console.log('stages   :', stages.map(s => s.name).join(', '))
    console.log('clusters :', clusters.map(c => `${c.label}${c.infos ? ` (${c.infos})` : ''}`).join(', '))
    console.log('zones    :', zones.map(z => z.slug).join(', '))
  },

  async plan(args) {
    const plan = parseJson(args.plan)
    const errors = validatePlan(plan)
    if (errors.length) fail(`plan invalide :\n- ${errors.join('\n- ')}`)
    plan.project = withTiers(plan.project)
    const { environments, errors: refErrors } = await resolveIds(plan, await requireToken())
    if (refErrors.length) fail(`plan invalide :\n- ${refErrors.join('\n- ')}`)
    describe(plan, environments)
    console.log(args.apply ? '' : '\nSimulation : rien n\'a été créé (relancer avec --apply après accord de l\'humain).')
    return { plan, environments }
  },

  async apply(args) {
    const { plan, environments } = await commands.plan(args)
    if (!args.apply) return
    const token = await requireToken()
    const secrets = await loadSecrets()

    let [project] = await api('GET', '/projects', { token, query: { name: plan.project.name } })
    if (project) console.log(`= projet ${project.name} existe déjà (${project.id}), réutilisé`)
    else {
      const p = plan.project
      project = await api('POST', '/projects', {
        token,
        body: {
          name: p.name, description: p.description ?? '', limitless: Boolean(p.limitless),
          hprodCpu: p.hprod.cpu, hprodGpu: p.hprod.gpu, hprodMemory: p.hprod.memory,
          prodCpu: p.prod.cpu, prodGpu: p.prod.gpu, prodMemory: p.prod.memory,
        },
      })
      console.log(`+ projet ${project.name} créé (${project.id})`)
    }

    const existingEnvs = await api('GET', '/environments', { token, query: { projectId: project.id } })
    for (const env of environments) {
      if (existingEnvs.some(e => e.name === env.name)) { console.log(`= environnement ${env.name} existe déjà`); continue }
      await api('POST', '/environments', {
        token,
        body: { name: env.name, projectId: project.id, stageId: env.stageId, clusterId: env.clusterId, cpu: env.cpu, gpu: env.gpu, memory: env.memory },
      })
      console.log(`+ environnement ${env.name} créé`)
    }

    const existingRepos = await api('GET', '/repositories', { token, query: { projectId: project.id } })
    for (const repo of plan.repositories ?? []) {
      if (existingRepos.some(r => r.internalRepoName === repo.name)) { console.log(`= dépôt ${repo.name} existe déjà`); continue }
      if (repo.private && !(secrets.INFRA_REPO_USER && secrets.INFRA_REPO_TOKEN))
        fail(`dépôt privé ${repo.name} : INFRA_REPO_USER et INFRA_REPO_TOKEN requis dans ${SECRETS_FILE}`)
      await api('POST', '/repositories', {
        token,
        body: {
          internalRepoName: repo.name, externalRepoUrl: repo.url, isPrivate: repo.private, isInfra: repo.infra,
          projectId: project.id,
          ...(repo.private ? { externalUserName: secrets.INFRA_REPO_USER, externalToken: secrets.INFRA_REPO_TOKEN } : {}),
        },
      })
      console.log(`+ dépôt ${repo.name} créé`)
    }

    const members = await api('GET', `/projects/${project.id}/members`, { token })
    for (const { email } of plan.members ?? []) {
      if (members.some(m => m.email === email)) { console.log(`= membre ${email} existe déjà`); continue }
      await api('POST', `/projects/${project.id}/members`, { token, body: { email } })
      console.log(`+ membre ${email} ajouté`)
    }

    // relecture : ce que la console a réellement enregistré (unités et noms réels, ex. PROJECT_PATH Harbor)
    const final = await api('GET', `/projects/${project.id}`, { token })
    const envs = await api('GET', '/environments', { token, query: { projectId: project.id } })
    console.log('\nRelu dans la console :')
    console.log(`  projet ${final.name} · slug ${final.slug} · statut ${final.status}`)
    for (const e of envs) console.log(`  environnement ${e.name} · cpu ${e.cpu} · gpu ${e.gpu} · mémoire ${e.memory}`)
  },

  async 'secrets-list'(args) {
    const { token, project } = await projectContext(args)
    const secrets = await api('GET', `/projects/${project.id}/secrets`, { token })
    for (const [service, entries] of Object.entries(secrets))
      console.log(`${service} : ${Object.keys(entries).join(', ') || '(vide)'}`)
  },

  async 'secrets-push'(args) {
    const { token, project } = await projectContext(args)
    if (!args.repo) fail('--repo <org/dépôt> requis')
    const secrets = await api('GET', `/projects/${project.id}/secrets`, { token })
    const lookup = (spec) => {
      const [name, source] = spec.split('=')
      const [service, key] = source?.split('.') ?? []
      const value = secrets[service]?.[key]
      if (!name || value === undefined) fail(`${spec} : valeur introuvable (voir secrets-list)`)
      return [name, String(value)]
    }
    const gh = (kind, name, value) => {
      const result = spawnSync('gh', [kind, 'set', name, '-R', args.repo, ...(kind === 'variable' ? ['--body', value] : [])], {
        input: kind === 'secret' ? value : undefined, encoding: 'utf8',
      })
      if (result.status !== 0) fail(`gh ${kind} set ${name} → ${result.stderr.trim().split('\n')[0]}`)
      console.log(`+ ${kind} ${name} → ${args.repo}`)
    }
    for (const spec of args.multi.secret ?? []) gh('secret', ...lookup(spec))
    for (const spec of args.multi.var ?? []) gh('variable', ...lookup(spec))
  },
}

function parseJson(text) {
  try { return JSON.parse(text) } catch { fail('--plan attend un JSON valide') }
}

async function projectContext(args) {
  if (!args.project) fail('--project <nom> requis')
  const token = await requireToken()
  const [project] = await api('GET', '/projects', { token, query: { name: args.project } })
  if (!project) fail(`projet « ${args.project} » introuvable`)
  return { token, project }
}

const args = parseArgs(process.argv.slice(2))
const command = commands[args._[0]]
if (!command) fail(`commande attendue : ${Object.keys(commands).join(' | ')}`)
await command(args)
