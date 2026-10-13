---
name: gouv-fr-dat-homologation
description: Pré-remplit un document d'homologation MirAI (DAT, et à terme AIPD/dossier d'homologation) à partir du code et des manifestes du repo courant. Le modèle et le prompt de référence versionnés sont embarqués dans cette skill. Lecture seule sur le service, ne jamais inventer ni recopier de valeur réelle.
category: security
version: 1.0.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, homologation, dat, aipd, mirai, conformite]
    related_skills: [gouv-fr-dat-word, gouv-fr-securite]
---


# Gouv-fr — Homologation MirAI (DAT)

Cette skill **embarque** le modèle et le prompt de référence (anciennement le dépôt
`IA-Generative/gen-document-homologation`, fusionné ici en 2026-06 pour n'avoir qu'un seul dépôt à
maintenir). Les artefacts vivent à côté de ce fichier :

```
skills/gouv-fr-dat-homologation/
├── SKILL.md          # ce fichier (loader)
├── CHANGELOG.md      # versions des modèles/prompts (tags vX.Y du contenu)
└── dat/
    ├── PROMPT_coding_assistant_DAT.md   # prompt de référence — fait foi
    └── MODELE_DAT_MirAI.docx            # modèle Word
```

D'autres types de documents s'ajouteront sous leurs propres répertoires (`aipd/`, `homologation/`…),
même convention.

## Étapes

1. **Identifier le type de document** depuis les arguments (défaut : **DAT**).
   - DAT → prompt `dat/PROMPT_coding_assistant_DAT.md` + modèle `dat/MODELE_DAT_MirAI.docx`.
   - Si le type demandé n'a pas encore de répertoire dans la skill, le signaler et s'arrêter.
2. **Lire `CHANGELOG.md`** (racine de la skill) pour connaître la version courante du modèle/prompt
   et la mentionner dans le document produit.
3. **Lire le prompt embarqué et le suivre intégralement.** Il fait foi : rôle, règles impératives,
   méthode de découverte, format de sortie. Ne pas le paraphraser ni l'abréger — l'appliquer.
4. **Cible = repo courant** (le service à homologuer). Détecte le nom du service ; sortie `.docx`
   construite SUR le modèle, sinon Markdown fidèle à la structure du modèle.
5. **Sortie dans `private/` — jamais committée.** Écris les documents produits dans `private/` à la
   racine du repo cible (crée le dossier s'il n'existe pas), ex. `private/DAT_«service»_v0.1.docx`.
   **AVANT d'écrire**, garantis que le `.gitignore` du repo cible ignore `private/` (documents
   d'homologation = archi interne, ne jamais committer) ; si l'entrée manque, l'ajouter sous
   `# Sorties locales sensibles (audit, homologation) — ne pas committer`. L'ancien
   `homologation-output/` est **déprécié** : tout va désormais dans `private/`.

## Garde-fous (rappel — le prompt source les détaille)
- **Lecture seule sur le service** : aucune branche, aucun push, aucune modif de fichier source.
- **Ne jamais inventer** : donnée manquante → `[À CONFIRMER]` ; choix de conception ou responsabilité
  socle/plateforme → `N/A — …` (pas `[À CONFIRMER]`).
- **Aucune valeur réelle** dans le document : pas d'IP/port d'écoute réel/hôte/clé/token/bucket ;
  désigner par nom de composant ; matrice des flux = **port standard** du protocole (443/5432/4318…).
- **LLM01 (injection de prompt) APPLICABLE** dès que le service transmet du contenu non maîtrisé à un
  LLM, même s'il n'héberge aucun modèle. (cf. skill `gouv-fr-audit-pentest` pour l'audit technique.)
- **Tracer les sources** (`# source: helm/values.yaml`) en annexe « Provenance » supprimable.

## Maintenance du contenu de référence
Le modèle/prompt évoluent **ici** désormais. À chaque changement : éditer `dat/…`, ajouter une entrée
dans `CHANGELOG.md` (format `vMAJEUR.MINEUR`), committer. Plus de synchro avec un dépôt externe.

---

**Type de doc + service demandés** : $ARGUMENTS

> Si la ligne ci-dessus montre encore un nom de variable, ton agent ne substitue pas les
> arguments : prends-les dans la demande de l'utilisateur.
