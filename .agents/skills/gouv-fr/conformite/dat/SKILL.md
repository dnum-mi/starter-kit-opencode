---
name: dat
description: Pré-remplit un document d'homologation (DAT) depuis le code et les manifestes, puis produit le livrable Word ministériel correspondant.
category: conformite
version: 0.3.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, homologation, dat, mirai, docx, anssi, gouvernance]
    related_skills: [audit-conformite, conformite-rgaa, securite, audit-pentest]
---

# Gouv-fr — Homologation (DAT) : pré-remplissage et rendu Word

## Quand utiliser

Deux temps, dans cet ordre :

1. **Pré-remplir le DAT** à partir du code et des manifestes du service.
2. **Produire le livrable `.docx`** ministériel à partir du contenu Markdown structuré.

Le skill est **générique** et réutilisable pour n'importe quel service.

## 1. Pré-remplissage depuis le code

### Étapes

Lire le service et ses manifestes, puis remplir les sections du DAT avec la structure attendue par le modèle.

### Garde-fous

- **Lecture seule sur le service** : aucune branche, aucun push, aucune modification de fichier source.
- **Ne jamais inventer** : donnée manquante → `[À CONFIRMER]` ; choix de conception ou responsabilité
  socle/plateforme → `N/A — …` (pas `[À CONFIRMER]`).
- **Aucune valeur réelle** dans le document : pas d'IP/port d'écoute réel/hôte/clé/token/bucket ; désigner par
  nom de composant ; matrice des flux = **port standard** du protocole (443/5432/4318…).
- **LLM01 (injection de prompt) APPLICABLE** dès que le service transmet du contenu non maîtrisé à un LLM,
  même s'il n'héberge aucun modèle. (cf. `audit-pentest` pour l'audit technique.)
- **Tracer les sources** (`# source: helm/values.yaml`) en annexe « Provenance » supprimable.

Détail : [`references/source-gouv-fr-dat-homologation.md`](references/source-gouv-fr-dat-homologation.md)

## 2. Rendu `.docx` ministériel

À partir de n'importe quel contenu Markdown respectant la structure du modèle, produire le livrable Word
attendu au dossier d'homologation.

**Points de méthode** :
- Le rendu part du **modèle**, sans repartir d'une page blanche.
- **Typographie française** : le français l'emporte (espaces insécables, guillemets, etc.).
- Les **diagrammes mermaid** sont rendus en image.
- Logo de la page de garde paramétrable.

Détail, contrat d'entrée et limites connues :
[`references/source-gouv-fr-dat-word.md`](references/source-gouv-fr-dat-word.md)
