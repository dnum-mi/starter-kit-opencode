"""Vérifie les appels à fabnum-cicd dans des workflows générés — lecture et parsing seulement.

Usage : python3 verif-appels.py <clone-fabnum-au-tag> <workflow.yml> [<workflow.yml> ...]

Pour chaque job `uses: dnum-mi/fabnum-cicd/.github/workflows/<f>@<tag>` :
- le fichier appelé existe dans le clone ;
- aucun input inconnu, tous les inputs `required: true` renseignés ;
- les permissions du job appelant couvrent l'union des permissions des jobs appelés.
Sortie : « OK » ou « ÉCARTS » (code 1), une ligne par écart. N'exécute rien du clone.
"""
import sys, yaml, pathlib, re
fab = pathlib.Path(sys.argv[1]); ok = True
for wf in sys.argv[2:]:
    y = yaml.safe_load(open(wf))
    for job, jd in y["jobs"].items():
        u = jd.get("uses", "")
        m = re.match(r"dnum-mi/fabnum-cicd/\.github/workflows/(.+)@(.+)", u)
        if not m: continue
        f = fab / ".github/workflows" / m.group(1)
        if not f.exists(): print(f"✗ {wf}:{job} fichier absent {m.group(1)}"); ok=False; continue
        c = yaml.safe_load(open(f)); wc = (c.get(True) or c["on"])["workflow_call"] or {}
        ins = wc.get("inputs") or {}; given = jd.get("with") or {}
        for k in given:
            if k not in ins: print(f"✗ {wf}:{job} input inconnu {k}"); ok=False
        for k, v in ins.items():
            if v.get("required") and k not in given: print(f"✗ {wf}:{job} input requis manquant {k}"); ok=False
        need = {}
        for cj in c["jobs"].values():
            for p, lvl in (cj.get("permissions") or {}).items():
                if lvl == "write" or p not in need: need[p] = lvl
        have = jd.get("permissions") or {}
        for p, lvl in need.items():
            h = have.get(p)
            if h is None or (lvl == "write" and h != "write"):
                print(f"✗ {wf}:{job} permission {p}:{lvl} manquante (a {h})"); ok=False
        extra = set(have) - set(need)
        if extra: print(f"⚠ {wf}:{job} permissions en trop {extra}")
print("OK" if ok else "ÉCARTS")
sys.exit(0 if ok else 1)
