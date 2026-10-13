# Copie vendorée — ne pas éditer ici

**Amont / source de vérité :** https://github.com/etiquet/controle-qualite-code (public)

`SKILL.md` et `references/` de ce dossier sont une **copie à l'octet près** de l'amont.
Une modification faite ici serait écrasée à la prochaine synchronisation, et ferait
diverger deux copies qui doivent rester identiques.

Seul `UPSTREAM.md` (ce fichier) est propre au dépôt aval.

## Faire évoluer le skill

1. Ouvrir une PR **sur l'amont** — c'est aussi là que les contributions externes
   arrivent, ce dépôt-ci étant interne à l'organisation ;
2. une fois la PR amont fusionnée, resynchroniser ici (ci-dessous) et ouvrir une PR
   sur ce dépôt.

## Resynchroniser depuis l'amont

Depuis la racine de `agent-skills`, avec `UPSTREAM` pointant sur un clone à jour
de l'amont :

```bash
UPSTREAM=~/Documents/GitHub/controle-qualite-code

git -C "$UPSTREAM" switch main && git -C "$UPSTREAM" pull --ff-only
rsync -a --delete "$UPSTREAM"/SKILL.md "$UPSTREAM"/references skills/controle-qualite-code/
```

## Vérifier qu'il n'y a pas de divergence

Sortie vide attendue. Toute sortie signale une édition faite du mauvais côté —
la reporter en amont, puis resynchroniser.

```bash
diff -r "$UPSTREAM"/SKILL.md    skills/controle-qualite-code/SKILL.md
diff -r "$UPSTREAM"/references  skills/controle-qualite-code/references
```

## Pourquoi une copie plutôt qu'un sous-module

`install.sh` pose un symlink par dossier de `skills/`. Un sous-module git
obligerait chaque personne de l'équipe à un `git submodule update` après chaque
`git pull`, sous peine d'une skill silencieusement vide. Le coût de la copie est
une commande de synchro assumée ; le coût du sous-module serait supporté par tout
le monde, à chaque mise à jour.
