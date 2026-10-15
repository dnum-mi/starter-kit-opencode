# Format du journal d'hygiène (`hygiene-log.md`)

Le journal vit à la racine du dépôt audité. La courbe n'a de sens que si les
mesures sont comparables : d'une passe à l'autre, **mêmes outils, mêmes
versions (les noter), mêmes flags**. Tout changement d'outillage casse la
comparabilité — le signaler explicitement dans l'entrée concernée et repartir
d'un nouvel état zéro pour la métrique touchée.

Règles de comparaison :

- comparer chaque métrique à la **dernière passe compatible** (mêmes
  définition, outil, commande, périmètre), pas mécaniquement à la dernière
  passe ;
- l'état zéro se remet **par métrique**, pas pour tout le journal ;
- une mesure en erreur ou impossible s'écrit `indisponible` — jamais 0, et
  ni delta ni tendance pour elle ;
- les audits de vulnérabilités sont **contextuels** : la base d'avis évolue
  chaque jour ; noter la date de l'audit et laisser ce compte hors de la
  courbe comparée ;
- décrire la tendance **métrique par métrique** (↓ / → / ↑ / non comparable) ;
  si elles divergent, conclure « tendance mixte » — pas de score composite.

## Structure

Une entrée par passe, la plus récente en haut. Chaque entrée contient :

1. un en-tête : date (AAAA-MM-JJ), commit mesuré (`git rev-parse --short
   HEAD`), durée de la passe ;
2. le tableau des mesures (colonnes ci-dessous, une ligne par métrique) ;
3. les actions menées (1 à 3, bornées) et la tendance : ↓ descend, → stagne,
   ↑ monte.

Colonnes du tableau : **Métrique | Outil (version) | Commande exacte | Valeur
| Delta vs passe précédente**.

## Exemple rempli (deux passes fictives)

### Passe du 2026-07-25 — commit `a1b2c3d` — 55 min

| Métrique | Outil (version) | Commande exacte | Valeur | Delta |
|---|---|---|---|---|
| Duplication | jscpd 4.0.4 | `npx jscpd --min-tokens 50 src/` | 6,8 % | −1,4 pt |
| Complexité moyenne | radon 6.0.1 | `radon cc -s -a src/` | B (7,2) | −0,6 |
| Couverture | pytest-cov 5.0.0 | `pytest --cov=src --cov-report=term` | 71 % | +3 pt |
| Vulnérabilités (high+) | pip-audit 2.7.3 | `pip-audit -r requirements.txt` (base du 2026-07-25) | 1 | — (contextuelle) |
| Volume (lignes) | git 2.45 | `git ls-files 'src/**' \| xargs wc -l \| tail -1` | 12 480 | −310 |

Actions menées :

- extraction de l'utilitaire de pagination dupliqué dans 4 modules (tests de
  protection ajoutés avant la refactorisation) ;
- ajout de tests sur `billing/`, le module le moins couvert.

Tendance : ↓ — la duplication et le volume baissent, la couverture monte.

### Passe du 2026-07-18 — commit `e4f5a6b` — 60 min (état zéro)

| Métrique | Outil (version) | Commande exacte | Valeur | Delta |
|---|---|---|---|---|
| Duplication | jscpd 4.0.4 | `npx jscpd --min-tokens 50 src/` | 8,2 % | — |
| Complexité moyenne | radon 6.0.1 | `radon cc -s -a src/` | B (7,8) | — |
| Couverture | pytest-cov 5.0.0 | `pytest --cov=src --cov-report=term` | 68 % | — |
| Vulnérabilités (high+) | pip-audit 2.7.3 | `pip-audit -r requirements.txt` (base du 2026-07-18) | 2 | — (contextuelle) |
| Volume (lignes) | git 2.45 | `git ls-files 'src/**' \| xargs wc -l \| tail -1` | 12 790 | — |

Actions menées : aucune (mesure initiale).

Tendance : — (état zéro).
