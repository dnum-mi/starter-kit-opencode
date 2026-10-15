# Changelog — dat-word

Versions notables de la logique de rendu `.docx`. Versionnement `vMAJEUR.MINEUR`.

## [v1.3] — 2026-06-28

### Ajouté
- **Sommaire (TOC) reconnu nativement** : le champ TOC encapsulé dans un `w:sdt` (résultat vide,
  ni Word ni LibreOffice ne le reconstruisaient) est remplacé par un **champ TOC standard**
  (`replace_toc_field`). Il se met à jour à l'**ouverture dans Word** (champ *dirty* +
  `updateFields`) et est reconnu comme **index natif par LibreOffice** (Outils ▸ Actualiser ▸
  tout). Option `--toc-bake` : pré-remplissage via LibreOffice (vérifié ; **peu fiable en
  headless** — repli automatique sinon).
- **Table « Suivi des mises à jour » sur une page séparée** (saut de page avant le titre) et
  **police réduite** (`VERSION_TABLE_PT`) → page de garde épurée.
- **Contrôle veuves/orphelines** (`widowControl`) : plus de ligne isolée en haut/bas de page.
- **Italique `*…*`** robuste même lorsqu'il **enveloppe du code inline** (`*(source : `x`)*`).

## [v1.2] — 2026-06-28

### Ajouté
- **Table « Suivi des mises à jour » rendue** (`fill_version_table`) : la table du bloc de méta
  Markdown (jusque-là ignorée car avant le premier `##`) **peuple la table de la page de garde**
  (lignes de données remplacées, en-tête du modèle conservé).
- **Italique `*…*`** désormais rendu (avant : astérisques littérales dans le `.docx`). L'**emphase
  peut envelopper du code inline** (ex. `*(source : `chemin`)*`) : analyse de l'emphase au-dessus
  des marqueurs de code, sans casser les paires `*…*`/`**…**`. Astérisques échappées `\*` littérales.
- **Typographie française** (`normalize_typography`, appelée dans `_add_runs` → couvre titres,
  paragraphes, listes, cellules de tableau, citations). Conventions Imprimerie nationale,
  **idempotente**, **100 % locale** : insécable avant `:`, fine insécable avant `;` `!` `?` et autour
  des guillemets, insécable avant `% € ° ‰`, séparateur de milliers en fine, apostrophe courbe `’`,
  guillemets droits → `« … »`. **Règle d'or** : on ne convertit qu'une espace existante (jamais
  d'ajout — préserve `12:30`, URLs, ratios). Exclus : code inline / blocs de code / mermaid / URLs /
  e-mails. Constantes `NBSP`, `NNBSP`, `THIN_NBSP_FALLBACK`.
- **Code inline** `` `…` `` désormais rendu en **chasse fixe** (et non plus simplement débarrassé de
  ses backticks), et exclu de la typographie.
- **Logo de page de garde** : `insert_cover_logo` insère un PNG centré en tête de garde
  (`LOGO_WIDTH_CM`, défaut 4 cm). Asset vendorisé `assets/logo_minint_2020.{svg,png}`. Flags
  `--logo` / `--no-logo` ; repli sans perte si absent (jamais d'échec du rendu).
- **Lisibilité** : listes rendues en **tirets « - »** avec **retrait pendant** (hanging indent) ;
  `PARA_AFTER_PT` 6 → 8 pt pour mieux séparer les paragraphes.
- **Tests** : `tests/test_render_docx.py` (typographie + idempotence + garde-fous).

### Dépendance (optionnelle)
- Pour (re)générer le PNG du logo depuis le SVG : un rasteriseur **local** (Chrome headless,
  `rsvg-convert`, `cairosvg` ou `resvg`). Jamais de service en ligne.

## [v1.1] — 2026-06-28

### Ajouté
- **Diagrammes mermaid** : les blocs ` ```mermaid ` sont rendus en **image PNG** et insérés
  centrés, mis à l'échelle de la largeur utile de page (downscale si trop hauts). Rendu **100 %
  local** via `mermaid-cli` (`mmdc` sur PATH, sinon `npx -y @mermaid-js/mermaid-cli`) + un
  **Chrome/Chromium local** (auto-détecté, `PUPPETEER_EXECUTABLE_PATH`) — **aucun service externe**
  (pas de `mermaid.ink` : pas d'exfiltration d'architecture).
  - **Repli** sans perte si `mmdc`/Chrome absent ou si `--no-mermaid` : source mermaid rendu en
    chasse fixe (comportement historique des blocs de code).
  - Nouveaux flags : `--chrome`, `--npm-cache`, `--no-mermaid`.
- **Mise en page aérée + polices réduites** (`apply_layout`) : corps 11→**10 pt**, titres
  16/13/12→**14/12/11 pt**, **interligne 1,3** + espace après paragraphe, **tableaux 9 pt** compacts,
  blocs de code 8,5 pt. Valeurs réglables en tête de script (`BODY_PT`, `H1_PT`, …).

### Corrigé
- `fill_cover` traite désormais aussi les **en-têtes/pieds** de toutes les sections et retire la
  mention « — Modèle » **toutes casses** (le bandeau « DAT MirAI — Modèle » / « [NOM DU SERVICE] »
  vit dans l'en-tête, jusque-là non remplacé).

### Dépendance (optionnelle)
- `mermaid-cli` (`npx @mermaid-js/mermaid-cli`) + un Chrome/Chromium local pour le rendu des
  diagrammes. Sans cela, repli texte automatique.

## [v1.0] — 2026-06-21

### Ajouté
- `render_docx.py` : rend un DAT MirAI au format ministériel `.docx` **sur le modèle**
  `MODELE_DAT_MirAI.docx` (skill sœur `dat-generation`) à partir d'un Markdown fidèle à la
  structure du modèle.
- Conservation de la **page de garde** (renseignée : service / version / date ; mention « — MODÈLE »
  retirée) et du champ **Sommaire (TOC)** ; suppression de la page « Comment utiliser » et de tous les
  **encadrés d'instruction « ✎ »**.
- Application des **styleId réels** du modèle (`Heading1/2/3`), **saut de page avant chaque section de
  niveau 1**, `keep_with_next` sur les titres.
- Rendu des **tableaux** Markdown (en-tête répété `tblHeader`, lignes `cantSplit`, bordures légères),
  **listes** (`ListParagraph` + glyphe •), **blocs de code** (police à chasse fixe), **gras** `**…**`.
- **TOC** marqué « dirty » + `settings/updateFields=true` (sommaire peuplé à l'ouverture ; repli F9).
- Robustesse : détection des repères du modèle (how-to / Sommaire / TOC) **y compris TOC encapsulé dans
  un `w:sdt`** ; relocalisation du `w:sectPr` en fin de corps.

### Dépendance
- `python-docx` (≥ 1.0).
