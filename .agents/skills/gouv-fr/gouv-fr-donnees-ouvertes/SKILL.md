---
name: gouv-fr-donnees-ouvertes
description: "Données ouvertes publiques du SIG (schémas, JSONL)."
category: data
version: 0.1.1
author: Hermes Agent (Nous Research)
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [data, open-data, sig, json, communication, ref, schema]
    related_skills: [gouv-fr-securite, gouv-fr-compliance-rgaa, gouv-fr-datagouv-apis]
---

# Gouv-fr — Données ouvertes du SIG

Dépôt de référence des schémas et jeux de données ouverts publiés par le Service d'Information du Gouvernement (SIG) sur
data.gouv.fr et schema.data.gouv.fr.

## Quand utiliser

- Accéder aux données ouvertes de la communication publique française.
- Structurer ou publier des données selon les schémas du SIG.
- Consommer les données du SIG (communiqués de presse, gouvernements, thématiques).

Don't use for: données hors communication publique, schémas sans validation SIG.

## Référence rapide
```bash
git clone https://github.com/GouvernementFR/referentiel-donnees-communication-publique.git
```

| Dossier | Contenu |
|---|---|
| `thematiques/` | Thématiques et sous-thématiques de l'action gouvernementale |
| `personnalites/` | Personnalités publiques (exercice + historique) |
| `communiques-de-presse/` | Communiqués de presse (JSONL + `schema.json`) |
| `gouvernements-et-ministeres/` | Historique des gouvernements et ministères |
| `missions-essentielles/` | Missions essentielles |

## Procedure

Pour chaque dataset, le couple fichier de données + `README.md` documentaire :

- `thematiques/thematiques.json`
- `personnalites/personnalites.json`
- `communiques-de-presse/communiques.jsonl` (format JSONL/NDJSON, schéma dans `schema.json`)
- `gouvernements-et-ministeres/gouvernements-et-ministeres.json`

## Pièges
- Les données évoluent régulièrement : vérifier `CHANGELOG.md` du dépôt avant usage, ne pas coder en dur une version.
- Les communiqués de presse sont en JSONL : parser ligne par ligne (une ligne = un objet JSON), jamais le fichier entier comme un seul JSON.
- Les schémas font autorité sur schema.data.gouv.fr.

## Vérification
- Chaque fichier de données valide contre son `schema.json` (`ajv`, `check-jsonschema`, ou `jsonschema` Python).
- JSONL : nombre de lignes == nombre d'objets parsés.
