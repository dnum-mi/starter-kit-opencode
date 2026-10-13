---
name: gouv-fr-code-quality
description: "Qualité de code : standards au quotidien (fonctions, erreurs, imports, tests) et grille de revue en trois niveaux pour décider ce qu'on accepte dans une base maintenue — cible le code généré par IA et inclut un rituel d'hygiène contre la dette."
category: qualite
version: 1.1.0
author: Hermes Agent (Nous Research)
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, quality, code-review, ia, dette-technique, lint, tests, standards]
    related_skills: [gouv-fr-lint-eslint, gouv-fr-conventions-nommage, gouv-fr-projet-structure]
---

# Gouv-fr — Qualité de code et revue

## Principe directeur

Produire du code ne coûte presque plus rien ; le **comprendre, le maintenir et
l'assumer** coûte toujours aussi cher. Une revue de qualité ne sert donc plus à
« écrire mieux » mais à **décider quoi laisser entrer** dans une base qu'un
humain devra porter pendant des années. La question centrale de toute revue
n'est pas « ce code est-il joli ? » mais :

> **Quelqu'un pourra-t-il comprendre, faire évoluer et assumer ce code dans
> trois ans — et le coût de le maintenir est-il justifié par ce qu'il
> apporte ?**

Le code généré par IA est typiquement *syntaxiquement correct et sémantiquement
opaque* : il compile, les tests passent, mais l'intention est absente, les cas
limites sont négligés, des fonctions inexistantes sont parfois appelées, et la
duplication remplace la conception. Cette grille cible précisément ces défauts.

## Standards de code — règles au quotidien

Le code produit au quotidien respecte ces règles ; la grille de revue ci-dessous
sert à décider ce qu'on accepte dans une base maintenue.

### Structure de fichier

- Lignes ≤ 120 colonnes ; au-delà de 140 **proscrit**
- `.editorconfig` à la racine (2 espaces, LF, UTF-8, trim trailing whitespace)
- Dossiers et fichiers en **kebab-case** (exception : composants Vue)

### Fonctions

- **≤ 20 lignes**, un seul but par fonction
- Noms explicites ; pas de variable d'une seule lettre (sauf identité `x => x`)

### Erreurs

Ne jamais ignorer silencieusement :

```typescript
// ❌
try { await fetchData() } catch { }

// ✅
try { await fetchData() } catch (error) {
  logger.error(error, 'Erreur')
  throw error
}
```

- Créer des erreurs typées (`NotFoundError`, `ValidationError`)
- Ne pas se contenter d'un `Error` générique

### Async / await

- Toujours `async/await` plutôt que `.then()` / `.catch()`
- Paralléliser les opérations indépendantes avec `Promise.all()`
- `async def` pour les endpoints qui font de l'I/O

### Imports

Ordre imposé, chaque groupe séparé par une ligne vide :

1. Modules Node.js natifs (`node:fs`)
2. Packages externes (`fastify`, `vue`)
3. Modules internes (alias `@/`, `~/`)
4. Modules relatifs (`./`, `../`)

### Constantes

Extraire les valeurs magiques dans des constantes nommées :

```typescript
// ❌
if (password.length < 8) { ... }

// ✅
const MIN_PASSWORD_LENGTH = 8
if (password.length < MIN_PASSWORD_LENGTH) { ... }
```

### Early return

Privilégier les retours anticipés pour éviter l'imbrication :

```typescript
if (!user) return
if (!user.isActive) return
// traitement...
```

### Dépendances

Avant d'ajouter une dépendance, évaluer :

1. Version courante (dernière stable majeure)
2. Popularité (téléchargements hebdo, étoiles GitHub)
3. Fréquence de mise à jour (12 mois sans commit = signal d'alerte)
4. Maintenance (issues ouvertes, réactivité, `SECURITY.md`)
5. Taille (bundlephobia.com pour npm)

### Tests (obligatoires)

- Tests unitaires dès le début ; d'intégration pour les endpoints API
- Composants avec Vue Testing Library ; E2E avec Playwright
- Vitest pour JS/TS, pytest pour Python
- Couverture ≥ 80 % recommandée

### Configuration du lint

Voir `gouv-fr-lint-eslint` (ESLint flat config, Ruff, EditorConfig) — ne pas
dupliquer la configuration ici.

### Vérification des standards

- `pnpm lint` sans erreur ; `pnpm test` passe
- `pnpm ruff check` (Python) sans erreur ; couverture ≥ 80 %

### Pièges

- ESLint remplace Prettier — ne pas installer les deux avec `@antfu/eslint-config`
- Flat config (`eslint.config.js`) depuis ESLint v9 — plus de `.eslintrc`
- Ruff remplace black, flake8, isort, pyupgrade — ne pas les cumuler
- Les tests se mettent à jour avec le code, pas après

---

## Routage et langue

- **Quel mode ?** On soumet un diff, une PR ou du code à évaluer → **mode
  revue** (trois niveaux + verdict). On demande de mesurer ou de dégonfler la
  dette d'une base existante → **mode rituel** (passe d'hygiène). En cas de
  doute, demander — ne pas mélanger les deux dans une même passe.
- **Langue.** La grille est en français ; rendre le compte rendu dans la
  langue de l'utilisateur.
- **Source de vérité.** Ce fichier fait foi ; le README du dépôt n'en est
  qu'un résumé.

## Comment utiliser cette grille

Appliquer les trois niveaux **dans l'ordre**. Un échec au Niveau 1 stoppe la
revue : inutile de lire en détail un code qu'on ne peut pas assumer.

1. **Niveau 1 — Règles d'entrée** : vérifier *avant de lire le code* que la
   contribution est recevable et révisable. (Rétablit l'asymétrie coût.)
2. **Niveau 2 — Règles de fond** : vérifier la qualité *dans* le code.
3. **Niveau 3 — Règles de statut** : vérifier le *statut* du code (jetable vs
   durable) et sa traçabilité.

Pour chaque règle, attribuer :

- ✅ conforme — une preuve accessible soutient le critère ;
- ⚠️ à corriger — déficience réelle mais non bloquante ;
- ❌ bloquant — défaut confirmé qui empêche une fusion sûre ;
- ◻️ non évalué — la preuve ou l'accès manque ; ce n'est **pas** un défaut ;
- N/A — critère sans objet, avec justification.

**L'absence d'accès n'est jamais une preuve d'absence** : une information
inaccessible se cote ◻️ en disant ce qui manque, pas ❌. Puis rendre un
**verdict global motivé** (voir plus bas). Toujours citer des lignes/fichiers
précis — jamais un jugement vague.

Le détail exécutable de chaque point (questions à se poser, signaux d'alerte,
exemples) est dans `references/checklist.md`. Charger ce fichier lorsqu'une
revue complète et systématique est demandée.

---

## Niveau 1 — Règles d'entrée (avant de lire le code)

Un échec ici est en principe **bloquant** : on renvoie sans réviser.

Collecte des preuves selon le contexte :

- **PR GitHub** : `gh pr view <n> --json title,body,author,files` (intention,
  auteur), `gh pr diff <n> --stat` (taille et découpe), `gh pr checks <n>`
  (état des vérifications).
- **Branche / diff local** : `git log --format='%h %an %s' main..HEAD` et
  `git diff --stat main...HEAD` (adapter le nom de la branche principale).
- **Hors PR** (diff collé, fichier isolé) : les règles 1.1 et 1.2 se vérifient
  auprès de l'utilisateur — demander l'intention et qui assume ; coter **N/A**
  ce qui est sans objet (ex. la découpe d'une PR qui n'existe pas). Ne jamais
  inventer une intention ou un propriétaire pour combler un trou.

**Balayage critique, même si l'entrée échoue.** Une contribution non révisable
n'est pas renvoyée les yeux fermés : balayer le diff accessible à la recherche
des risques critiques évidents — secret exposé, injection, contrôle d'accès
affaibli, destruction de données ou migration irréversible, dépendance
suspecte — et les signaler. Sans présenter ce balayage comme une revue
complète.

1. **Intention déclarée** — La contribution énonce l'*effet recherché* (le
   « pourquoi »), pas seulement le diff. Pas d'intention lisible → refus.
2. **Propriétaire humain responsable** — Un humain nommé assume la PR. L'IA
   n'est jamais redevable ; un humain l'est toujours.
3. **Preuve de comportement** — Reproduction du bug, ou test qui échouait
   avant / passe après. On évalue un *comportement*, pas une esthétique.
4. **Coût de revue proportionné** — Une PR massive générée en minutes n'a pas
   droit à des heures de revue par défaut. Elle doit être rendue révisable :
   petite, ciblée, découpée, expliquée.

## Niveau 2 — Règles de fond (dans le code)

1. **Lisibilité / intention** — Le code se lit-il comme une explication de ce
   qu'il fait et pourquoi ? Nommage, structure, absence de complexité gratuite.
2. **Pas de duplication** — Cible n°1 du code IA (blocs clonés en forte hausse
   depuis l'arrivée des assistants). Est-ce refactorisé, ou copié-collé ?
3. **Justesse vérifiée ≠ « les tests passent »** — Les tests testent-ils le bon
   comportement, ou ont-ils été écrits pour verdir ? Se méfier de la « triche »
   (optimiser la mesure, pas l'intention).
4. **API et fonctions réelles** — Le code appelle-t-il uniquement ce qui existe
   vraiment ? Traquer les hallucinations (appels, méthodes, options inventés).
5. **Erreurs et cas limites** — Chemin nominal soigné mais bords négligés :
   entrées vides/nulles, concurrence, échecs réseau, valeurs extrêmes.
6. **Sécurité, secrets, dépendances** — Secrets en dur, dépendances hallucinées
   ou vulnérables, entrées non validées, injection.
7. **Surface de maintenance** — Ce code crée-t-il une dette qu'un humain devra
   porter longtemps ? Le gain justifie-t-il le poids ajouté ?

## Niveau 3 — Règles de statut (méta)

1. **Marquer le jetable comme jetable** — Tout prototype naît avec une « date
   de mort » ou une étiquette *non maintenu*. Le sacrificiel non étiqueté qui
   devient fondation par accident est la source réelle de dette.
2. **Une porte unique** — Le code d'un dirigeant ou d'une IA passe par la même
   revue que celui de n'importe qui. Aucun passe-droit hiérarchique ou
   technologique. (C'est la règle du noyau Linux.)
3. **Tracer l'origine IA** — Marquer le code généré (à la manière du tag
   `Assisted-by` du noyau Linux), non pour l'interdire, mais pour mesurer son
   taux de défaut réel dans le temps.

   *Calibration* : sur un dépôt qui ne trace encore rien, cette règle est
   **consultative** à la première application — ⚠️ au maximum, jamais ❌ ; on
   recommande d'instaurer la convention, on ne bloque pas. Dès qu'une
   convention existe (modèle de PR, CONTRIBUTING, trailer `Assisted-by`), elle
   devient **bloquante** : une contribution générée non déclarée est un ❌.
   Sans cette calibration, aucun dépôt réel n'atteindrait jamais ACCEPTER.

---

## Verdict global

Conclure toute revue par l'un des quatre verdicts, **motivé et actionnable**.
Appliquer la **première condition satisfaite**, dans cet ordre :

1. **REFUSER** — Des preuves suffisantes montrent que l'intention ou
   l'approche est fondamentalement mauvaise (justesse fausse, hallucination
   d'API confirmée, faille) et qu'une correction locale ne suffit pas.
   Expliquer pourquoi, brièvement, avec respect.
2. **NON RÉVISABLE** — Une information indispensable manque ou reste
   inaccessible (règle d'entrée en ❌ ou ◻️) et empêche une décision sûre.
   Fusion bloquée : rapporter le résultat du balayage critique, marquer les
   contrôles restants ◻️, et lister exactement ce qu'il faut fournir ou
   découper pour reprendre. Ne pas punir d'un REFUSER une information
   simplement inaccessible.
3. **CORRIGER** — Recevable sur le fond mais au moins un point ⚠️/❌ précis,
   réparable avant fusion. Lister chaque point avec fichier:ligne et l'action
   attendue.
4. **ACCEPTER** — Niveau 1 conforme, Niveau 2 sans ❌, Niveau 3 conforme *en
   tenant compte de la calibration de la règle 3.3* (consultative à la
   première application), et aucun contrôle indispensable resté ◻️. Réserves
   ⚠️ mineures listées mais non bloquantes.

Toujours : citer des emplacements précis, distinguer le bloquant du cosmétique,
et se rappeler que **refuser proprement fait partie du travail de qualité** —
la gentillesse est de dire non clairement plutôt que de laisser entrer une dette
que quelqu'un paiera en silence.

Enfin, **signer le compte rendu** : un agent s'y identifie par son nom et
l'identifiant exact de son modèle — la même exigence de traçabilité que la
règle 3.3, appliquée au réviseur lui-même.

---

## Mode rituel — la passe d'hygiène (dégonfler la dette)

La revue décide de ce qui entre ; le rituel s'occupe de ce qui est déjà entré.
À lancer **à intervalle régulier** (hebdomadaire recommandé), pas seulement à
la fusion.

Trois niveaux d'autorisation — appliquer le moins permissif compatible avec
la demande :

- **AUDIT** (défaut) : inspecter et mesurer sans modifier l'arbre de travail —
  rapports et caches d'outils dirigés hors du dépôt, pas d'installation, pas
  de `--fix`, pas de commit ; comparer l'état git avant/après la passe et
  signaler toute mutation inattendue ;
- **JOURNAL** : créer ou compléter `hygiene-log.md`, si c'est demandé ;
- **REMÉDIATION** : refactoriser dans le périmètre demandé, puis re-tester et
  re-mesurer — livraison selon « Livraison des changements » ci-dessous.

Déroulé en quatre temps :

1. **Mesurer l'état de la base.** Produire les métriques de dette avec des
   commandes reproductibles — consigner pour chacune l'outil, sa version et la
   ligne de commande exacte :
   - duplication : `npx jscpd --min-tokens 50 .` (multi-langages) ; à défaut
     `pylint --disable=all --enable=duplicate-code` (Python) ou `pmd cpd` ;
   - complexité cyclomatique : `radon cc -s -a .` ou `lizard` (Python /
     multi-langages), règle `complexity` d'ESLint (JS/TS) — repère : signaler
     les fonctions au-dessus de 15 ;
   - couverture de tests : l'outil du projet (`pytest --cov`,
     `npx vitest run --coverage`, `go test -cover`…) ;
   - vulnérabilités : `npm audit --audit-level=high`, `pip-audit` ou
     `trivy fs .` — mesure **contextuelle** : la base d'avis évolue chaque
     jour, noter sa date et ne pas intégrer ce compte à la courbe comparée ;
   - volume : `git ls-files | wc -l` (fichiers) et
     `git ls-files | xargs wc -l | tail -1` (lignes), ou `cloc` si disponible.

   Si un outil manque, préférer une exécution sans installation globale
   (`npx`, `pipx run`, `uvx`) ; si aucune n'est possible, noter la mesure
   manquante dans le journal plutôt que de substituer un chiffre incomparable.

2. **Comparer à la passe précédente.** Chercher le relevé antérieur (fichier
   `hygiene-log.md` à la racine du projet, au format défini dans
   `references/hygiene-log-format.md`). Première passe → c'est l'état zéro ;
   le créer. D'une passe à l'autre : **mêmes outils, mêmes flags** — sinon la
   courbe est incomparable et il faut le signaler.

3. **Recommander les passes de refactorisation ciblées.** À partir des
   mesures, proposer 1 à 3 actions *bornées et vérifiables*, les plus
   rentables d'abord — typiquement : « refactorise toutes les instanciations
   de X en une seule implémentation », « extrais l'utilitaire dupliqué dans
   N fichiers », « ajoute des tests sur le module le moins couvert avant de
   le toucher ». Chaque action recommandée doit être accompagnée de tests qui
   protègent le comportement pendant la refactorisation.

4. **Re-mesurer et tracer la courbe.** Après application, refaire les mesures,
   consigner dans le journal (date, métriques, actions menées), et dire si la
   courbe descend, stagne ou monte. C'est la courbe — pas l'impression — qui
   dit si la dette dégonfle.

Règle du rituel : petit et régulier bat gros et rare. Une passe d'une heure
par semaine qui fait baisser la duplication de 1 % vaut mieux qu'un grand
nettoyage annuel que personne n'ose lancer.

---

## Livraison des changements produits par le skill

Tout changement de code produit en appliquant ce skill — refactorisation du
mode rituel, correction issue d'une revue — est livré via une branche dédiée
et une pull request qui satisfait elle-même les Niveaux 1 et 3 :

1. **Branche dédiée** — jamais de commit direct sur la branche principale.
2. **Identification de l'agent** — chaque commit porte le trailer
   `Assisted-by: <nom de l'agent> (<identifiant exact du modèle>)`, par
   exemple `Assisted-by: Claude Code (claude-fable-5)`, et la même mention
   figure en tête du corps de la PR. C'est la règle 3.3 appliquée à soi-même :
   on ne peut pas exiger la traçabilité des autres et livrer anonymement.
3. **Corps de PR conforme au modèle** `references/pr-template.md` : intention
   déclarée, propriétaire humain qui assume, preuve de comportement (test
   rouge→vert, ou mesures avant/après pour une passe d'hygiène), et
   auto-évaluation Niveaux 1 et 3.
4. **Jamais d'auto-fusion** — la PR attend la revue du propriétaire humain
   (règle 3.2 : une porte unique).

---

## Faire évoluer le skill

Toute modification de ce skill se valide contre les scénarios de
`references/evaluation-scenarios.md` : vérifier que les verdicts suivent
l'ordre de priorité, que ◻️ n'est jamais transformé en défaut, et qu'une
demande d'inspection ne provoque aucune modification du dépôt.
