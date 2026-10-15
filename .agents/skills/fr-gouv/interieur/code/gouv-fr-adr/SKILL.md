---
name: gouv-fr-adr
description: Rédige une nouvelle ADR (Architecture Decision Record) au format IA-Generative. Utiliser quand une décision d'archi a été prise et doit être tracée (choix de backend, refonte, breaking change, trade-off entre options).
category: workflow
version: 1.0.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, adr, architecture, decision, documentation]
    related_skills: [gouv-fr-projet-structure, gouv-fr-workflow-dev]
---


# Gouv-fr — ADR (Architecture Decision Record)

## 1. Localisation
Trouve le dossier ADR du repo :

!`find . -type d \( -iname "adr" -o -iname "adrs" \) -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -3`

Si aucun n'existe : créer `docs/adr/` à la racine.

## 2. Numérotation
Lire les ADR existantes pour le prochain numéro (`ADR-NNNN`). Format 4 chiffres, zéro-paddé.

## 3. Template

```markdown
# ADR-NNNN — <titre court>

- **Statut** : Proposed | Accepted | Superseded by ADR-XXXX
- **Date** : YYYY-MM-DD
- **Décideurs** : <noms ou équipe>
- **Sujet** : 1 phrase

## Contexte
Le problème ou la situation qui rend une décision nécessaire. Contraintes, dette,
incident déclencheur. Pas de solution ici.

## Options considérées
### Option A — <nom>
- Description
- Pros / Cons

### Option B — <nom>
- Description
- Pros / Cons

### Option C — <nom> (si pertinent)
- ...

## Décision
**Option retenue : X**

Justification en 3-5 lignes : pourquoi celle-ci, ce qu'on accepte de payer en
contrepartie.

## Conséquences
- **Positives** : ...
- **Négatives** : ...
- **À surveiller** : signaux qui invalideraient la décision

## Suivi
- [ ] Implémentation : <PR ou issue>
- [ ] Doc utilisateur mise à jour
- [ ] Communication équipes concernées
```

## 4. Rédaction
- Style sobre, factuel, FR par défaut (sauf repo en EN).
- Pas de markdown lourd dans le corps (pas de tableaux décoratifs).
- Une ADR ≠ un runbook. Si ça devient un mode d'emploi, déporter dans `docs/runbooks/`.
- Lier l'ADR à la mémoire / aux commits / aux issues GitHub associés.

## 5. Statut initial
- `Proposed` si la décision est en cours de validation.
- `Accepted` si déjà actée et appliquée.

---

**Sujet de l'ADR** : $ARGUMENTS

> Si la ligne ci-dessus montre encore un nom de variable, ton agent ne substitue pas les
> arguments : prends-les dans la demande de l'utilisateur.
