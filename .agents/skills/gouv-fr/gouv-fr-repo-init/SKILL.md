---
name: gouv-fr-repo-init
description: Initialise un répertoire vide (ou un projet qui démarre) avec les précautions d'usage — git, .gitignore durci anti-fuite, un dossier private/ gitignoré pour les sorties sensibles, une structure logique lisible par un humain, et un anti-leak LOCAL bloquant (pre-commit gitleaks, binaire, sans licence). À lancer au tout début d'un nouveau repo, avant d'écrire du code ou de committer quoi que ce soit.
category: workflow
version: 1.0.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, git, repo, gitignore, gitleaks, initialisation]
    related_skills: [gouv-fr-audit-safety, gouv-fr-securite, gouv-fr-workflow-dev]
---


# Gouv-fr — Initialisation de dépôt

Met en place, sur un répertoire **vide ou quasi vide**, les fondations qu'on
regrette toujours de ne pas avoir posées avant le premier commit : git, un
`.gitignore` durci, un `private/` gitignoré, une arborescence lisible, et un
**garde anti-secret local qui BLOQUE le commit** (pas seulement un avertissement).

> Pendant de la skill `/audit-repo-ouverture` (qui *vérifie* un repo existant) :
> ici on *crée* les bonnes conditions dès le départ.

## Garde-fous

- **Ne jamais écraser** un fichier existant sans le signaler. Si `.gitignore`,
  `README.md` ou `.pre-commit-config.yaml` existent déjà, **fusionner** (ajouter
  les lignes manquantes), ne pas remplacer.
- **Refuser** d'opérer sur un répertoire qui contient déjà des secrets non
  protégés (`.env`, clés) sans d'abord les couvrir par le `.gitignore`.
- **Ne pas committer de secret** : si le working tree contient déjà un secret,
  le faire ignorer AVANT le premier commit.

## Étapes

1. **Cible** = l'argument passé, ou le répertoire courant. Détecter le type de projet
   (présence de `package.json`, `pyproject.toml`, `go.mod`…) pour adapter les
   ignores ; sinon « générique ».

2. **git** : `git init` si `.git` absent. Brancher sur `main`.

3. **`.gitignore` durci** (créer ou fusionner). Couvrir au minimum :
   ```gitignore
   # --- Sorties locales sensibles (audit, homologation, secrets dérivés) — ne pas committer
   private/

   # --- Secrets ---
   .env
   .env.*
   !.env.example
   *.bak-*
   *.secret
   *.pem
   *.key
   *.p12
   *.pfx
   id_rsa*
   id_ed25519*
   *.kubeconfig
   kubeconfig*
   *.tfstate
   *.tfstate.*
   secrets/

   # --- OS / éditeurs ---
   .DS_Store
   .idea/
   .vscode/*.local
   *.swp

   # --- Dépendances / build (selon le type détecté) ---
   node_modules/
   .next/
   dist/
   build/
   __pycache__/
   .venv/
   ```
   Ajouter les ignores spécifiques au type détecté (ex. `coverage/`,
   `*.tsbuildinfo`, `.turbo/`).

4. **`private/`** : créer le dossier (avec un `private/.gitkeep` ou un court
   `private/README.md` expliquant « sorties sensibles, hors git »). Vérifier
   qu'il est bien ignoré (`git check-ignore private/`).

5. **Structure logique par défaut** (créer si absente, adapter au type) — pensée
   pour qu'un humain s'oriente d'emblée :
   ```
   .
   ├── README.md      ← point d'entrée + carte du dépôt
   ├── src/           ← code
   ├── tests/         ← tests
   ├── docs/          ← documentation
   ├── private/       ← sorties sensibles (gitignoré)
   └── .gitignore
   ```
   Le `README.md` contient une section **« Structure du dépôt »** (une ligne par
   dossier de 1er niveau). Ne créer que les dossiers pertinents pour le type.

6. **Anti-leak LOCAL bloquant — pre-commit + gitleaks (binaire, sans licence)** :
   - Créer/fusionner `.pre-commit-config.yaml` :
     ```yaml
     repos:
       - repo: https://github.com/gitleaks/gitleaks
         rev: v8.30.1
         hooks:
           - id: gitleaks
     ```
   - Installer le hook : `pre-commit install` (si `pre-commit` absent :
     `pipx install pre-commit` ou `brew install pre-commit`).
   - **Pourquoi le binaire / pre-commit et pas l'action GitHub** :
     `gitleaks/gitleaks-action@v2` exige une **licence payante pour les
     organisations** et échoue sans rien scanner. Le binaire / hook pre-commit
     est **gratuit, local et bloquant** : `gitleaks` renvoie un code ≠ 0 dès
     qu'un secret est détecté → le commit est refusé.
   - Vérifier que le hook bloque réellement : `pre-commit run gitleaks --all-files`
     doit passer (vert) sur un repo propre.

7. **Premier commit** sain : `git add -A` puis vérifier `git status` ne stage
   **aucun** secret ni `private/`. Committer `chore: init repo (gitignore + private/ + anti-leak gitleaks)`.

8. **Rapport** : résumer ce qui a été créé/fusionné, confirmer que `private/`
   est ignoré et que le hook gitleaks bloque, et lister les éventuels fichiers
   sensibles préexistants désormais couverts.

## Vérifications de fin (toutes doivent passer)
- `git check-ignore private/ .env` → les deux ignorés.
- `pre-commit run gitleaks --all-files` → vert.
- `git status` avant le 1er commit → aucun secret, aucun `private/…` stagé.

---

**Cible / type** : $ARGUMENTS

> Si la ligne ci-dessus montre encore un nom de variable, ton agent ne substitue pas les
> arguments : prends-les dans la demande de l'utilisateur.
