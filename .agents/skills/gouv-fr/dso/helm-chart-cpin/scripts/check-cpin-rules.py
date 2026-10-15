#!/usr/bin/env python3
"""Vérifie des manifestes rendus contre les politiques Kyverno et contraintes OpenShift de Cloud Pi Native.

Usage : helm template <release> <chart> -f values.yaml -f values-cpin.yaml -f values-<env>.yaml \\
          | uv run --with pyyaml scripts/check-cpin-rules.py \\
              [--quota-cpu 200m] [--quota-memory 205Mi] [--app-port 3000] [--require-ingress]
              [--expected-image harbor.example.com/projet/app]
Code de sortie 1 s'il reste des ERREURS ; les AVERTISSEMENTS n'échouent pas.
En plus des règles Kyverno, contrôle les pièges vécus au déploiement : image placeholder, ports
conteneur/probe/Service/Ingress incohérents, host d'exemple, somme des limits au-dessus du quota.
"""
import argparse
import math
import sys

import yaml

REQUIRED_LABELS = ("app", "env", "tier")
RECOMMENDED_LABELS = ("criticality", "component")
ALLOWED_REGISTRIES = ("docker.io/", "harbor", "registry.redhat.io/", "quay.io/", "bitnami/", "ghcr.io/")
PLACEHOLDER_IMAGES = ("debian", "ubuntu", "alpine", "busybox", "chartname", "servicename")
PLACEHOLDER_HOSTS = ("example", "localhost", "domain.local", "<")
FORBIDDEN_CM_KEYS = ("password", "passwd", "secret_key")
WORKLOADS = {"Deployment", "StatefulSet", "DaemonSet", "Job", "CronJob"}
LONG_LIVED = {"Deployment", "StatefulSet", "DaemonSet"}
EXPOSURES = {"Ingress", "Route", "HTTPRoute"}
PROBES = ("livenessProbe", "readinessProbe", "startupProbe")
RESOURCE_KEYS = (("limits", "memory"), ("limits", "cpu"), ("requests", "memory"), ("requests", "cpu"))
MEMORY_UNITS = {"Ki": 2**10, "Mi": 2**20, "Gi": 2**30, "Ti": 2**40, "k": 10**3, "M": 10**6, "G": 10**9, "T": 10**12}
MEBI = 2**20
DEFAULT_ROLLING = "25%"


def parse_cpu(value):
    text = str(value)
    return float(text[:-1]) / 1000 if text.endswith("m") else float(text)


def parse_memory(value):
    text = str(value)
    for unit in sorted(MEMORY_UNITS, key=len, reverse=True):
        if text.endswith(unit):
            return float(text[: -len(unit)]) * MEMORY_UNITS[unit]
    return float(text)


def pod_spec(doc):
    template = doc["spec"]["jobTemplate"]["spec"]["template"] if doc["kind"] == "CronJob" else doc["spec"]["template"]
    return template.get("metadata", {}).get("labels", {}), template["spec"]


def check_labels(name, labels):
    errors = [f"{name}: label pod manquant '{key}'" for key in REQUIRED_LABELS if key not in labels]
    warnings = [f"{name}: label MIOM recommandé absent '{key}'" for key in RECOMMENDED_LABELS if key not in labels]
    return errors, warnings


def image_repository(image):
    without_digest = image.split("@")[0]
    return without_digest.rsplit(":", 1)[0] if ":" in without_digest.split("/")[-1] else without_digest


def check_image(name, image, expected_image=None):
    tag = image.rsplit(":", 1)[-1] if ":" in image.split("/")[-1] else ""
    errors = []
    if tag == "latest" or (not tag and "@sha256:" not in image):
        errors.append(f"{name}: image '{image}' sans tag versionné (latest interdit)")
    if not any(image.startswith(registry) or registry in image.split("/")[0] for registry in ALLOWED_REGISTRIES):
        errors.append(f"{name}: registre non autorisé pour '{image}'")
    if image_repository(image).split("/")[-1] in PLACEHOLDER_IMAGES:
        errors.append(f"{name}: image placeholder '{image}' (repository du template jamais remplacé)")
    if expected_image and image_repository(image) != expected_image:
        errors.append(
            f"{name}: chemin d'image '{image_repository(image)}' != chemin attendu '{expected_image}' "
            "(nom du projet Harbor/PROJECT_PATH incohérent)")
    return errors


def check_probe_ports(name, container):
    numbers = {port["containerPort"] for port in container.get("ports", [])}
    names = {port.get("name") for port in container.get("ports", [])}
    errors = []
    for probe in PROBES:
        action = container.get(probe, {}).get("httpGet") or container.get(probe, {}).get("tcpSocket") or {}
        port = action.get("port")
        if port is not None and port not in numbers | names:
            errors.append(f"{name}: {probe} vise le port {port}, absent des containerPort {sorted(numbers)}")
    return errors


def check_app_port(name, container, app_port):
    numbers = {port["containerPort"] for port in container.get("ports", [])}
    if app_port is None or not numbers or app_port in numbers:
        return []
    return [f"{name}: containerPort {sorted(numbers)} alors que l'application écoute sur {app_port}"]


def check_container(name, container, long_lived, app_port, expected_image):
    errors = check_image(name, container.get("image", ""), expected_image) + check_probe_ports(name, container)
    errors += check_app_port(name, container, app_port)
    resources = container.get("resources", {})
    errors += [f"{name}: resources.{a}.{b} manquant" for a, b in RESOURCE_KEYS if b not in resources.get(a, {})]
    if long_lived and not any(probe in container for probe in PROBES):
        errors.append(f"{name}: aucune probe (liveness/readiness/startup)")
    if "runAsUser" in container.get("securityContext", {}):
        return errors, [f"{name}: runAsUser figé (rejeté par le SCC OpenShift si hors plage)"]
    return errors, []


def check_pod(doc, app_port, expected_image):
    name = f"{doc['kind']}/{doc['metadata']['name']}"
    labels, spec = pod_spec(doc)
    errors, warnings = check_labels(name, labels)
    for key in ("runAsUser", "runAsGroup", "fsGroup"):
        if key in spec.get("securityContext", {}):
            warnings.append(f"{name}: {key} figé au niveau du pod (SCC OpenShift)")
    for container in spec.get("containers", []):
        found, warned = check_container(f"{name}/{container['name']}", container, doc["kind"] in LONG_LIVED, app_port, expected_image)
        errors, warnings = errors + found, warnings + warned
    for container in spec.get("initContainers", []):
        found, warned = check_container(f"{name}/{container['name']}", container, False, None, expected_image)
        errors, warnings = errors + found, warnings + warned
    errors += [f"{name}: volume hostPath interdit" for volume in spec.get("volumes", []) if "hostPath" in volume]
    return errors, warnings


def check_other(doc):
    name = f"{doc['kind']}/{doc['metadata']['name']}"
    if doc["kind"] == "Service" and doc["spec"].get("type") == "NodePort":
        return [f"{name}: NodePort interdit"]
    if doc["kind"] == "ConfigMap":
        return [f"{name}: clé sensible '{key}' dans une ConfigMap" for key in doc.get("data", {}) if key.lower() in FORBIDDEN_CM_KEYS]
    return []


def service_ports(docs):
    ports = {}
    for doc in docs:
        if doc["kind"] == "Service":
            entries = doc["spec"].get("ports", [])
            ports[doc["metadata"]["name"]] = {p["port"] for p in entries} | {p.get("name") for p in entries}
    return ports


def check_ingress(doc, ports):
    name = f"Ingress/{doc['metadata']['name']}"
    errors = []
    for rule in doc["spec"].get("rules", []):
        host = rule.get("host", "")
        if not host or any(marker in host for marker in PLACEHOLDER_HOSTS):
            errors.append(f"{name}: host '{host}' absent ou d'exemple (404 assuré)")
        for path in rule.get("http", {}).get("paths", []):
            service = path["backend"].get("service", {})
            port = service.get("port", {}).get("number") or service.get("port", {}).get("name")
            known = ports.get(service.get("name"))
            if known is not None and port not in known:
                numbers = sorted(p for p in known if isinstance(p, int))
                errors.append(f"{name}: backend {service['name']}:{port} ne vise pas le port du Service {numbers} (503 assuré)")
    return errors


def pod_limits(doc):
    _, spec = pod_spec(doc)
    limits = [c.get("resources", {}).get("limits", {}) for c in spec.get("containers", [])]
    return sum(parse_cpu(lim.get("cpu", 0)) for lim in limits), sum(parse_memory(lim.get("memory", 0)) for lim in limits)


def rolling_count(value, replicas, round_up):
    if isinstance(value, str) and value.endswith("%"):
        exact = replicas * float(value[:-1]) / 100
        return math.ceil(exact) if round_up else math.floor(exact)
    return int(value)


def surge_pods(doc, replicas):
    """Pods en plus pendant un rolling update qui ne peut pas d'abord arrêter un ancien pod."""
    strategy = doc["spec"].get("strategy", {})
    if doc["kind"] != "Deployment" or strategy.get("type") == "Recreate":
        return 0
    rolling = strategy.get("rollingUpdate", {})
    if rolling_count(rolling.get("maxUnavailable", DEFAULT_ROLLING), replicas, round_up=False) > 0:
        return 0
    return rolling_count(rolling.get("maxSurge", DEFAULT_ROLLING), replicas, round_up=True)


def limits_totals(docs):
    steady, surge = [0.0, 0.0], [0.0, 0.0]
    for doc in docs:
        if doc["kind"] not in WORKLOADS:
            continue
        replicas = doc["spec"].get("replicas", 1) if doc["kind"] in ("Deployment", "StatefulSet") else 1
        extra = surge_pods(doc, replicas)
        for index, value in enumerate(pod_limits(doc)):
            steady[index] += value * replicas
            surge[index] += value * extra
    return steady, surge


def check_quota(docs, quotas):
    steady, surge = limits_totals(docs)
    errors, warnings = [], []
    for (label, quota, show), used, extra in zip(quotas, steady, surge):
        if quota is None:
            continue
        if used > quota:
            errors.append(f"quota: somme des limits.{label} {show(used)} > quota {show(quota)} (pods refusés)")
        elif used + extra > quota:
            warnings.append(f"quota: limits.{label} {show(used + extra)} pendant le rolling update > quota {show(quota)}"
                            " : maxUnavailable 1 ou strategy Recreate")
    return errors, warnings


def parse_args():
    parser = argparse.ArgumentParser(description="Vérifie un rendu helm template contre les règles CPiN.")
    parser.add_argument("--quota-cpu", type=parse_cpu, help="quota CPU de l'environnement (ex. 200m, 1)")
    parser.add_argument("--quota-memory", type=parse_memory, help="quota mémoire, unité explicite (ex. 205Mi, 0.2Gi)")
    parser.add_argument("--app-port", type=int, help="port réellement écouté par l'application (EXPOSE du Dockerfile)")
    parser.add_argument("--require-ingress", action="store_true", help="erreur si aucun Ingress/Route n'est rendu")
    parser.add_argument("--expected-image", help="chemin complet attendu <registry>/<project>/<repo> (sans tag), ex. harbor.sdid.cpin.numerique-interieur.com/icebreakerdemo/ice-breaker-demo")
    return parser.parse_args()


def main():
    args = parse_args()
    docs = [doc for doc in yaml.safe_load_all(sys.stdin) if doc]
    ports = service_ports(docs)
    errors, warnings = [], []
    resolved = []
    for doc in docs:
        if doc["kind"] in WORKLOADS:
            found, warned = check_pod(doc, args.app_port, args.expected_image)
            errors, warnings = errors + found, warnings + warned
            spec = pod_spec(doc)[1]
            resolved += [c["image"] for c in spec.get("containers", [])]
            resolved += [c["image"] for c in spec.get("initContainers", [])]
        if doc["kind"] == "Ingress":
            errors += check_ingress(doc, ports)
        errors += check_other(doc)
    kinds = {doc["kind"] for doc in docs}
    if "Deployment" in kinds and not kinds & EXPOSURES:
        message = "aucun Ingress/Route rendu : l'application n'est pas exposée (ingress.enabled ?)"
        (errors if args.require_ingress else warnings).append(message)
    quotas = (("cpu", args.quota_cpu, "{:.3f}".format), ("memory", args.quota_memory, lambda v: f"{v / MEBI:.0f}Mi"))
    found, warned = check_quota(docs, quotas)
    for image in sorted(set(resolved)):
        print(f"INFO          image résolue: {image}")
    for line in warnings + warned:
        print(f"AVERTISSEMENT {line}")
    for line in errors + found:
        print(f"ERREUR        {line}")
    print(f"{len(errors + found)} erreur(s), {len(warnings + warned)} avertissement(s)")
    sys.exit(1 if errors + found else 0)


if __name__ == "__main__":
    main()
