---
type: décision
title: GITHUB_TOKEN, GitHub App ou PAT
description: Quel credential GitHub utiliser dans les workflows fabnum-cicd, selon les besoins (déclenchement de CI, automerge, cross-repo, limites d'API).
tags: [décision, auth, github-app, pat]
---

# GITHUB_TOKEN, GitHub App ou PAT

Source : `fabnum-cicd/docs/workflows/05-authentication.md`. Partir du haut et s'arrêter à la première ligne qui correspond.

| Besoin | Choix |
|---|---|
| build/test/scan/push vers ghcr.io seulement | **`GITHUB_TOKEN`** (rien à configurer, seul `permissions:` compte) |
| PR de release/chart qui doivent déclencher la CI ; automerge ; dispatch vers un autre dépôt ; releases de chart déclenchant `release:` ; limites d'API | **GitHub App** (`APP_CLIENT_ID`, `APP_PRIVATE_KEY`) ou `GH_PAT` |
| `GH_PAT` déjà en place, rien à changer | `GH_PAT` reste supporté |

- Ordre de résolution : **token App → `GH_PAT` → `GITHUB_TOKEN`**. Si App et PAT coexistent, l'App l'emporte (permet de vérifier une migration).
- Fournir un seul de `APP_CLIENT_ID`/`APP_PRIVATE_KEY` **fait échouer** le job (pas de repli silencieux).
- Automerge et dispatch cross-repo échouent explicitement avec le seul `GITHUB_TOKEN`.

## Pourquoi l'App
`GITHUB_TOKEN` ne peut pas déclencher d'autres workflows (anti-boucle) : une PR de release ouverte avec lui **ne lance jamais la CI**.
Le token App n'a pas cette limite, expire en 1 h, n'est pas lié à une personne et offre 5000 req/h (contre 1000/h par dépôt).

## Mise en place de l'App (résumé)
- Une seule App suffit : Metadata (read), Contents, Pull requests, Issues (write), Actions (write pour `dispatch-helm-chart` seulement) ; webhook désactivé.
- Secrets : `APP_CLIENT_ID` = **Client ID** (`Iv23li…`, pas l'App ID numérique), `APP_PRIVATE_KEY` = `.pem` complet.
- Installer sur les seuls dépôts nécessaires : c'est la liste d'installation qui borne une clé fuitée.
- Chaque workflow minte un token **réduit** ; sans `permission-*`, un token hérite de toute l'installation.
- Rulesets exigeant une PR : l'App est la seule à pouvoir être dans la liste de bypass pour pousser le bump du chart (cas ocr-api).
