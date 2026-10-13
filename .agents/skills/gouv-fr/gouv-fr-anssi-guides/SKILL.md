---
name: gouv-fr-anssi-guides
description: "Trouver et consulter le bon guide ANSSI via l'API MesServicesCyber : catalogue des guides français et des publications anglaises sans équivalent, aiguillage et citation de la source. Sécurité hors développement (réseau, pare-feu, Active Directory, Wi-Fi, virtualisation, gestion de crise, EBIOS, cryptographie post-quantique)."
category: security
version: 0.1.0
author: etalab-ia, Hermes Agent
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [anssi, securite, guides, catalogue, etat, gouv-fr, conformite, homologation]
    related_skills: [gouv-fr-securite, gouv-fr-audit-pentest, gouv-fr-dat-homologation, gouv-fr-audit-safety]
---

# Gouv-fr — Guides ANSSI (catalogue et consultation)

> Source : [`etalab-ia/skills`](https://github.com/etalab-ia/skills) (`anssi-guides`), adapté au préfixe `gouv-fr-`. Ce skill **localise et cite** les guides ; le référentiel de règles de développement est `gouv-fr-securite` (périmètre plus restreint que la skill upstream `securite-developpement`, non reprise ici).

Cette skill aiguille vers les guides publiés par l'ANSSI et les consulte à la demande. Elle **localise et cite, elle ne pré-digère pas** : le référentiel de règles applicables au développement, lui, est la skill upstream `securite-developpement` ([`etalab-ia/skills`](https://github.com/etalab-ia/skills), non reprise ici — notre équivalent partiel est `gouv-fr-securite`).

## Workflow

1. **Interroger l'API canonique** — `https://messervices.cyber.gouv.fr/api/guides`. Retenir `.langue == "FR"` ainsi que les identifiants anglais sans équivalent français listés dans [`scripts/included-english-guide-ids.json`](scripts/included-english-guide-ids.json), puis chercher les mots-clés et synonymes du sujet dans `nom`, `description`, `thematique`, `collections` et `besoins` (ex. « SSO » → OpenID Connect ; « conteneurs » → Docker, cloisonnement, virtualisation). Les champs `collections` et `besoins` permettent aussi de restreindre la recherche par public ou objectif (`ETRE_SENSIBILISE`, `REAGIR`, `SECURISER`, `SE_FORMER`). Utiliser [`references/catalogue.md`](references/catalogue.md) comme instantané hors ligne, pas comme source plus fraîche que l'API.

2. **Aiguiller vers la skill de sécurité de développement si la question relève du code.** La skill upstream `securite-developpement` ([`etalab-ia/skills`](https://github.com/etalab-ia/skills)) digère certains guides ★ règle par règle avec leur traçabilité (`[TLS R3]`, `[ESS-BDD]`) et les valeurs chiffrées exactes — ne pas refaire ce travail depuis les PDF. ⚠️ Cette skill **n'est pas reprise** dans `gouv-fr-skills` : notre `gouv-fr-securite` ne couvre que les règles générales, **sans** les valeurs chiffrées ANSSI. Si la réponse doit citer des valeurs réglementaires exactes, s'appuyer sur la skill upstream ou consulter le guide ANSSI via le workflow ci-dessous.

3. **Présenter le ou les guides pertinents** : titre exact (`nom`), date de mise à jour du catalogue (`dateMiseAJour`), collections, besoins, thématique et URL de la fiche (`https://messervices.cyber.gouv.fr/guides/<id>`). S'il existe plusieurs guides sur le sujet, les donner du plus récent au plus ancien et signaler les recouvrements (ex. TLS 2020 et Transition post-quantique de TLS 1.3 2026).

4. **Consulter le contenu si la question le demande** :
   - Pour une vue d'ensemble : utiliser `description` dans la réponse de l'API (le champ contient du HTML, à convertir en texte avant citation).
   - Pour une question précise : prendre les URLs exactes dans `documents[].url`, télécharger le ou les PDF pertinents, puis `pdftotext -layout guide.pdf guide.txt` et aller à la liste récapitulative des recommandations, généralement en fin de document. Ne pas reconstruire une URL de document ni parser la page HTML de la fiche.
   - **Toujours citer** : nom du guide, version si connue, identifiant de la recommandation (`R12`, `M5`…) quand le guide en a. Ne jamais attribuer à l'ANSSI une recommandation qui ne figure pas dans le texte consulté.

5. **Signaler la fraîcheur** : distinguer `dateMiseAJour` (métadonnée de la fiche) de la version imprimée dans le document. Si la réponse doit être garantie à jour, interroger l'API pendant la tâche et vérifier la version dans le PDF ; la date de scan de l'instantané figure en tête de [`references/catalogue.md`](references/catalogue.md).

## Pièges connus

- `dateMiseAJour` est la date de publication ou de mise à jour exposée par la fiche du catalogue ; elle ne donne ni la version du document ni sa référence ANSSI-PA/PG, à vérifier dans le PDF.
- Certains sujets ont plusieurs guides d'époques très différentes (DDoS : 2015 et 2024 ; Active Directory : 2014, 2022, 2023-24 ; virtualisation : 2012, 2016, 2017, 2024) — toujours vérifier la date avant de citer.
- Une même page vitrine peut recouvrir plusieurs documents (« Mécanismes cryptographiques » : deux guides distincts, 2021 et 2026).
- Les « Essentiels » et « Fondamentaux » sont des fiches de sensibilisation de 1-2 pages, pas des guides prescriptifs : le dire quand on les cite.

## Références

| Fichier | Contenu |
|---------|---------|
| [`references/catalogue.md`](references/catalogue.md) | Instantané généré des guides français et publications anglaises sans équivalent : titre, date, collection, besoin, thématique et URL |
| [`scripts/generate-catalogue.sh`](scripts/generate-catalogue.sh) | Génération et validation du catalogue depuis l'API JSON |
| [`scripts/included-english-guide-ids.json`](scripts/included-english-guide-ids.json) | Exceptions anglaises sans équivalent français, incluses explicitement |
