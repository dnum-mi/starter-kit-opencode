---
name: gouv-fr-compliance-rgaa
description: "Conformité État : RGAA, DSFR, RGPD."
category: qualite
version: 0.1.1
author: etalab-ia, Hermes Agent
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, compliance, rgaa, dsfr, rgpd, accessibility, etat, design-system, data-protection]
    related_skills: [gouv-fr-design-system, gouv-fr-projet-structure, gouv-fr-securite]
---

# Gouv-fr — Conformité (RGAA, DSFR, RGPD)

Règles d'accessibilité et conformité réglementaire pour les applications de l'État.

## RGAA (Accessibilité)

- Contraste suffisant (WCAG AA minimum)
- Navigation complète au clavier
- Attributs `alt` pertinents sur les images
- Structure sémantique HTML (headings, landmarks)
- Rôles ARIA quand nécessaire
- Tests d'accessibilité automatisés dans la CI

## DSFR (Design System de l'État)

- Utiliser les composants officiels DSFR et leurs tokens — ne pas customiser sans validation.
- Installation, composants, vérification des classes : voir le skill `gouv-fr-design-system` (le CSS officiel fait foi, ne jamais inventer de classes).

## RGPD (Protection des données)

- Minimisation des données collectées
- Pas de traceur tiers sans consentement (gestion cookies : skill `gouv-fr-cookies-rgpd`)
- Consentement explicitement recueilli
- Droit à l'oubli : suppression des données utilisateur
- Chiffrement des données sensibles

## Checklist de conformité

Avant de livrer :
- [ ] Contraste validé (WCAG AA)
- [ ] Navigation clavier testée
- [ ] Classes/tokens DSFR vérifiés contre le CSS officiel (pas de couleurs custom)
- [ ] Aucun secret en production
- [ ] RGPD : pas de données personnelles non justifiées
- [ ] Tests d'accessibilité passent
