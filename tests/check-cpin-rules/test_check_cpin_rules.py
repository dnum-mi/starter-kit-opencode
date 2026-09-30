"""Tests de check-cpin-rules.py : chaque cas KO rejoue une friction réelle du déploiement de dso-demo.

Lancer : make test-cpin-rules
"""
import copy
import subprocess
import sys
from pathlib import Path

import pytest
import yaml

HERE = Path(__file__).parent
SCRIPT = HERE.parents[1] / ".agents/skills/dso/helm-chart-cpin/scripts/check-cpin-rules.py"
QUOTA = ["--quota-cpu", "200m", "--quota-memory", "0.2Gi"]
BASE = [doc for doc in yaml.safe_load_all((HERE / "ok.yaml").read_text()) if doc]


def run(docs, *args):
    result = subprocess.run([sys.executable, str(SCRIPT), *args], input=yaml.safe_dump_all(docs),
                            capture_output=True, text=True, check=False)
    return result.returncode, result.stdout


def mutate(change):
    docs = copy.deepcopy(BASE)
    by_kind = {doc["kind"]: doc for doc in docs}
    change(by_kind)
    return [doc for doc in docs if doc.get("kind")]


def container(by_kind):
    return by_kind["Deployment"]["spec"]["template"]["spec"]["containers"][0]


def test_ok_passes_all_options():
    code, out = run(BASE, *QUOTA, "--app-port", "3000", "--require-ingress")
    assert code == 0, out


@pytest.mark.parametrize("friction,change,args,expected", [
    ("F1 image placeholder", lambda k: container(k).update(image="docker.io/debian:0.1.3"), [], "image placeholder"),
    ("latest interdit", lambda k: container(k).update(image="harbor.x/p/app:latest"), [], "sans tag versionné"),
    ("F3 quota mémoire", lambda k: container(k)["resources"]["limits"].update(memory="256Mi"), QUOTA, "limits.memory"),
    ("F3 quota cpu", lambda k: container(k)["resources"]["limits"].update(cpu="500m"), QUOTA, "limits.cpu"),
    ("F5 app sur un autre port", lambda k: None, ["--app-port", "8080"], "écoute sur 8080"),
    ("F5 probe sur un port absent", lambda k: container(k)["livenessProbe"]["httpGet"].update(port=8080), [],
     "livenessProbe vise le port 8080"),
    ("F5 backend ingress = containerPort", lambda k: k["Ingress"]["spec"]["rules"][0]["http"]["paths"][0]["backend"]
     ["service"]["port"].update(number=3000), [], "503"),
    ("F6 host d'exemple", lambda k: k["Ingress"]["spec"]["rules"][0].update(host="domain.local"), [], "404"),
    ("F6 ingress désactivé", lambda k: k["Ingress"].clear(), ["--require-ingress"], "aucun Ingress"),
    ("labels Kyverno", lambda k: k["Deployment"]["spec"]["template"]["metadata"]["labels"].pop("tier"), [],
     "label pod manquant 'tier'"),
    ("NodePort", lambda k: k["Service"]["spec"].update(type="NodePort"), [], "NodePort interdit"),
])
def test_ko_is_detected(friction, change, args, expected):
    code, out = run(mutate(change), *args)
    assert code == 1, f"{friction} non détecté :\n{out}"
    assert expected in out, out


def test_surge_over_quota_warns():
    def no_unavailable(by_kind):
        by_kind["Deployment"]["spec"]["strategy"]["rollingUpdate"]["maxUnavailable"] = 0
    code, out = run(mutate(no_unavailable), *QUOTA)
    assert code == 0, out
    assert "pendant le rolling update" in out
