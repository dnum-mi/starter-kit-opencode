# Debug automatisé des services CPiN — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Industrialiser le POC Playwright (issue #39) en scripts de debug réutilisables des services internes CPiN : tableau des URLs d'instances, stockage sécurisé des tokens (`.env.secrets` 0600), un script de check par service, et intégration d'un login Playwright **optionnel** dans le runbook `deploiement-cpin`.

**Architecture:** Quatre groupes de tâches indépendants et séquentiels — (1) doc URLs, (2) scripts `scripts/cpin-debug/`, (3) règle de permission `opencode.jsonc`, (4) mise à jour du runbook. Le "test" est la vérification syntaxique (`node --check`), l'exécution manuelle des scripts (statuts HTTP, jamais les tokens) et la validation JSONC.

**Tech Stack:** Node.js (ESM, `.mjs`), Playwright (Firefox), Markdown, JSONC, shell pour vérification.

**Spec:** `docs/superpowers/specs/2026-10-09-cpin-debug-services-design.md`

---

## File Map

| Action | Fichier |
|--------|---------|
| Créer | `docs/okf/cloud-pi-native/urls-instances.md` |
| Modifier | `docs/okf/cloud-pi-native/index.md` |
| Créer | `scripts/cpin-debug/package.json` |
| Créer | `scripts/cpin-debug/.gitignore` |
| Créer | `scripts/cpin-debug/.env.secrets` (vide, 0600, gitignoré — non commité) |
| Créer | `scripts/cpin-debug/lib.mjs` (helpers partagés) |
| Créer | `scripts/cpin-debug/login.mjs` |
| Créer | `scripts/cpin-debug/check-argocd.mjs` |
| Créer | `scripts/cpin-debug/check-harbor.mjs` |
| Créer | `scripts/cpin-debug/check-gitlab.mjs` |
| Créer | `scripts/cpin-debug/check-console.mjs` |
| Modifier | `opencode.jsonc` |
| Modifier | `.agents/skills/dso/deploiement-cpin/SKILL.md` |

> Note : `lib.mjs` est un ajout au fichier listé dans la spec — helper partagé (chargement des secrets, masquage, check HTTP) pour éviter la duplication entre les 5 scripts. Le reste suit la spec à la lettre.

---

### Task 1 : Documenter les URLs des instances

**Files:**
- Create: `docs/okf/cloud-pi-native/urls-instances.md`
- Modify: `docs/okf/cloud-pi-native/index.md`

- [ ] **Step 1 : Vérifier le dossier cible**

```bash
ls docs/okf/cloud-pi-native/
```

Résultat attendu : `index.md` présent, pas de `urls-instances.md`.

- [ ] **Step 2 : Créer `urls-instances.md`**

Créer `docs/okf/cloud-pi-native/urls-instances.md` avec le contenu suivant :

```markdown
# URLs des instances

Tableau des URLs des services internes par instance. Les URLs Cloud Pi sont des **exemples par instance** :
les instances n'ont pas toutes la même version de plateforme (ex. Scaleway 9.9.0 vs RIE ≥ 9.11). Relever la
version réelle de l'instance avant de supposer un comportement.

| Service | Scaleway (sdid) | Cloud Pi |
|---|---|---|
| Console | `console.sdid.cpin.numerique-interieur.com` | `console.<instance>` |
| ArgoCD | `argocd.sdid.cpin.numerique-interieur.com` | `argocd.<zone>` |
| Harbor | `harbor.sdid.cpin.numerique-interieur.com` | `harbor.<zone>` |
| GitLab | `gitlab.sdid.cpin.numerique-interieur.com` | `<gitlab>` |
| Keycloak | `keycloak.sdid.cpin.numerique-interieur.com/realms/dso` | idem |

## Accès API

| Service | Endpoint | Auth |
|---|---|---|
| ArgoCD | `GET /api/v1/applications` | `Authorization: Bearer <token OIDC>` |
| Harbor | `GET /api/v2.0/projects` | `Authorization: Bearer <token OIDC>` |
| GitLab | `GET /api/v4/user` | `PRIVATE-TOKEN: <PAT>` |
| Console | `GET /api/v1/me` | `x-dso-token: <jeton API>` |

Scripts de debug : `scripts/cpin-debug/` (login Playwright optionnel + un check par service).
```

- [ ] **Step 3 : Référencer le fichier dans `index.md`**

Ajouter une ligne dans `docs/okf/cloud-pi-native/index.md` (après la ligne `plateforme-et-acteurs.md`) :

```markdown
- [URLs des instances](urls-instances.md) - URLs des services internes (console, ArgoCD, Harbor, GitLab, Keycloak) et accès API.
```

- [ ] **Step 4 : Vérifier**

```bash
grep -n "urls-instances" docs/okf/cloud-pi-native/index.md
head -20 docs/okf/cloud-pi-native/urls-instances.md
```

Résultat attendu : la ligne de référence est présente ; le fichier commence par `# URLs des instances`.

- [ ] **Step 5 : Commit**

```bash
git add docs/okf/cloud-pi-native/urls-instances.md docs/okf/cloud-pi-native/index.md
git commit -m "docs(okf): tableau des URLs des instances CPiN"
```

---

### Task 2 : Scaffolding de `scripts/cpin-debug/`

**Files:**
- Create: `scripts/cpin-debug/package.json`
- Create: `scripts/cpin-debug/.gitignore`
- Create: `scripts/cpin-debug/.env.secrets` (vide, 0600, gitignoré)

- [ ] **Step 1 : Créer le dossier**

```bash
mkdir -p scripts/cpin-debug
```

- [ ] **Step 2 : Créer `package.json`**

```json
{
  "name": "cpin-debug",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "login": "node login.mjs",
    "check:argocd": "node check-argocd.mjs",
    "check:harbor": "node check-harbor.mjs",
    "check:gitlab": "node check-gitlab.mjs",
    "check:console": "node check-console.mjs"
  },
  "dependencies": {
    "playwright": "^1.48.0"
  }
}
```

- [ ] **Step 3 : Créer `.gitignore`**

```
node_modules/
.env.secrets
```

- [ ] **Step 4 : Créer `.env.secrets` (vide, 0600, gitignoré)**

```bash
touch scripts/cpin-debug/.env.secrets
chmod 600 scripts/cpin-debug/.env.secrets
```

Ne **jamais** y écrire de valeur de token : l'humain y ajoute `DSO_TOKEN` et `GITLAB_PAT` ; `ARGOCD_TOKEN` est écrit par `login.mjs`.

- [ ] **Step 5 : Vérifier que `.env.secrets` est bien ignoré par git**

```bash
git check-ignore scripts/cpin-debug/.env.secrets
stat -c '%a' scripts/cpin-debug/.env.secrets
```

Résultat attendu : le chemin est listé par `git check-ignore` ; les permissions sont `600`.

- [ ] **Step 6 : Commit**

```bash
git add scripts/cpin-debug/package.json scripts/cpin-debug/.gitignore
git commit -m "feat(scripts): scaffolding cpin-debug (package.json, gitignore, .env.secrets)"
```

---

### Task 3 : Helper partagé `lib.mjs`

**Files:**
- Create: `scripts/cpin-debug/lib.mjs`

- [ ] **Step 1 : Créer `lib.mjs`**

```js
import { readFile, writeFile, chmod } from 'node:fs/promises'
import { resolve } from 'node:path'

export const SECRETS_FILE = resolve(import.meta.dirname, '.env.secrets')

export async function loadSecrets() {
  try {
    const content = await readFile(SECRETS_FILE, 'utf8')
    const secrets = {}
    for (const line of content.split('\n')) {
      const match = line.match(/^([A-Z_]+)=(.*)$/)
      if (match) secrets[match[1]] = match[2]
    }
    return secrets
  } catch {
    return {}
  }
}

export async function saveSecret(key, value) {
  const secrets = await loadSecrets()
  secrets[key] = value
  const content = `${Object.entries(secrets)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')}\n`
  await writeFile(SECRETS_FILE, content, { encoding: 'utf8', flag: 'w' })
  await chmod(SECRETS_FILE, 0o600)
}

export function redact(value) {
  if (!value) return '<absent>'
  return `${value.slice(0, 8)}…${value.slice(-4)} (${value.length} chars)`
}

export async function checkService(name, url, path, token, { header = 'Authorization', prefix = 'Bearer ' } = {}) {
  if (!url) {
    console.log(`${name} : URL non configurée`)
    return
  }
  if (!token) {
    console.log(`${name} : token manquant (voir .env.secrets)`)
    return
  }
  try {
    const response = await fetch(`${url}${path}`, {
      headers: { [header]: `${prefix}${token}` },
    })
    console.log(`${name} : GET ${path} → ${response.status}`)
  } catch (error) {
    console.log(`${name} : erreur réseau → ${error.message}`)
  }
}
```

- [ ] **Step 2 : Vérifier la syntaxe**

```bash
node --check scripts/cpin-debug/lib.mjs
```

Résultat attendu : aucune sortie, code de sortie 0.

---

### Task 4 : `login.mjs` (login Playwright optionnel)

**Files:**
- Create: `scripts/cpin-debug/login.mjs`

- [ ] **Step 1 : Créer `login.mjs`**

Basé sur le POC validé `scripts/argocd-token/capture-token.mjs`, mais écrit `ARGOCD_TOKEN` dans `.env.secrets` (via `saveSecret`) au lieu de `.token` :

```js
import { firefox } from 'playwright'
import { saveSecret, redact } from './lib.mjs'

const ARGOCD_URL = process.env.ARGOCD_URL ?? 'https://argocd.sdid.cpin.numerique-interieur.com'
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000
const POLL_INTERVAL_MS = 1000

async function waitForToken(page) {
  const deadline = Date.now() + LOGIN_TIMEOUT_MS
  while (Date.now() < deadline) {
    try {
      const token = await page.evaluate(() => {
        const fromStorage = localStorage.getItem('argocd.token')
        if (fromStorage) return fromStorage
        const fromSession = sessionStorage.getItem('argocd.token')
        if (fromSession) return fromSession
        const fromCookie = document.cookie
          .split('; ')
          .find((c) => c.startsWith('argocd.token='))
        return fromCookie ? decodeURIComponent(fromCookie.split('=').slice(1).join('=')) : null
      })
      if (token) return token
    } catch {
      // page en cours de navigation (retour Keycloak → ArgoCD) : on réessaie
    }
    const cookies = await page.context().cookies(ARGOCD_URL)
    const tokenCookie = cookies.find((c) => c.name === 'argocd.token')
    if (tokenCookie) return tokenCookie.value
    await page.waitForTimeout(POLL_INTERVAL_MS)
  }
  throw new Error(`Aucun token ArgoCD détecté après ${LOGIN_TIMEOUT_MS / 1000}s.`)
}

const browser = await firefox.launch({ headless: false })
const page = await browser.newPage()
try {
  console.log(`Ouvre ${ARGOCD_URL} — connecte-toi via le SSO Keycloak dans le navigateur.`)
  await page.goto(ARGOCD_URL, { waitUntil: 'domcontentloaded' })
  if (!page.url().startsWith(ARGOCD_URL)) {
    console.log('Redirigé vers le SSO Keycloak — connecte-toi, tu seras ramené automatiquement.')
  }
  const token = await waitForToken(page)
  console.log(`Token ArgoCD capturé : ${redact(token)}`)
  await saveSecret('ARGOCD_TOKEN', token)
  console.log('ARGOCD_TOKEN écrit dans .env.secrets (0600) — jamais affiché.')
} catch (error) {
  console.error(`Erreur : ${error.message}`)
  process.exitCode = 1
} finally {
  await browser.close()
}
```

- [ ] **Step 2 : Vérifier la syntaxe**

```bash
node --check scripts/cpin-debug/login.mjs
```

Résultat attendu : aucune sortie, code de sortie 0.

---

### Task 5 : Scripts de check ArgoCD et Harbor

**Files:**
- Create: `scripts/cpin-debug/check-argocd.mjs`
- Create: `scripts/cpin-debug/check-harbor.mjs`

- [ ] **Step 1 : Créer `check-argocd.mjs`**

```js
import { loadSecrets, checkService } from './lib.mjs'

const ARGOCD_URL = process.env.ARGOCD_URL ?? 'https://argocd.sdid.cpin.numerique-interieur.com'

const secrets = await loadSecrets()
await checkService('ArgoCD', ARGOCD_URL, '/api/v1/applications', secrets.ARGOCD_TOKEN)
```

- [ ] **Step 2 : Créer `check-harbor.mjs`**

```js
import { loadSecrets, checkService } from './lib.mjs'

const HARBOR_URL = process.env.HARBOR_URL ?? 'https://harbor.sdid.cpin.numerique-interieur.com'

const secrets = await loadSecrets()
await checkService('Harbor', HARBOR_URL, '/api/v2.0/projects', secrets.ARGOCD_TOKEN)
```

- [ ] **Step 3 : Vérifier la syntaxe des deux scripts**

```bash
node --check scripts/cpin-debug/check-argocd.mjs
node --check scripts/cpin-debug/check-harbor.mjs
```

Résultat attendu : aucune sortie, code de sortie 0 pour les deux.

---

### Task 6 : Scripts de check GitLab et Console

**Files:**
- Create: `scripts/cpin-debug/check-gitlab.mjs`
- Create: `scripts/cpin-debug/check-console.mjs`

- [ ] **Step 1 : Créer `check-gitlab.mjs`**

```js
import { loadSecrets, checkService } from './lib.mjs'

const GITLAB_URL = process.env.GITLAB_URL ?? 'https://gitlab.sdid.cpin.numerique-interieur.com'

const secrets = await loadSecrets()
await checkService('GitLab', GITLAB_URL, '/api/v4/user', secrets.GITLAB_PAT)
```

- [ ] **Step 2 : Créer `check-console.mjs`**

La console s'authentifie par l'en-tête `x-dso-token` (pas de préfixe `Bearer`) :

```js
import { loadSecrets, checkService } from './lib.mjs'

const CONSOLE_URL = process.env.CONSOLE_URL ?? 'https://console.sdid.cpin.numerique-interieur.com'

const secrets = await loadSecrets()
await checkService('Console', CONSOLE_URL, '/api/v1/me', secrets.DSO_TOKEN, {
  header: 'x-dso-token',
  prefix: '',
})
```

- [ ] **Step 3 : Vérifier la syntaxe des deux scripts**

```bash
node --check scripts/cpin-debug/check-gitlab.mjs
node --check scripts/cpin-debug/check-console.mjs
```

Résultat attendu : aucune sortie, code de sortie 0 pour les deux.

---

### Task 7 : Installer les dépendances et vérifier l'exécution

**Files:**
- (aucun — installation locale)

- [ ] **Step 1 : Installer les dépendances**

```bash
npm install --prefix scripts/cpin-debug
npx --prefix scripts/cpin-debug playwright install firefox
```

Résultat attendu : `playwright` installé dans `scripts/cpin-debug/node_modules/` ; navigateur Firefox téléchargé (ou déjà présent dans `~/.cache/ms-playwright/`).

- [ ] **Step 2 : Vérifier que les checks tournent sans token**

```bash
npm run --prefix scripts/cpin-debug check:argocd
npm run --prefix scripts/cpin-debug check:harbor
npm run --prefix scripts/cpin-debug check:gitlab
npm run --prefix scripts/cpin-debug check:console
```

Résultat attendu (`.env.secrets` vide) : chaque script affiche `<Service> : token manquant (voir .env.secrets)` — **aucune valeur de token affichée**.

- [ ] **Step 3 : Vérifier que `node_modules/` et `.env.secrets` sont ignorés**

```bash
git status --porcelain scripts/cpin-debug/
```

Résultat attendu : seuls `package.json`, `.gitignore`, `lib.mjs`, `login.mjs` et les 4 `check-*.mjs` apparaissent ; ni `node_modules/` ni `.env.secrets`.

- [ ] **Step 4 : Commit**

```bash
git add scripts/cpin-debug/lib.mjs scripts/cpin-debug/login.mjs \
  scripts/cpin-debug/check-argocd.mjs scripts/cpin-debug/check-harbor.mjs \
  scripts/cpin-debug/check-gitlab.mjs scripts/cpin-debug/check-console.mjs
git commit -m "feat(scripts): debug des services CPiN — login Playwright et checks ArgoCD/Harbor/GitLab/Console"
```

---

### Task 8 : Bloquer `.env.secrets` dans `opencode.jsonc`

**Files:**
- Modify: `opencode.jsonc`

- [ ] **Step 1 : Lire le fichier actuel**

```bash
cat opencode.jsonc
```

Résultat attendu : contenu actuel avec `"permission": { "skill": { "*": "allow" } }`.

- [ ] **Step 2 : Ajouter les règles de permission**

Remplacer le bloc `permission` par :

```jsonc
  "permission": {
    "read": { "*": "allow", "**/.env.secrets": "deny" },
    "edit": { "*": "allow", "**/.env.secrets": "deny" },
    "skill": { "*": "allow" }
  }
```

> Le schéma opencode (`https://opencode.ai/config.json`) ne définit **pas** de clé `write` : c'est `edit` qui couvre l'écriture. L'ordre compte (dernière règle gagnante) : règle large `*` d'abord, règle étroite `**/.env.secrets` ensuite. L'agent ne peut donc ni lire ni écrire `.env.secrets` ; l'humain seul y accède.

- [ ] **Step 3 : Valider le JSONC**

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('opencode.jsonc','utf8');const j=s.replace(/^\s*\/\/.*$/gm,'');JSON.parse(j);console.log('opencode.jsonc valide')"
```

Résultat attendu : `opencode.jsonc valide`.

- [ ] **Step 4 : Vérifier la règle**

```bash
grep -n "env.secrets" opencode.jsonc
```

Résultat attendu : deux occurrences (`read` et `edit`) avec `"deny"`.

- [ ] **Step 5 : Commit**

```bash
git add opencode.jsonc
git commit -m "chore(opencode): bloquer lecture/écriture de .env.secrets par l'agent"
```

> **🔧 Action manuelle requise** : redémarrer opencode pour que la nouvelle règle de permission soit prise en compte (la config n'est pas rechargée à chaud).

---

### Task 9 : Mettre à jour le runbook `deploiement-cpin`

**Files:**
- Modify: `.agents/skills/dso/deploiement-cpin/SKILL.md`

- [ ] **Step 1 : Ajouter la proposition de mise en place en Phase 1**

Après la checklist de la Phase 1 (avant la ligne `**Porte**`), ajouter :

```markdown
À la fin de la checklist, **demander** à l'humain :

> Veux-tu configurer le debug automatisé des services internes (scripts `scripts/cpin-debug/`) ?
> Cela permet de vérifier ArgoCD, Harbor, GitLab et la console par API au lieu de l'UI.

- **Oui** → vérifier que `scripts/cpin-debug/.env.secrets` existe (0600) et **demander** à l'humain d'y
  ajouter `DSO_TOKEN` (console) et `GITLAB_PAT` (GitLab). L'agent ne lit jamais le contenu. Le token OIDC
  (`ARGOCD_TOKEN`) sera ajouté plus tard par `login.mjs` (phase 5).
- **Non** → debug manuel via l'UI uniquement. Rien n'est installé.
```

- [ ] **Step 2 : Ajouter le debug automatisé en Phase 5**

Après le point 4 de la Phase 5 (avant la ligne `**Porte**`), ajouter :

```markdown
5. **Debug automatisé (optionnel)** — **demander** à l'humain :

> Veux-tu te logger (login Playwright) pour activer le debug automatisé des services ? Une fenêtre
> navigateur s'ouvrira pour te connecter via le SSO Keycloak. Sinon, on vérifie via l'UI ArgoCD DSO.

- **Ramification A — Login accepté** :
  1. Lancer `npm run login` (dans `scripts/cpin-debug/`). Le navigateur s'ouvre, l'humain se connecte via
     SSO Keycloak (2FA possible). Le token OIDC est écrit dans `.env.secrets` (0600), **jamais affiché**.
  2. Lancer les checks : `check:argocd`, `check:harbor`, `check:gitlab`, `check:console`.
  3. Lire les **statuts HTTP** (jamais les tokens) et les rapporter à l'humain.
  4. **A1 — un check échoue** (ex. ArgoCD 401, Harbor 500) → consulter `references/depannage.md` et
     proposer un correctif, ou demander à l'humain ce qu'il voit dans l'UI.
- **Ramification B — Login refusé** : debug manuel via l'UI ArgoCD DSO (comportement actuel, inchangé).
  Demander à l'humain ce qu'il voit (statut pod, événements, image attendue).
- **Ramification C — Login accepté mais token manquant pour un service** :
  - `ARGOCD_TOKEN` absent → relancer `login.mjs`.
  - `DSO_TOKEN` ou `GITLAB_PAT` absent → **demander** à l'humain de les ajouter dans `.env.secrets`, ou
    sauter le check de ce service en le signalant.

**Règle absolue** : ne jamais lire, écrire, afficher ni demander la **valeur** d'un token. Vérifier
seulement la **présence** des variables dans `.env.secrets` (ex. `grep -c '^ARGOCD_TOKEN='`).
```

- [ ] **Step 3 : Vérifier la structure du runbook**

```bash
grep -n "^## Phase\|^## Limites\|^## Pour aller" .agents/skills/dso/deploiement-cpin/SKILL.md
```

Résultat attendu : les phases 0 à 5 et les sections finales sont intactes ; les ajouts sont dans les phases 1 et 5.

- [ ] **Step 4 : Vérifier qu'aucun token n'est mentionné en clair**

```bash
grep -n "ARGOCD_TOKEN\|DSO_TOKEN\|GITLAB_PAT" .agents/skills/dso/deploiement-cpin/SKILL.md
```

Résultat attendu : seuls les **noms** de variables apparaissent (jamais de valeur).

- [ ] **Step 5 : Commit**

```bash
git add .agents/skills/dso/deploiement-cpin/SKILL.md
git commit -m "docs(skill): debug automatisé des services CPiN dans le runbook deploiement-cpin"
```

---

### Task 10 : Vérification finale

- [ ] **Step 1 : Vérifier la syntaxe de tous les scripts**

```bash
for f in scripts/cpin-debug/*.mjs; do node --check "$f" || exit 1; done
```

Résultat attendu : aucune sortie, code de sortie 0.

- [ ] **Step 2 : Vérifier que git ne suit aucun secret**

```bash
git status --porcelain
git ls-files | grep -i "env.secrets\|\.token" || echo "aucun fichier secret suivi"
```

Résultat attendu : `.env.secrets` et `.token` ne sont **pas** suivis par git.

- [ ] **Step 3 : Vérifier le log des commits**

```bash
git log --oneline -8
```

Résultat attendu : les 6 commits du plan (docs, scaffolding, scripts, opencode, runbook) sur `feat/argocd-token-poc#39`.

- [ ] **Step 4 : Récapituler pour l'humain**

Rapporter : fichiers créés/modifiés, statut des checks (sans token → « token manquant »), et les **actions manuelles requises** :
- ajouter `DSO_TOKEN` et `GITLAB_PAT` dans `scripts/cpin-debug/.env.secrets` (0600) ;
- redémarrer opencode pour la règle de permission ;
- (optionnel) lancer `npm run login` pour capturer `ARGOCD_TOKEN`.
