# CDN Integration Recipe

Quand npm n'est pas disponible, intégrer le DSFR via jsDelivr (le paquet npm est servi tel quel, `dist/` inclus).

## URLs CDN

Version vérifiée : 1.15.3. Dernière version : `https://data.jsdelivr.com/v1/packages/npm/@gouvfr/dsfr/resolved`.

```html
<!-- dans <head> -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.15.3/dist/dsfr.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.15.3/dist/utility/utility.min.css">
<!-- avant </body> -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.15.3/dist/dsfr.module.min.js"></script>
<script nomodule src="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.15.3/dist/dsfr.nomodule.min.js"></script>
```

## Polices

Inutile d'ajouter Google Fonts : le CSS référence ses polices (`IBM Plex Sans`, etc.) en URLs relatives `fonts/…`, que jsDelivr résout automatiquement sous `@gouvfr/dsfr@<version>/dist/fonts/`. En hébergement local, copier `dist/fonts/` à côté du CSS.

## Validation

1. Aucun 404 sur les ressources (vérifier par HEAD requests, ex. `curl -sI`).
2. Les classes utilisées existent dans le CSS officiel : `python3 ../scripts/verify_dsfr.py index.html`.
3. Les variables de design (`--blue-france`, `--red-marianne`, …) sont définies par le CSS chargé.

## Pièges

- Ne pas mélanger les versions : tous les fichiers CDN doivent épingler la MÊME version.
- Le CDN ne fonctionne pas hors ligne sans cache.
- Les pictogrammes/icônes dépendent de `utility.min.css` EN PLUS de `dsfr.min.css` — lier les deux.
- Charger `dsfr.module.min.js` avec `type="module"` + `dsfr.nomodule.min.js` comme fallback `nomodule` ; `dsfr.min.js` n'existe pas et renvoie 404.
