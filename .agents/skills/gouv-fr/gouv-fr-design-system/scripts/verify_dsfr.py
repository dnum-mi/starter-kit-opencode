#!/usr/bin/env python3
"""Verification de conformite DSFR d'un fichier HTML, sans navigateur.

Methode (source de verite = le CSS officiel, jamais une liste apprise) :
  1. Parse le HTML et extrait tous les tokens de classe commencant par `fr-`
     (uniquement les attributs class=..., pas les attributs data-fr-*).
  2. Telecharge (et met en cache) dsfr.min.css + utility.min.css officiels,
     ou utilise des fichiers CSS locaux fournis par --css.
  3. Signale toute classe inconnue du CSS officiel.
  4. Verifie l'existence des assets relatifs (href/src) sur le disque.

Usage :
  python3 verify_dsfr.py INDEX.html [--css FICHIER.css ...] [--version 1.15.3]

Sortie : rapport texte ; retour 0 si aucune classe inconnue ni asset manquant,
1 sinon, 2 en cas d'erreur d'usage.
"""

import argparse
import os
import re
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

CDN = "https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@{version}/dist/{name}"
CSS_FILES = ["dsfr.min.css", "utility/utility.min.css"]
CACHE_DIR = Path(os.environ.get("XDG_CACHE_HOME", str(Path.home() / ".cache"))) / "dsfr-verify"
UA = "Mozilla/5.0 (compatible; dsfr-verify)"


class ClassCollector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.classes = set()
        self.assets = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name == "class" and value:
                for token in value.split():
                    if token.startswith("fr-"):
                        self.classes.add(token)
            elif name in ("src", "href") and value:
                self.assets.append(value)


def fetch_css(version, rel):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    dest = CACHE_DIR / "dsfr-{}-{}".format(version, Path(rel).name)
    if not dest.exists():
        req = urllib.request.Request(CDN.format(version=version, name=rel),
                                     headers={"User-Agent": UA})
        dest.write_bytes(urllib.request.urlopen(req, timeout=60).read())
    return dest.read_text(encoding="utf-8", errors="replace")


def css_identifiers(css_text):
    return set(re.findall(r"fr-[a-zA-Z0-9_-]+", css_text))


def main():
    ap = argparse.ArgumentParser(description="Verifier un HTML contre le CSS DSFR officiel")
    ap.add_argument("html", help="fichier HTML a verifier")
    ap.add_argument("--css", action="append", default=[],
                    help="CSS officiel local (sinon telechargement jsDelivr)")
    ap.add_argument("--version", default="1.15.3", help="version DSFR pour le telechargement")
    args = ap.parse_args()

    path = Path(args.html)
    if not path.is_file():
        print("ERREUR: fichier introuvable: {}".format(path), file=sys.stderr)
        return 2

    if args.css:
        css = "".join(Path(c).read_text(encoding="utf-8", errors="replace") for c in args.css)
    else:
        try:
            css = "".join(fetch_css(args.version, rel) for rel in CSS_FILES)
        except Exception as exc:
            print("ERREUR: impossible d'obtenir le CSS officiel ({}). "
                  "Fournir --css avec des fichiers locaux.".format(exc), file=sys.stderr)
            return 2

    known = css_identifiers(css)
    collector = ClassCollector()
    collector.feed(path.read_text(encoding="utf-8", errors="replace"))

    unknown = sorted(t for t in collector.classes if t not in known)

    base = path.parent
    missing_assets = []
    for url in collector.assets:
        if url.startswith(("http://", "https://", "data:", "#", "mailto:")):
            continue
        clean = url.split("?")[0].split("#")[0]
        if clean and not (base / clean).exists() and not os.path.exists(clean):
            missing_assets.append(url)

    total = len(collector.classes)
    print("Classes fr-* utilisees : {}".format(total))
    print("Classes inconnues du CSS officiel : {}".format(len(unknown)))
    for t in unknown:
        print("  INCONNU  {}".format(t))
    for a in sorted(set(missing_assets)):
        print("  ASSET MANQUANT  {}".format(a))
    score = 100.0 if total == 0 else 100.0 * (total - len(unknown)) / total
    print("Score : {:.1f}%".format(score))
    return 0 if not unknown and not missing_assets else 1


if __name__ == "__main__":
    sys.exit(main())
