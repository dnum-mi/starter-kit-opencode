# Changelog

Toutes les versions notables des modèles et prompts de ce dépôt.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/) ; versionnement `vMAJEUR.MINEUR`.

## [v1.1] — 2026-06-07

### Modifié
- **Matrice des flux** : la colonne « Port » devient « Port (standard) » ; on indique désormais le
  **port standard du protocole** (443/80/5432/4318…), jamais le port d'écoute réel — modèle et prompt
  (règle 6) alignés (remplace l'ancienne consigne « laisser `[port]` / `[à préciser hors DAT]` »).

### Ajouté (prompt `dat/PROMPT_coding_assistant_DAT.md`)
- **Narration de la rubrique 1** en quatre temps : *le problème → en deux mots → concrètement → comment
  ça marche*, et instruction de **positionnement** vis-à-vis des outils de gestion de parc
  (WAPT/SCCM/Intune) avec schéma d'articulation — pour les services distribués sur des postes/terminaux ;
  rappel que les **politiques d'autorisation et d'exception** restent à la main du gestionnaire de parc.
- **Distinction « héberger un modèle » vs « consommer un service d'inférence »** (règle 8) : un service
  peut ne pas héberger de modèle (pas de GPU) tout en appelant un LLM externe ; si du **contenu non
  maîtrisé** lui est transmis, **LLM01 (injection de prompt) est applicable**.
- **Rendu Word** (règle 9) : les schémas ASCII rendent mal en `.docx` → privilégier une **image**.
- **Marquage `N/A` / responsabilité socle** (règle 1) au lieu de `[À CONFIRMER]` pour les choix de
  conception et les responsabilités plateforme.
- Domaine **« Chaîne logistique logicielle »** dans l'extraction § 7 : **autorisation du cycle de
  déploiement** (RBAC + audit) comme mesure organisationnelle de supply chain ; scan de packages.
- Rappel **confidentialité** : possibilité de conclure à une **absence de traitement de DCP nécessitant
  une AIPD** avec simple mention au DPO.

### Modifié (modèle `dat/MODELE_DAT_MirAI.docx`)
- Encadré d'instruction de la **matrice des flux** (port standard) et **§1** (narration + positionnement).

## [v1.0] — 2026-06-07

### Ajouté
- Modèle de Dossier d'Architecture Technique MirAI (`dat/MODELE_DAT_MirAI.docx`) :
  page de garde, mode d'emploi, sommaire automatique, sections 1 à 6 avec encadrés
  d'instruction et de référence socle, bloc « Service » répétable, tableaux structurés
  (inventaire des composants, matrice des flux, dimensionnement).
- Section 7 « Principes et mesures de sécurité mises en œuvre » : tableau par domaine
  rattaché aux grands référentiels, incluant une ligne « Sécurité IA / LLM ».
- Annexe 8.2 « Référentiels de sécurité » avec liens officiels (OWASP, NIST, ANSSI,
  ISO, EUR-Lex).
- Prompt de pré-remplissage automatisé (`dat/PROMPT_coding_assistant_DAT.md`) :
  méthode de découverte, correspondance section → données, extraction des mesures de
  sécurité, règles « ne jamais inventer » et « aucune valeur réelle », focus OWASP LLM.
- Référence du prompt vers ce dépôt comme source de dernière version.

[v1.0]: https://github.com/IA-Generative/gen-document-homologation/releases/tag/v1.0
