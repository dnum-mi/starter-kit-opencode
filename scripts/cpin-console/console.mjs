#!/usr/bin/env node
// Console CPiN par son API (swagger : <console>/swagger-ui). Sans dépendance.
//
//   node console.mjs instance [--set <sdid|rie|https://console.…>] [--url ARGOCD_URL=https://…]
//                                                 plateforme cible et URL relevées (.cpin/instance.env, non secret)
//   node console.mjs init                         crée .cpin/.env.secrets (0600, valeurs vides) et .cpin/instance.env (placeholders) s'ils manquent, les exclut du .dockerignore ; dit quels noms sont renseignés
//   node console.mjs version
//   node console.mjs catalog                      stages, clusters, zones disponibles
//   node console.mjs plan  --plan '<json>'        valide le plan, n'écrit rien (aussi : apply sans --apply)
//   node console.mjs apply --plan '<json>' --apply   crée projet, environnements, dépôts, membres
//                                                 un stage « prod » exige --allow-prod (accord explicite de l'humain)
//   node console.mjs show --project <nom>          relit projet, environnements, dépôts ; n'écrit rien
//   node console.mjs secrets-list --project <nom>    NOMS des secrets du projet (jamais les valeurs)
//   node console.mjs secrets-push --project <nom> --repo <org/dépôt> [--repo …] --secret NOM=service.clé --var NOM=service.clé
//   node console.mjs pat-push --repo <org/dépôt> [--repo <org/infra>]   pose le secret GH_PAT (lu dans .env.secrets) sur chaque dépôt
//
// DSO_TOKEN (jeton API console) est lu dans <dossier courant>/.cpin/.env.secrets (0600).
// GH_USER / GH_PAT (un seul PAT GitHub fine-grained) y sont lus : GH_PAT sert à la console pour un dépôt privé
// et est posé en secret GitHub par pat-push. Aucune valeur n'est jamais affichée.
import { readFile, appendFile, writeFile } from 'node:fs/promises'
import { SECRETS_FILE, ensureExcluded, writeSecretsFile } from './secrets-file.mjs'
import { spawnSync } from 'node:child_process'
import { currentInstance, instanceEnvTemplate, instanceFileContent, INSTANCE_FILE, readInstanceText, saveInstance, URL_KEYS, withUrls } from './instance.mjs'

const CONSOLE_URL = currentInstance().urls.CONSOLE_URL
// Les jetons vivent dans le PROJET de l'humain (dossier courant), pas dans le dossier du plugin, qui est un
// cache que OpenCode peut vider. Exclusions Git et Docker : voir secrets-file.mjs.
// anciens noms, avant le PAT unique
const LEGACY = { INFRA_REPO_USER: 'GH_USER', INFRA_REPO_TOKEN: 'GH_PAT' }

// Filet de sécurité : toute sortie passe par scrub(). Les valeurs connues (.env.secrets, secrets lus dans la
// console) et les formats de jetons usuels y sont masqués, même si un message d'erreur les contenait.
const known = new Set()
const TOKEN_FORMATS = /\b(?:glptt|glpat|ghp|gho|ghs|github_pat)[-_][A-Za-z0-9_-]{8,}/g
function scrub(args) {
  return args.map((arg) => {
    if (typeof arg !== 'string') return arg
    let text = arg
    for (const value of known) text = text.split(value).join('***')
    return text.replace(TOKEN_FORMATS, '***')
  })
}
for (const method of ['log', 'error', 'warn']) {
  const original = console[method].bind(console)
  console[method] = (...args) => original(...scrub(args))
}
function remember(value) {
  if (typeof value === 'string' && value.length >= 8) known.add(value)
  else if (value && typeof value === 'object') Object.values(value).forEach(remember)
}

async function loadSecrets() {
  const secrets = {}
  try {
    for (const line of (await readFile(SECRETS_FILE, 'utf8')).split('\n')) {
      const match = line.match(/^([A-Z_]+)=(.*)$/)
      if (match) secrets[LEGACY[match[1]] ?? match[1]] ||= match[2]
    }
    remember(secrets)
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
    if (['secret', 'var', 'repo', 'url'].includes(key)) (args.multi[key] ??= []).push(next)
    else args[key] = next
  }
  return args
}

async function api(method, path, { body, query, token } = {}) {
  if (!CONSOLE_URL) fail('URL de la console inconnue pour cette instance (voir « instance »)')
  const url = new URL(`${CONSOLE_URL}/api/v1${path}`)
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v)
  const response = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { 'x-dso-token': token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }).catch((error) => {
    const reason = error.cause?.code ?? error.message
    fail(`${CONSOLE_URL} injoignable (${reason}) : réseau de l'instance accessible ?`)
  })
  const text = await response.text()
  let data = text
  try { data = JSON.parse(text) } catch {}
  if (path.endsWith('/secrets')) remember(data)
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

const PROD_WARNING = '⚠️  prod : un incident remonte des alertes au support CPiN. À réserver à un déploiement '
  + 'fonctionnel, utilisé régulièrement par des utilisateurs réels.'

const TIERS = ['prod', 'hprod']
const QUOTA_KEYS = ['cpu', 'gpu', 'memory']
const PROJECT_FIELD = { cpu: 'Cpu', gpu: 'Gpu', memory: 'Memory' }

function usedTiers(plan) {
  const stages = (plan.environments ?? []).map(env => env.stage)
  return { prod: stages.includes('prod'), hprod: stages.some(stage => stage !== 'prod') }
}

// Quota du palier (prod ou hprod) exigé seulement si un environnement l'utilise.
function checkTiers(plan, allowProd) {
  const used = usedTiers(plan)
  const errors = []
  if (used.prod && !allowProd)
    errors.push(`stage « prod » : relancer avec --allow-prod après accord explicite de l'humain. ${PROD_WARNING}`)
  for (const tier of TIERS) {
    if (!used[tier]) continue
    for (const key of QUOTA_KEYS)
      if (typeof plan.project?.[tier]?.[key] !== 'number') errors.push(`project.${tier}.${key} requis (nombre)`)
  }
  return errors
}

function validatePlan(plan, allowProd) {
  const errors = []
  const check = (kind, value) => {
    const [re, hint] = RULES[kind]
    if (!re.test(value ?? '')) errors.push(`${kind} « ${value} » invalide : ${hint}`)
  }
  check('projet', plan.project?.name)
  if ((plan.project?.description ?? '').length > 280) errors.push('description > 280 caractères')
  errors.push(...checkTiers(plan, allowProd))
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

// Un projet existant est réutilisé tel quel : ses quotas ne sont pas modifiés par apply (ex. palier prod resté
// à 0 quand on ajoute la prod à un projet dev). On s'arrête avant d'écrire plutôt que de créer un env sans quota.
function checkExistingQuotas(project, plan) {
  if (project.limitless) return
  const used = usedTiers(plan)
  const short = TIERS.filter(tier => used[tier]).flatMap(tier => QUOTA_KEYS
    .filter(key => !(Number(project[`${tier}${PROJECT_FIELD[key]}`]) >= plan.project[tier][key]))
    .map(key => `${tier}.${key} : ${project[`${tier}${PROJECT_FIELD[key]}`] ?? '?'} < ${plan.project[tier][key]}`))
  if (short.length)
    fail(`projet ${project.name} existant, quota insuffisant (non modifié par ce script) :\n- ${short.join('\n- ')}\n`
      + 'Augmenter le quota du projet dans la console CPiN, puis relancer apply.')
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

// --- commandes --------------------------------------------------------------------------------

const SECRET_NAMES = ['DSO_TOKEN', 'GH_USER', 'GH_PAT', 'GITLAB_PAT', 'ARGOCD_TOKEN', 'VAULT_TOKEN']
const OPTIONAL = new Set(['GITLAB_PAT', 'ARGOCD_TOKEN', 'VAULT_TOKEN']) // debug automatisé : GITLAB_PAT saisi, ARGOCD_TOKEN écrit par login.mjs

const commands = {
  // Crée le fichier (jamais écrasé) avec des valeurs vides ; l'humain y colle ses valeurs.
  // Ne rapporte que « renseigné » / « vide » : la valeur n'est jamais lue vers la sortie.
  async init() {
    const current = await loadSecrets()
    // Exclusions Git/Docker établies (ou réparées) à chaque init, même si le fichier existe déjà.
    const { dockerAdded } = await ensureExcluded()
    let created = false
    try {
      await readFile(SECRETS_FILE, 'utf8')
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      await writeSecretsFile(`${SECRET_NAMES.map(name => `${name}=`).join('\n')}\n`)
      created = true
    }
    if (!created) {
      // fichier créé par une version antérieure : on y ajoute les noms qui manquent (valeurs vides), sans toucher au reste
      const present = new Set((await readFile(SECRETS_FILE, 'utf8')).split('\n').map(line => line.split('=')[0]))
      const absent = SECRET_NAMES.filter(name => !present.has(name))
      if (absent.length) {
        const text = await readFile(SECRETS_FILE, 'utf8')
        await appendFile(SECRETS_FILE, `${text.endsWith('\n') ? '' : '\n'}${absent.map(name => `${name}=`).join('\n')}\n`)
        console.log(`noms ajoutés : ${absent.join(', ')}`)
      }
    }
    // .cpin/instance.env : placeholders, jamais écrasé (comme .env.secrets).
    let instanceCreated = false
    try {
      await readFile(INSTANCE_FILE, 'utf8')
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      await ensureExcluded(INSTANCE_FILE)
      await writeFile(INSTANCE_FILE, instanceEnvTemplate(), 'utf8')
      instanceCreated = true
    }
    console.log(`${created ? 'créé' : 'existant'} : ${SECRETS_FILE} (0600)`)
    console.log(`${instanceCreated ? 'créé' : 'existant'} : ${INSTANCE_FILE} (placeholders, non secret)`)
    if (instanceCreated) console.log('  → renseigner les URL relevées (console.mjs instance --url ARGOCD_URL=https://…)')
    console.log(`.dockerignore : ${dockerAdded.length ? `${dockerAdded.join(', ')} ajouté` : 'déjà à jour'}`)
    for (const name of SECRET_NAMES) console.log(`  ${name} : ${current[name] ? 'renseigné' : 'vide'}${OPTIONAL.has(name) ? ' (optionnel, debug)' : ''}`)
  },

  async version() {
    console.log(`${CONSOLE_URL} → ${JSON.stringify(await api('GET', '/version'))}`)
    // le swagger est public : on constate ce que l'API d'un dépôt accepte, on ne le suppose pas d'après la version
    try {
      const spec = await (await fetch(`${CONSOLE_URL}/swagger-ui/json`)).json()
      const schema = spec.paths?.['/api/v1/repositories']?.post?.requestBody?.content?.['application/json']?.schema
      const fields = Object.keys(schema?.properties ?? {})
      const valuesFields = fields.filter(name => /values|helm|revision|path/i.test(name))
      console.log(`réglage des fichiers values par l'API (dépôt) : ${valuesFields.length ? `oui (${valuesFields.join(', ')})` : 'non : champs du dépôt = ' + fields.join(', ')}`)
    } catch {
      console.log('réglage des fichiers values par l\'API (dépôt) : indéterminé (swagger illisible)')
    }
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
    const errors = validatePlan(plan, args['allow-prod'] === true)
    if (errors.length) fail(`plan invalide :\n- ${errors.join('\n- ')}`)
    plan.project = withTiers(plan.project)
    const { environments, errors: refErrors } = await resolveIds(plan, await requireToken())
    if (refErrors.length) fail(`plan invalide :\n- ${refErrors.join('\n- ')}`)
    describe(plan, environments)
    if (environments.some(env => env.stage === 'prod')) console.log(`\n${PROD_WARNING}`)
    console.log(args.apply ? '' : '\nSimulation : rien n\'a été créé (relancer avec --apply après accord de l\'humain).')
    return { plan, environments }
  },

  async apply(args) {
    const { plan, environments } = await commands.plan(args)
    if (!args.apply) return
    const token = await requireToken()
    const secrets = await loadSecrets()

    let [project] = await api('GET', '/projects', { token, query: { name: plan.project.name } })
    if (project) {
      checkExistingQuotas(project, plan)
      console.log(`= projet ${project.name} existe déjà (${project.id}), réutilisé`)
    }
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
      if (repo.private && !(secrets.GH_USER && secrets.GH_PAT))
        fail(`dépôt privé ${repo.name} : GH_USER et GH_PAT requis dans ${SECRETS_FILE}`)
      await api('POST', '/repositories', {
        token,
        body: {
          internalRepoName: repo.name, externalRepoUrl: repo.url, isPrivate: repo.private, isInfra: repo.infra,
          projectId: project.id,
          ...(repo.private ? { externalUserName: secrets.GH_USER, externalToken: secrets.GH_PAT } : {}),
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

    await readBack(token, project)
  },

  // Relecture seule : modes « manuel » et « déjà existant », où rien n'est créé par le script.
  async show(args) {
    const { token, project } = await projectContext(args)
    await readBack(token, project)
  },

  // Sans option : affiche l'instance courante. --set la choisit (et remet les URL à zéro), --url note une URL
  // relevée sur l'instance. Tout va dans .cpin/instance.env (non secret).
  async instance(args) {
    const valid = ({ content, error }) => (error ? fail(error) : content)
    let content = readInstanceText()
    if (args.set) content = valid(instanceFileContent(args.set))
    if (args.multi.url) content = valid(withUrls(content, args.multi.url))
    if (args.set || args.multi.url) await saveInstance(content)
    const { name, label, urls, source } = currentInstance()
    console.log(`instance : ${label} (${name}) — source : ${source}`)
    for (const key of URL_KEYS) console.log(`  ${key} : ${urls[key] ?? 'inconnue (à relever sur l\'instance)'}`)
  },

  async 'secrets-list'(args) {
    const { token, project } = await projectContext(args)
    const secrets = await api('GET', `/projects/${project.id}/secrets`, { token })
    for (const [service, entries] of Object.entries(secrets))
      console.log(`${service} : ${Object.keys(entries).join(', ') || '(vide)'}`)
  },

  async 'secrets-push'(args) {
    const { token, project } = await projectContext(args)
    const repos = args.multi.repo ?? fail('--repo <org/dépôt> requis')
    const secrets = await api('GET', `/projects/${project.id}/secrets`, { token })
    const lookup = (spec) => {
      const [name, source] = spec.split('=')
      const [service, key] = source?.split('.') ?? []
      const value = secrets[service]?.[key]
      if (!name || value === undefined) fail(`${spec} : valeur introuvable (voir secrets-list)`)
      return [name, String(value)]
    }
    for (const repo of repos) {
      for (const spec of args.multi.secret ?? []) ghSet(repo, 'secret', ...lookup(spec))
      for (const spec of args.multi.var ?? []) ghSet(repo, 'variable', ...lookup(spec))
    }
  },

  // Le PAT GitHub unique : lu dans .env.secrets, passé à `gh secret set` sur stdin, jamais affiché.
  async 'pat-push'(args) {
    const repos = args.multi.repo ?? fail('--repo <org/dépôt> requis (un par dépôt)')
    const { GH_PAT } = await loadSecrets()
    if (!GH_PAT) fail(`GH_PAT vide ou absent de ${SECRETS_FILE}`)
    for (const repo of repos) ghSet(repo, 'secret', 'GH_PAT', GH_PAT)
  },
}

// Ce que la console a réellement enregistré (unités et noms réels, ex. PROJECT_PATH Harbor).
async function readBack(token, project) {
  const final = await api('GET', `/projects/${project.id}`, { token })
  const envs = await api('GET', '/environments', { token, query: { projectId: project.id } })
  const repos = await api('GET', '/repositories', { token, query: { projectId: project.id } })
  console.log(`\nRelu dans la console (${CONSOLE_URL}) :`)
  console.log(`  projet ${final.name} · slug ${final.slug} · statut ${final.status}`)
  for (const e of envs) console.log(`  environnement ${e.name} · cpu ${e.cpu} · gpu ${e.gpu} · mémoire ${e.memory}`)
  for (const r of repos) {
    const kind = `${r.isPrivate ? 'privé' : 'public'} · ${r.isInfra ? 'infra' : 'applicatif'}`
    console.log(`  dépôt ${r.internalRepoName} · ${r.externalRepoUrl} · ${kind}`)
  }
}

function ghSet(repo, kind, name, value) {
  const result = spawnSync('gh', [kind, 'set', name, '-R', repo, ...(kind === 'variable' ? ['--body', value] : [])], {
    input: kind === 'secret' ? value : undefined, encoding: 'utf8',
  })
  if (result.status !== 0) fail(`gh ${kind} set ${name} -R ${repo} → ${result.stderr.trim().split('\n')[0]}`)
  console.log(`+ ${kind} ${name} → ${repo}`)
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
