---
name: gouv-fr-audit-conformite
description: "Audit de conformité d'une app gouv-fr-code-index."
category: qualite
version: 0.1.0
author: Hermes Agent
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, audit, conformance]
    related_skills: [gouv-fr-securite, gouv-fr-compliance-rgaa, gouv-fr-repo-init]
---

# Gouv-fr — Audit de conformité d'une application

## Quand utiliser

Quand un utilisateur demande « vérifier conformité avec gouv fr skills » sur une application. C'est une tâche récurrente
dans les échanges. Les règles documentaires vivent dans les skills user-owned suivants : `gouv-fr-securite`,
`gouv-fr-compliance-rgaa`, `gouv-fr-repo-init`, `gouv-fr-projet-structure`, `gouv-fr-workflow-dev`. Ce skill porte la
procédure de vérification et les pièges concrets. Ne pas éditer ces skills user-owned; les consulter seulement.

## Ordre de l'audit

Pour chaque check, si échec, corriger avant de passer au suivant.

1. **gitleaks** — scan de fuite obligatoire, en premier.
2. **Secrets en dur** — scan des motifs sensibles.
3. **SQL** — 100 % paramétré.
4. **TLS** — https, ssl-redirect, runAsNonRoot.
5. **RGAA / DSFR** — structure sémantique, classes vérifiées contre le CSS officiel.
6. **RGPD** — minimisation plus droit à l'oubli.
7. **Git** — commits Conventional, trailer porté par chaque commit, arbre de travail propre, `.gitignore` complet.
8. **Tests** — suite pytest verte.

## Commandes par check

### 1. gitleaks

Si le binaire est absent sur un nouvel environnement (à arch arm64, vérifier avec `uname -m`), l'installer depuis le
tarball de release :

```bash
curl -sL -o /tmp/gitleaks.tgz \
  https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_arm64.tar.gz
(cd /tmp && tar xzf gitleaks.tgz gitleaks)
cd <repo> && /tmp/gitleaks detect --no-banner --redact
```

Attendu : `no leaks found`. Une fuite est un échec, pas une remarque.

### 2. Secrets en dur

Motifs forts ( `AKIA…`, `ghp_…`, `sk-…`, clé privée PEM) ignorés quand la ligne réfère à `secretName`, `secretKeyRef` ou
`os.environ` (références K8s et variable d'environnement = légitimes)..

Exclure `.venv/`, `node_modules/`, `data/` du parcours des fichiers. Le skill sécurité autorise les données synthétiques
en fixtures de test. Les seuls « hits » légitimes sont les références K8s et les valeurs fixture.

### 3. SQL

Pas d'instruction SQL dans une f-string. Chercher les lignes qui combinent `f"`, `.format(` ou `%` avec SELECT, INSERT,
UPDATE, DELETE. Attendu : zéro.

### 4. TLS

Dans `k8s/app.yaml` : `tls:`, `secretName:`, annotation `ssl-redirect` ou `force-ssl-redirect`, et `runAsNonRoot` ou
`runAsUser`. Tous requis.

### . RGAA / DSFR — classes contre CSS officiel

Le CSS est minifié. Utiliser **match par substring**, pas une regex qui suppose des espaces. Une regex sur `.fr-x` donne
des faux négatifs sur le CSS compacté. Vérifier `f'.{cls}' notin css` sur le CSS officiel
(`https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@<version>/dist/dsfr.min.css`). Attendu : zéro classe `fr-*` manquante.

Structure sémantique attendue : `lang="fr"`, `<header>`, `<main>`, `<footer>`, `fr-skiplinks`, `aria-live`,
`name="viewport"`. Pas de couleur hex inline (seulement des tokens `var(--…)` DSFR).

### 6. RGPD

Pas de champ personnel (exemple `author`) dans la persistance. Une route de suppression ou `cleanup` doit exister
(`DELETE` ou `cleanup` requis). Le skill RGPD exige la minimisation des données.

### 7. Git — trailer sur chaque commit

Piège le plus courant : un commit de correction rapide fait en cours de session est délivré sans trailer, et un auditqui
vérifie seulement le dernier commit ne le voit pas. Vérifier commit par commit, ne pas s'arrêter au HEAD :

```bash
cd <repo> && for h in $(git rev-list --reverse HEAD); do
  git show -s --format='%B' "$h" | grep -q 'Co-Authored-By: gouv-fr-code' || echo "MISSING TRAILER: $h"
done
```

Auditer aussi : `git status --porcelain` vide (arbre propre), `.gitignore` avec `.venv/`, `.env`, `node_modules/`,
`vendor/`, `__pycache__/`, `*.pyc`, et des commits Conventional (`feat|fix|docs|style|refactor|test|chore(scope)?:`).

Correction d'un commit sans trailer sur une branche non partagée : `git commit --amend` (reprendre le message, ajouter
le trailer, conserver le récapitulatif). `--force` est interdit sur les branches partagées ; localement, réécrire est
sûr.

Piège de propreté : le script d'audit lui-même ( un `.py` écrit dans le dépôt puis lancé) **salit l'arbre git** et fait
échouer le check « arbre propre ». L'écrire dans `/tmp/`, ou le gitignore, ou le supprimer après la passation. L'arbre
doit être propre à la fin de l'audit.

### 8. Tests

`. .venv/bin/activate && python -m pytest -q` : vert. Le décompte doit être cohérent avec celui documenté dans
`AGENTS.md``. Signaler toute dérive de documentation.

## À la fin

Quand un écart est corrigé, re-exécuter **toute** la suite : la vérification est de bout en bout. Puis committer la
correction en Conventional plus trailer. Les skills `gouv-fr-*` sont user-owned : ne pas les patcher, recommander
`hermes curator adopt` si la curation est souhaitée.
