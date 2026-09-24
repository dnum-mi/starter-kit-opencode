---
type: référence
title: Sécurité des pods et particularités OpenShift
description: SecurityContext par défaut, adaptations pour le SCC restricted-v2 (UID alloué), système de fichiers en lecture seule, NetworkPolicy et resources.
tags: [helm, securite, openshift, securitycontext]
---

# Sécurité des pods et OpenShift

## Défaut du chart ocr-api
```yaml
podSecurityContext: {runAsNonRoot: true, fsGroup: 10001, seccompProfile: {type: RuntimeDefault}}
securityContext:
  runAsUser: 10001
  runAsGroup: 10001
  allowPrivilegeEscalation: false
  capabilities: {drop: ["ALL"]}
  runAsNonRoot: true
  readOnlyRootFilesystem: true
  seccompProfile: {type: "RuntimeDefault"}
```

## Sur OpenShift (CPiN)
Le SCC `restricted-v2` alloue les UID par namespace (`MustRunAsRange`) et **rejette** un UID hors plage. Donc :
- **retirer** `runAsUser`, `runAsGroup` et `fsGroup` ; **garder** `runAsNonRoot`, `seccompProfile`, `drop: ["ALL"]`, `readOnlyRootFilesystem` ;
- les images doivent appartenir au groupe root (`chown -R 10001:0` dans le Dockerfile) car l'UID est aléatoire ;
- ports d'écoute > 1024 ;
- système de fichiers en lecture seule : tester avec `docker run --read-only` ; chemins inscriptibles en `emptyDir`.

## Réseau
Namespace en **deny-all** ; Kyverno ajoute `allow-same-namespace`, `allow-from-ingress` (openshift-ingress), `allow-from-logging`, `allow-from-monitoring` (infra-obs).
Tout autre ingress et l'egress sont à déclarer (`networkPolicy` du chart). L'egress passe par un proxy : `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY` si nécessaire.

## Autres exigences visibles dans un chart
`resources` requests+limits (QoS Guaranteed conseillé), au moins une probe, pas de `latest`, pas de hostPath, ConfigMap sans credentials.
