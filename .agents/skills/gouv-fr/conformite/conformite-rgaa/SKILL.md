---
name: conformite-rgaa
description: Vérifie la conformité d'un service de l'État — RGAA (accessibilité), DSFR (design system), RGPD (données et cookies) — et met en place un gestionnaire de cookies conforme.
---

# Gouv-fr — Conformité (RGAA, DSFR, RGPD, cookies)

## Quand utiliser

- Contrôler la conformité d'une interface avant livrage (accessibilité, design system, données).
- Mettre en place ou reprendre un **gestionnaire de cookies** conforme RGPD sur un site DSFR.

Ne pas utiliser pour : la gestion de données personnelles autres que les cookies, ni l'audit de conformité
globale d'une application (→ `audit-conformite`).

## RGAA — accessibilité

Contraste validé (WCAG AA), navigation clavier testée, tests d'accessibilité qui passent.

## DSFR — design system de l'État

Classes et tokens DSFR vérifiés **contre le CSS officiel** (pas de couleurs custom). Voir `dsfr` pour
l'installation et le contrôle des classes.

## RGPD — protection des données

Aucune donnée personnelle non justifiée ; aucun secret en production ; pas de données sensibles dans les
fixtures.

## Cookies — Tarte au Citron

Un site DSFR a besoin d'un gestionnaire de cookies conforme RGPD ; Tarte au Citron est l'alternative au
composant cookie natif du DSFR (encore en développement).

**Pièges connus** :
- L'ordre de chargement des CSS est impératif : `tarteaucitron` d'abord, thème ensuite.
- Le thème réduit la police d'icônes aux 3 glyphes utilisés : ne pas ajouter de classes d'icônes hors de
  cette sous-police.
- Le composant cookie natif du DSFR étant en développement, prévoir la solution intermédiaire.

**Vérification** : barre de cookies stylée aux couleurs DSFR ; chaque service (accepter/refuser) configure bien
`tarteaucitron` ; le consentement persiste entre les pages (cookie `tarteaucitron` présent).

Détails : [`references/source-gouv-fr-cookies-rgpd.md`](references/source-gouv-fr-cookies-rgpd.md) et
[`references/source-gouv-fr-compliance-rgaa.md`](references/source-gouv-fr-compliance-rgaa.md)

## Checklist de conformité (avant de livrer)

- [ ] Contraste validé (WCAG AA)
- [ ] Navigation clavier testée
- [ ] Classes/tokens DSFR vérifiés contre le CSS officiel (pas de couleurs custom)
- [ ] Aucun secret en production
- [ ] RGPD : pas de données personnelles non justifiées
- [ ] Tests d'accessibilité passent
