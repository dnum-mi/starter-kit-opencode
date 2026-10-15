# Copie vendorée — ne pas éditer ici

**Amont / source de vérité :** https://github.com/etiquet/controle-qualite-code (public)

Le contenu amont est conservé **à l'octet près** dans `references/source-gouv-fr-code-quality.md`.
`SKILL.md` est une synthèse locale (fusion avec le skill `dev`) : ne pas le remplacer par
le `SKILL.md` amont.

Seul `UPSTREAM.md` (ce fichier) est propre au dépôt aval.

## Faire évoluer le skill

1. Ouvrir une PR **sur l'amont** (les contributions externes y arrivent aussi) ;
2. une fois fusionnée, resynchroniser la référence ci-dessous, relire la synthèse
   `SKILL.md` si le contenu amont a changé, puis ouvrir une PR sur ce dépôt.

## Resynchroniser depuis l'amont

Depuis la racine de ce dépôt, avec `UPSTREAM` pointant sur un clone à jour de l'amont :

```bash
UPSTREAM=~/Documents/GitHub/controle-qualite-code
DEST=.agents/skills/gouv-fr/interieur/code/code-quality

git -C "$UPSTREAM" switch main && git -C "$UPSTREAM" pull --ff-only
cp "$UPSTREAM"/SKILL.md "$DEST"/references/source-gouv-fr-code-quality.md
```

Les autres fichiers de `references/` amont qui existent ici se synchronisent de même, un à un :
ne jamais utiliser `rsync --delete` sur ce dossier (il contient du contenu fusionné).

## Vérifier qu'il n'y a pas de divergence

Sortie vide attendue ; toute sortie signale une édition faite du mauvais côté.

```bash
diff "$UPSTREAM"/SKILL.md "$DEST"/references/source-gouv-fr-code-quality.md
```
