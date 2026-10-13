---
name: gouv-fr-cookies-rgpd
description: "Gère les cookies d'un site DSFR avec Tarte au Citron."
category: qualite
version: 0.1.1
author: Hermes Agent (Nous Research)
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [dsfr, cookie, tarteaucitron, rgpd, consent, management]
    related_skills: [gouv-fr-design-system, gouv-fr-compliance-rgaa, gouv-fr-securite]
---

# Gouv-fr — Cookies et RGPD (Tarte au Citron)

Thème DSFR pour le gestionnaire de consentement cookies Tarte au Citron.

## Quand utiliser

- Un site DSFR a besoin d'un gestionnaire de cookies conforme RGPD.
- Gérer les consentements cookies avec un design DSFR.
- Alternative au composant cookie natif du DSFR.

Don't use for: applications sans cookies tiers, gestion de données personnelles autre que les cookies.

## Prérequis

- Tarte au Citron (tarteaucitron.js) disponible dans le projet
- DSFR installé et configuré

## Référence rapide
```html
<!-- Après les CSS/JS tarteaucitron, ajouter le thème DSFR : -->
<link rel="stylesheet" href="css/dsfr-tarteaucitron.css">
```

## Procedure

1. Copier les fichiers CSS du repo `dsfr-theme-tarteaucitron` dans le projet.
2. Charger le CSS du thème APRES le CSS de tarteaucitron (sinon les styles ne sont pas écrasés).
3. Configurer les services de cookies — doc : [tarteaucitron.io/fr](https://tarteaucitron.io/fr/).

Critère de fin : la barre de cookies affiche les couleurs/typographie DSFR, pas le style par défaut.

## Pièges
- Le composant cookie natif du DSFR est en développement : solution intermédiaire à prévoir.
- L'ordre de chargement des CSS est impératif (tarteaucitron d'abord, thème ensuite).
- Le thème réduit la police d'icônes aux 3 glyphes utilisés (optimisation du chargement) : ne pas ajouter de classes d'icônes hors de cette sous-police sans vérifier leur rendu.

## Vérification
- La barre de cookies apparaît stylée aux couleurs DSFR.
- Chaque service choisi (accepter/refuser) configure bien tarteaucitron.
- Le consentement s'enregistre et persiste entre les pages (cookie `tarteaucitron` présent).
