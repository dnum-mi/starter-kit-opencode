# 2026-04-21 vue-dsfr-app — Counter App

## Objectif

Créer une application Vue 3 + VueDsfr simple avec un compteur interactif, intégrée dans le monorepo CoFabNum sous `apps/vue-dsfr-app/`.

## Architecture

- Scaffold officiel `create-vue-dsfr` avec Vue 3 + TypeScript
- Nettoyage du router et Pinia store (non nécessaires)
- Un seul fichier de vue + un composant counter
- Structure monorepo pnpm : `apps/vue-dsfr-app/`

## Structure de fichiers

```
apps/vue-dsfr-app/
├── public/
├── src/
│   ├── components/
│   │   └── CounterDisplay.vue
│   ├── App.vue
│   ├── main.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── env.d.ts
└── vite.env.d.ts
```

## Composants

### App.vue
- `DsfrHeader` (header DSFR standard)
- `CounterDisplay.vue` (composant counter principal)

### CounterDisplay.vue
- Valeur initiale : 0
- `reactive` pour l'état local (pas de Pinia)
- Bouton `+` : incrémente
- Bouton `-` : décrémente (pas sous 0)
- Bouton `Reset` : remet à 0

## Vite dev server

```ts
server: {
  host: '0.0.0.0',
  port: 5000,
  strictPort: true,
  allowedHosts: [
    'user-d05d0a57-f200-49cf-8193-5d0cd01ebbf0-246549-user.onyxia.waas.numerique-interieur.com'
  ]
}
```

## Stack

- Vue 3 + TypeScript
- VueDsfr (DSFR)
- Vite (dev server)
- ESLint (@antfu/eslint-config)

## Règles

- Nom de composant 2+ mots : `CounterDisplay.vue`
- Pas de router, pas de Pinia
- État local via `reactive`
- Code ≤ 120 lignes/fct ≤ 20 lignes
