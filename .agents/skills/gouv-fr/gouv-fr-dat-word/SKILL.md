---
name: gouv-fr-dat-word
description: Rend un document d'homologation MirAI (DAT, et à terme AIPD/dossier d'homologation) au format Word (.docx) ministériel, en appliquant le modèle officiel avec typographie française, diagrammes mermaid et mise en page professionnelle.
category: security
version: 1.0.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, homologation, dat, docx, mirai, rendu]
    related_skills: [gouv-fr-dat-homologation, gouv-fr-templates-email]
---


# Gouv-fr — Homologation MirAI (rendu .docx)

Cette skill **transforme un contenu d'homologation (Markdown) en `.docx` ministériel**, en s'appuyant
sur le **modèle officiel** `MODELE_DAT_MirAI.docx` (maintenu dans la skill sœur `gouv-fr-dat-homologation`).
Elle est le **pendant « rendu »** de `gouv-fr-dat-homologation`, qui produit le **contenu**.

```
gouv-fr-dat-homologation         →   contenu Markdown fidèle au modèle (DAT_«service»_v0.1.md)
/dat-word     →   rendu .docx ministériel sur le modèle (DAT_«service»_v0.1.docx)
```

## Quand l'utiliser

- Après `gouv-fr-dat-homologation` (ou tout contenu Markdown respectant la structure du modèle), pour
  produire le livrable Word attendu au dossier d'homologation.
- Pour n'importe quel service : la skill est **générique** et réutilisable par tous les agents.

## Pré-requis

- **`python-docx`** (`pip install python-docx`). Si l'environnement courant ne l'a pas, l'installer
  dans un venv jetable.
- Le **modèle** `MODELE_DAT_MirAI.docx`. Par défaut la skill le lit dans la skill sœur
  (`..gouv-fr-dat-homologation/dat/MODELE_DAT_MirAI.docx`) ; surchargeable via `--model`.
- *(Optionnel, pour les diagrammes mermaid)* **`mermaid-cli`** (`npx -y @mermaid-js/mermaid-cli`,
  ou `mmdc` sur le PATH) **+ un Chrome/Chromium local** (auto-détecté ; sinon `--chrome`). Rendu
  **100 % local, aucun service externe**. Absent ⇒ repli automatique en texte à chasse fixe.
  En environnement sandboxé, rediriger le cache npm : `--npm-cache <dossier inscriptible>`.
- **Logo de la page de garde** : `assets/logo_minint_2020.png` (bloc-marque MININT, fond
  transparent) **versionné dans la skill** — voir « Logo » plus bas. Absent ⇒ rendu sans logo.

## Entrée attendue (contrat avec `gouv-fr-dat-homologation`)

Un Markdown **fidèle à la structure du modèle**, avec ce mapping de niveaux de titres :

| Markdown | → Style modèle | Exemple |
|---|---|---|
| `## `   | Heading 1 | `## 1. Propos liminaires` |
| `### `  | Heading 2 | `### 2.1 Objet du document` |
| `#### ` | Heading 3 | `#### 5.1.1 Description du service` |

Le titre `#` et le bloc de méta en tête (avant le premier `##`) sont **ignorés** (déjà sur la page de
garde). Sont rendus : **tableaux** Markdown (`| … |`), **listes à tirets** (`- ` → puce « - » avec
retrait pendant), **code inline** `` `…` `` (chasse fixe, **non** typographié), **blocs de code**
```` ``` ```` (chasse fixe — pour l'ASCII résiduel), **diagrammes** ```` ```mermaid ```` (rendus en
**image**, voir ci-dessous), **citations** (`> `), **gras** (`**…**`), **italique** (`*…*`). Tout le texte
de prose passe par la **normalisation typographique française** (voir ci-dessous).

La table **« Suivi des mises à jour »** placée dans le bloc de méta (avant le premier `##`) est, par
exception, **rendue** : elle **peuple la table de la page de garde** du modèle (en-tête conservé).

**Conseils de lisibilité (côté contenu).** Pour un rendu fluide : séparer les paragraphes par une
**ligne vide**, sortir les énumérations en **listes `-`**, et **éviter le gras `**…**` dans la prose**
(réserver l'emphase à l'*italique*) — le gras alourdit la lecture.

> Les garde-fous de contenu (ne jamais inventer, aucune valeur réelle : IP/port d'écoute/hôte/clé,
> matrice des flux en port standard, `[À CONFIRMER]` / `N/A`) relèvent de `gouv-fr-dat-homologation`.
> Cette skill **ne fait que le rendu** et ne réécrit pas le contenu.

## Utilisation
```bash
python render_docx.py \
  --input  private/DAT_«service»_v0.1.md \
  --output private/DAT_«service»_v0.1.docx \
  --service "«Nom du service»" --version "v0.1" --date "21 juin 2026" \
  [--model /chemin/MODELE_DAT_MirAI.docx]
```

Sortie dans `private/` à la racine du repo cible (créer le dossier s'il manque + **garantir** qu'il
est ignoré dans `.gitignore` sous `# Sorties locales sensibles (audit, homologation) — ne pas committer`).
Tout va dans `private/` ; `homologation-output/` est **déprécié**.

## Ce que fait le rendu (sur le modèle, sans repartir d'une page blanche)

- **Conserve** la page de garde et le champ **Sommaire (TOC)** du modèle ; renseigne garde
  (service / version / date) et retire la mention « — MODÈLE ».
- **Supprime** la page « Comment utiliser ce modèle » et **tous les encadrés d'instruction « ✎ »**.
- **Remplace** le squelette de corps par le contenu fourni, avec les **styleId réels** du modèle
  (`Heading1/2/3` — l'accès par nom de style peut échouer, d'où l'usage du styleId).
- **Saut de page avant chaque section de niveau 1** ; `keep_with_next` sur les titres ;
  **contrôle veuves/orphelines** (`widowControl`) → pas de ligne isolée en haut/bas de page.
- **Page de garde épurée** : la table **« Suivi des mises à jour »** est mise sur une **page
  séparée** (saut de page avant le titre) et en **police réduite** (`VERSION_TABLE_PT`).
- **Tableaux** : en-tête répété (`tblHeader`), lignes **non sécables** (`cantSplit`), bordures légères.
- **Sommaire (TOC)** : le champ du modèle (encapsulé dans un `w:sdt`, non reconstruit) est remplacé
  par un **champ TOC standard** → reconnu par Word **et** LibreOffice. Il se met à jour à
  l'**ouverture dans Word** (champ *dirty* + `updateFields`) ; dans **LibreOffice** : Outils ▸
  Actualiser ▸ Tout (ou F9). Repli manuel : **Ctrl+A puis F9**. Option `--toc-bake` : tente un
  pré-remplissage via LibreOffice (vérifié ; **peu fiable en *headless*** — repli automatique).

## Diagrammes mermaid (rendu image)

Tout bloc ```` ```mermaid … ``` ```` est **rendu en PNG et inséré** centré, à la largeur utile de la
page. Le rendu est **local** (`mermaid-cli` + Chrome local, `PUPPETEER_EXECUTABLE_PATH`) — **aucun
appel à un service externe** (on n'utilise PAS `mermaid.ink` : un DAT ne doit pas voir son
architecture exfiltrée). Si l'outillage manque (ou `--no-mermaid`), repli **sans perte** : la source
mermaid est rendue en chasse fixe. Avantage : la même source rend nativement sur GitHub/GitLab.

## Typographie française (le français l'emporte)

Tout le texte de prose (titres, paragraphes, listes, **cellules de tableau**, citations) est passé
par `normalize_typography` — conventions de l'**Imprimerie nationale**, **idempotent**, **100 % local** :

- **insécable** `U+00A0` avant `:`, fine insécable `U+202F` avant `;` `!` `?` et à l'intérieur des
  guillemets ; insécable avant `% € ° ‰` ; séparateur de milliers en fine (`30 000`) ;
- apostrophe droite → courbe `’` ; guillemets droits `"…"` en prose → `« … »`.
- **Règle d'or** : on ne **convertit** qu'une espace **déjà présente**, jamais on n'en **ajoute**
  (préserve `12:30`, `clé:valeur`, URLs, ratios). Sont **exclus** : code inline `` `…` ``, blocs de
  code, source mermaid, URLs et e-mails.
- En cas de conflit FR/EN, le **français gagne**. Fine `U+202F` qui s'affiche en « tofu » selon la
  police : basculer la constante `THIN_NBSP_FALLBACK = True` (repli sur `U+00A0`).

La **page de garde** (issue du modèle) n'est volontairement pas retypographiée.

## Logo de la page de garde

Un logo PNG (bloc-marque MININT) est inséré **centré en tête de garde**, largeur `LOGO_WIDTH_CM`
(4 cm). Options : `--logo <chemin>` (défaut `assets/logo_minint_2020.png`), `--no-logo` (repli sans
perte + avertissement). Asset introuvable ⇒ rendu **sans logo** (jamais d'échec).

L'asset est **vendorisé** dans `assets/` (versionné, hors `private/`). Conformément à la doctrine
**locale**, il n'est **jamais** téléchargé au rendu. Régénération (build unique, hors ligne au rendu) :
récupérer le SVG source puis le rasteriser **localement** (ici via Chrome headless,
`--default-background-color=00000000` pour la transparence — Chrome peut ne pas rendre la main proprement
en environnement sandboxé, mais le PNG est écrit avant ; ou via `rsvg-convert`/`cairosvg`/`resvg`).
**Jamais** de service de conversion en ligne.

## Limites connues

- Les **encadrés bleus de référence socle « ◆ »** du modèle ne sont pas réinjectés tels quels : le
  contenu Markdown doit déjà **porter le texte de socle** (conservé par `gouv-fr-dat-homologation`).
- La table **« Suivi des mises à jour »** est peuplée depuis le bloc de méta du Markdown
  (4 colonnes attendues : Version, Date, Auteurs, Commentaire ; l'**en-tête** reste celui du modèle)
  et placée sur une **page séparée**.
- Le **sommaire** se met à jour à l'ouverture (Word) ou via **Outils ▸ Actualiser ▸ Tout** /
  **F9** (LibreOffice). Le pré-remplissage `--toc-bake` exige un LibreOffice capable de mise en
  page : **non garanti en *headless***.
- Vérifier visuellement la pagination une fois ouvert dans Word/LibreOffice.

## Maintenance

Le **modèle** et les **garde-fous de contenu** vivent dans `gouv-fr-dat-homologation`. Cette skill ne porte
que la **logique de rendu** (`render_docx.py`). Versionner les évolutions dans `CHANGELOG.md` (format
`vMAJEUR.MINEUR`). À pousser dans le dépôt de skills partagé `IA-Generative/agent-skills`
(`skills/dat-word/`) pour être disponible à toute l’équipe.
