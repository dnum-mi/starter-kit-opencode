---
name: helm-chart-cpin
description: Use when creating or adapting a Helm chart to deploy on Cloud Pi Native (OpenShift + Kyverno) — starting from the this-is-tobi template, values per environment, securityContext and UID, MIOM labels, Vault secrets via extraObjects, image tags, chart versioning and OCI publication
allowed-tools: Bash Read Write
---

# Chart Helm pour Cloud Pi Native

Créer ou adapter un chart qui passe les contraintes OpenShift et les politiques Kyverno de CPiN. Le chart se prépare en 3 temps :
**squelette** (template tobi) → **surcharge CPiN** (`values-cpin.yaml`) → **vérification** (`helm lint` + `check-cpin-rules.py`).

## Ce qu'il faut savoir d'abord

- Le `template/` de [`this-is-tobi/helm-charts`](https://github.com/this-is-tobi/helm-charts/tree/main/template) est un **squelette à copier**, pas une dépendance. `ocr-api` l'a copié et renommé. Les charts publiés par tobi (`backup-utils`, `cnpg-cluster`, `vso-utils`) sont des utilitaires que l'on peut, eux, déclarer en `dependencies`.
- Le chart est un **contrat de values** : composants activables (`enabled`), bloc `global`, `extraObjects` en échappatoire pour tout ce que le chart ne modélise pas.
- **Les défauts du template échouent sur CPiN** (vérifié en rendant le template) : `runAsUser`/`runAsGroup`/`fsGroup: 1000` figés (le SCC OpenShift alloue l'UID par namespace et rejette un UID hors plage) et aucun label `app`/`env`/`tier` (Kyverno `check-labels`, bloquant en prod).

## Créer le chart

1. Copier `template/` vers `<dépôt>/helm/` (ou `charts/<nom>`).
2. Renommer **partout** : `chartname` → nom du chart, `servicename` → nom du composant (ex. `api`), y compris le dossier `templates/servicename/`. La procédure du README tobi ne couvre pas tous les fichiers : `NOTES.txt`, `values.schema.json`, `test-values*.yaml` et `README.md` contiennent aussi ces noms.
   ```bash
   grep -rl "servicename\|chartname" . | xargs sed -i 's/servicename/api/g; s/chartname/monapp/g'
   ```
3. Un composant supplémentaire : copier le dossier de templates **et** le bloc de values, puis ajouter une ligne `include "helper.component.validate"` dans `templates/validation.yaml`.
4. `helm lint .` doit passer avant toute autre modification.

## Surcharge CPiN

Copier [`references/values-cpin.yaml`](references/values-cpin.yaml) (testée sur le template) à côté du chart et l'adapter :

| Sujet | Règle |
|-------|-------|
| UID/GID | mettre `runAsUser`, `runAsGroup`, `fsGroup` (pod et conteneur) à `null` ; garder `runAsNonRoot`, `drop: [ALL]`, `readOnlyRootFilesystem` ; ajouter `seccompProfile: {type: RuntimeDefault}` comme le fait `ocr-api` (absent des défauts du template) |
| Image | registre Harbor du projet, tag versionné ou digest (`digest` prime sur `tag`), **jamais `latest`** ; l'image doit grouper root (`chown -R <uid>:0` dans le Dockerfile) car l'UID est aléatoire |
| Labels | `commonLabels` : `app`, `env`, `tier` (exigés), `criticality`, `component` (MIOM) |
| Pull secret | `imagePullSecrets: [{name: registry-pull-secret}]` (créé par la console dans chaque namespace) |
| Ressources | `requests` et `limits` CPU+mémoire sur tous les conteneurs ; QoS Guaranteed conseillé ; la somme des `limits` compte pour le quota du namespace, dépendances comprises |
| Probes | au moins une par conteneur ; les défauts du template pointent `/` : régler le chemin réel |
| Service | `ClusterIP` (pas de NodePort) ; port d'écoute du conteneur > 1024 |
| Écriture | FS en lecture seule : `emptyDir` pour `/tmp` et autres chemins inscriptibles |
| Réseau | namespace en deny-all ; Kyverno injecte same-namespace, ingress, logging, monitoring ; déclarer le reste via `networkPolicy.create: true` + `ingress`/`egress` (egress via proxy : `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`) |
| Secrets | jamais dans `values.yaml` ni en ConfigMap ; `VaultStaticSecret` via `extraObjects` ([`references/vault-secret.yaml`](references/vault-secret.yaml)), `vaultAuthRef: vault-auth` |

Un fichier par environnement : `values-<env>.yaml` (la console remplace `<env>` par le nom de l'environnement).

## Vérifier

```bash
helm lint . -f values-cpin.yaml
helm template <release> . -f values-cpin.yaml -f values-<env>.yaml \
  | uv run --with pyyaml scripts/check-cpin-rules.py
```

`check-cpin-rules.py` contrôle labels, resources, probes, image (tag, registre), NodePort, hostPath, credentials en ConfigMap, et signale les UID figés.
Sortie 1 s'il reste des erreurs. Ce n'est pas Kyverno : les règles sont en **audit** en dev/preprod et **bloquantes en prod**, donc un rendu propre ici évite la surprise à la mise en prod, sans la garantir.

## Versions et publication

- `version` (chart) ≠ `appVersion` (application). Dans le dépôt applicatif, ne pas les bumper à la main : `update-helm-chart` (`RUN_MODE: local`) le fait au release (skill `cicd-fabnum`).
- Régénérer le README (helm-docs) : `lint-helm` échoue si le README diffère du rendu.
- Publication OCI : `release-helm-local` (ghcr.io) ; le pipeline DSO refait `helm dependency update`, `helm package` puis `helm push` vers Harbor.
- Dépendances (postgres, redis, CNPG) : `alias` + `condition: <alias>.enabled`, et `HELM_REPOS`/`chart-repos` pour celles en HTTP. Registres autorisés côté cluster : docker.io, harbor, registry.redhat.io, quay.io, bitnami, ghcr.io.

## Pièges

1. Renommage incomplet du template → `nil pointer evaluating interface {}.deploymentType` dans `NOTES.txt`.
2. `runAsUser: null` : Helm supprime la clé du défaut ; `{}` ou l'omission ne suffit pas (les défauts sont fusionnés).
3. Override d'une liste (`volumes`, `imagePullSecrets`) : Helm remplace la liste, ne la fusionne pas ; réécrire les entrées à garder (par exemple le volume `tmp`).
4. `service.nodePort` existe dans le template : ne pas l'utiliser, Kyverno interdit NodePort.
5. `enabled: false` ne désactive pas les sous-charts : ils ont leur propre `enabled`.
6. Tag inchangé = aucun redéploiement (ArgoCD ne voit pas de diff) ; le tag doit bouger à chaque livraison.
7. Noms de ressources trop longs : peuvent bloquer le déploiement sur OpenShift ; rester court.

## Pour aller plus loin

- Doc interne : `docs/okf/helm/` (anatomie, conventions de values, sécurité et OpenShift, publication), `docs/okf/cloud-pi-native/contraintes-runtime.md` (table Kyverno), `docs/okf/decisions/dependances-chart.md`.
- Exemple complet : `IA-Generative/ocr-api/helm`.
- Skills liés (groupe `dso`) : `cicd-fabnum` (bump et publication du chart), `deploiement-cpin` (environnements, ArgoCD, secrets, quotas).
