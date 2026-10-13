---
name: gouv-fr-templates-email
description: Génère des templates email DSFR pour l'État.
category: templates
version: 0.1.0
author: Hermes Agent (Nous Research)
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [dsfr, email, template, gouv-fr, mail, accessible]
    related_skills: [gouv-fr-design-system, gouv-fr-cookies-rgpd, gouv-fr-compliance-rgaa]
---

# Gouv-fr — Templates email DSFR

Template d'email officiel conforme au DSFR pour les communications des services gouvernementaux.

## Quand utiliser

- Créer un email institutionnel officiel d'un service de l'État.
- Générer un template HTML email responsive et accessible.
- Intégrer un email dans une application web (Drupal, Laravel, etc.).
- Besoin de mode sombre, responsive design et compatibilité Outlook.

Don't use for: newsletters marketing grand public, emails hors administration publique.

## Prérequis

- HTML email client (test sur Outlook, Gmail, Apple Mail)
- Connaissance du DSFR pour personnaliser les couleurs et le logo Marianne

## Référence rapide
```bash
# Clone du repo dsfr-mail
git clone https://github.com/GouvernementFR/dsfr-mail.git
cd dsfr-mail

# Le template principal : template-generique.html
# Contient toutes les sections modulaires réutilisables
```

## Procedure

### Structure du template

Le template `template-generique.html` est structuré en sections modulaires :

1. **En-tête institutionnel** — Logo Marianne + nom du service
2. **Section titre** — Fond coloré ou neutre
3. **Sections de contenu** — Alternance fond blanc/coloré
4. **Blocs texte/image** — Avec ou sans boutons d'action
5. **Zones de mise en avant** — Fonds colorés
6. **Cartes d'information** — 2 colonnes
7. **Bloc contact** — Informations de contact
8. **Pied de page** — Liens de désabonnement et mentions légales

### Utilisation

1. Copier `template-generique.html` dans le projet.
2. Personnaliser le contenu dans chaque section `<table>`.
3. Remplacer les images placeholder par les visuels officiels.
4. Modifier logo Marianne et nom du service.
5. Tester sur les clients de messagerie cibles.

### Mode sombre

Le template supporte le mode sombre via les classes CSS :
- `.darkmode` — Arrière-plan et texte principal
- `.darkmode-1` à `.darkmode-6` — Variantes pour différents éléments
- `.darkmode-button-*` — Styles spécifiques pour les boutons

### Compatibilité

- **Outlook** : Styles MSO spécifiques (VML pour les images)
- **Gmail/Yahoo** : CSS inline recommandé
- **iOS/Android** : Support natif responsive
- **Tables HTML** : Structure robuste pour compatibilité maximale

## Pièges
- Le template n'inclut PAS le code du DSFR lui-même : c'est une adaptation CSS.
- Il est formellement interdit d'utiliser ce template en dehors des sites de l'État.
- Les images doivent être hébergées publiquement pour charger dans tous les clients email.
- Privilégier les styles inline pour Outlook.
- Les tableaux HTML sont obligatoires pour la structure de mise en page.

## Vérification
- Validator HTML email : [Mail-Tester](https://www.mail-tester.com/) ou [Litmus](https://litmus.com/).
- L'email s'affiche correctement sur Outlook, Gmail et Apple Mail.
- Les images se chargent (URLs publiques, pas de local).
- Le lien de désabonnement RGPD est présent et fonctionnel.
- Le contraste respecte les ratios 4.5:1 (normal) et 3:1 (large).