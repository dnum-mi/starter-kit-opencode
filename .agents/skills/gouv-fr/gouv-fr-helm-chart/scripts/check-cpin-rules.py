#!/usr/bin/env python3
"""Vérifie des manifestes rendus contre les politiques Kyverno et contraintes OpenShift de Cloud Pi Native.

Usage : helm template <release> <chart> -f values-cpin.yaml | uv run --with pyyaml scripts/check-cpin-rules.py
Code de sortie 1 s'il reste des ERREURS (bloquantes en prod) ; les AVERTISSEMENTS n'échouent pas.
"""
import os
import sys

import yaml

REQUIRED_LABELS = ("app", "env", "tier")
RECOMMENDED_LABELS = ("criticality", "component")
PUBLIC_REGISTRIES = ("docker.io", "registry.redhat.io", "quay.io", "ghcr.io")
FORBIDDEN_CM_KEYS = ("password", "passwd", "secret_key")
WORKLOADS = {"Deployment", "StatefulSet", "DaemonSet", "Job", "CronJob"}
LONG_LIVED = {"Deployment", "StatefulSet", "DaemonSet"}
PROBES = ("livenessProbe", "readinessProbe", "startupProbe")
RESOURCE_KEYS = (("limits", "memory"), ("limits", "cpu"), ("requests", "memory"), ("requests", "cpu"))


def pod_spec(doc):
    template = doc["spec"]["jobTemplate"]["spec"]["template"] if doc["kind"] == "CronJob" else doc["spec"]["template"]
    return template.get("metadata", {}).get("labels", {}), template["spec"]


def check_labels(name, labels):
    errors = [f"{name}: label pod manquant '{key}'" for key in REQUIRED_LABELS if key not in labels]
    warnings = [f"{name}: label MIOM recommandé absent '{key}'" for key in RECOMMENDED_LABELS if key not in labels]
    return errors, warnings


def check_image(name, image):
    tag = image.rsplit(":", 1)[-1] if ":" in image.split("/")[-1] else ""
    errors = []
    if tag == "latest" or (not tag and "@sha256:" not in image):
        errors.append(f"{name}: image '{image}' sans tag versionné (latest interdit)")
    first_component = image.split("/", 1)[0].lower()
    # An explicit registry has a dot/port (or is localhost). Unqualified images
    # use Docker Hub. Do not use substring checks: ``evil-harbor.example`` must
    # never pass merely because its hostname contains an approved word.
    explicit_registry = "/" in image and (
        "." in first_component or ":" in first_component or first_component == "localhost"
    )
    registry = first_component if explicit_registry else "docker.io"
    project_registries = tuple(
        host.strip().lower()
        for host in os.environ.get("CPIN_ALLOWED_REGISTRIES", "").split(",")
        if host.strip()
    )
    if registry not in PUBLIC_REGISTRIES + project_registries:
        errors.append(f"{name}: registre non autorisé pour '{image}'")
    return errors


def check_container(name, container, long_lived):
    errors = check_image(name, container.get("image", ""))
    resources = container.get("resources", {})
    errors += [f"{name}: resources.{a}.{b} manquant" for a, b in RESOURCE_KEYS if b not in resources.get(a, {})]
    if long_lived and not any(probe in container for probe in PROBES):
        errors.append(f"{name}: aucune probe (liveness/readiness/startup)")
    if "runAsUser" in container.get("securityContext", {}):
        return errors, [f"{name}: runAsUser figé (rejeté par le SCC OpenShift si hors plage)"]
    return errors, []


def check_pod(doc):
    name = f"{doc['kind']}/{doc['metadata']['name']}"
    labels, spec = pod_spec(doc)
    errors, warnings = check_labels(name, labels)
    for key in ("runAsUser", "runAsGroup", "fsGroup"):
        if key in spec.get("securityContext", {}):
            warnings.append(f"{name}: {key} figé au niveau du pod (SCC OpenShift)")
    for container in spec.get("containers", []) + spec.get("initContainers", []):
        found, warned = check_container(f"{name}/{container['name']}", container, doc["kind"] in LONG_LIVED)
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


def main():
    errors, warnings = [], []
    for doc in filter(None, yaml.safe_load_all(sys.stdin)):
        if doc["kind"] in WORKLOADS:
            found, warned = check_pod(doc)
            errors, warnings = errors + found, warnings + warned
        errors += check_other(doc)
    for line in warnings:
        print(f"AVERTISSEMENT {line}")
    for line in errors:
        print(f"ERREUR        {line}")
    print(f"{len(errors)} erreur(s), {len(warnings)} avertissement(s)")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
