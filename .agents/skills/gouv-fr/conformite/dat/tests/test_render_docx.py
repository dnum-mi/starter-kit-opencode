#!/usr/bin/env python3
"""Tests du rendu DAT — typographie française et garde-fous.

Usage : `python tests/test_render_docx.py` (depuis le dossier du skill) ou
`python test_render_docx.py`. N'exige que `render_docx` importable (python-docx).
Sortie : liste OK/FAIL + code de retour non nul si un test échoue.
"""
from __future__ import annotations

import os
import sys

# Rendre `render_docx` importable depuis tests/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from render_docx import normalize_typography as f  # noqa: E402

NBSP = " "
NNBSP = " "

_passed = 0
_failed = 0


def check(label, cond):
    global _passed, _failed
    if cond:
        _passed += 1
        print(f"OK   {label}")
    else:
        _failed += 1
        print(f"FAIL {label}")


def contains(label, src, needle):
    r = f(src)
    check(f"{label}: {src!r} -> {r!r}", needle in r)


def unchanged(label, src):
    r = f(src)
    check(f"{label}: {src!r} -> {r!r}", r == src)


# ── Ponctuation haute ─────────────────────────────────────────────────────────
contains("NBSP avant ':'", "Objet : test", NBSP + ":")
contains("fine avant ';'", "Note ; suite", NNBSP + ";")
contains("fine avant '!'", "Stop ! la", NNBSP + "!")
contains("fine avant '?'", "Vraiment ? oui", NNBSP + "?")
contains("NBSP avant '%'", "CPU 55 % charge", NBSP + "%")
check("pas d'espace normale avant ':'", " " + ":" not in f("Objet : test"))

# ── Apostrophe & guillemets ───────────────────────────────────────────────────
contains("apostrophe courbe", "d'architecture", "’")
contains("guillemets FR + fines", 'Il a dit "oui" hier', "«" + NNBSP + "oui" + NNBSP + "»")
check("guillemet orphelin laissé tel quel", '"' == f('"'))

# ── Nombres & unités ──────────────────────────────────────────────────────────
contains("milliers en fine", "30 000 agents", "30" + NNBSP + "000")
contains("nombre+unité insécable", "police 11 pt ici", "11" + NBSP + "pt")

# ── Règle d'or : ne jamais inventer d'espace ──────────────────────────────────
unchanged("horaire", "12:30")
unchanged("clé:valeur collée", "clé:valeur")
unchanged("URL avec ':'", "https://ex.fr/a:b")
unchanged("e-mail", "prenom.nom@interieur.gouv.fr")

# ── Code inline protégé ───────────────────────────────────────────────────────
unchanged("code inline non typographié", "`code:test`")
check("code inline au milieu protégé",
      "`a:b`" in f("voir `a:b` ici") and "ici" in f("voir `a:b` ici"))

# ── Idempotence ───────────────────────────────────────────────────────────────
sample = ('Objet : test ; "oui" d\'accord ; 30 000 agents à 55 % '
          'via https://x.fr/a:b et `k:v` — fin !')
once = f(sample)
check("idempotence", once == f(once))

print(f"\n{_passed} passés, {_failed} échoués")
sys.exit(1 if _failed else 0)
