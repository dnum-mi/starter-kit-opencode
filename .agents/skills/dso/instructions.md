# Groupe `dso` : CI/CD, Helm, Cloud Pi Native

> Chargé en plus du socle `AGENTS.md`, par le plugin (`"groups": ["dso"]`) ou par URL : voir le README.

## Invariants

- **Vérifier au PR, pas au déploiement** : chart rendu (`helm template`) et contrôlé par `check-cpin-rules.py` en CI avant toute merge.
- **Suivre le runbook `deploiement-cpin` phase par phase**, sans sauter de porte.
- **Ne jamais demander, lire ni écrire la valeur d'un token ou d'un secret** : l'humain la saisit (console CPiN, GitHub, Vault) ; l'agent vérifie seulement que le nom existe.
- La **console CPiN** est la source de vérité ; l'UI ArgoCD et le GitLab interne ne se modifient pas à la main.

## Skills

| Skill | Quand l'utiliser |
|-------|-----------------|
| `deploiement-cpin` | **Point d'entrée** pour déployer sur Cloud Pi Native : runbook par phases (prérequis, values, vérification, livraison) et dépannage (quota, mauvaise image, 404, 503, synchro) |
| `helm-chart-cpin` | Créer ou adapter un chart Helm pour CPiN : template tobi, checklist pré-PR, `check-cpin-rules.py` |
| `cicd-fabnum` | Écrire ou relire un `ci.yml`/`cd.yml` avec fabnum-cicd, releases, `sync-cpin` et ses secrets |

## Documentation interne (OKF)

[`docs/okf/`](https://github.com/dnum-mi/starter-kit-opencode/tree/main/docs/okf) regroupe la connaissance CI/CD (fabnum-cicd), Helm et Cloud Pi Native au format OKF.
Point d'entrée : `docs/okf/quickstart.md` (routage par intention). Les sources amont font autorité ; la doc n'est pas un skill.
