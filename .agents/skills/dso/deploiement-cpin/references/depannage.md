# Dépannage Cloud Pi Native

Chercher le message exact dans la colonne « Symptôme ». La colonne « Phase » renvoie au runbook
(`SKILL.md`) : c'est là que le problème aurait dû être arrêté. Corriger à la source, puis ajouter la
vérification manquante pour que le problème ne revienne pas.

## Vécu (déploiement de dso-demo, releases 0.1.1 → 0.1.7)

| Symptôme | Cause | Phase | Correctif |
|----------|-------|-------|-----------|
| `pods ... forbidden: exceeded quota: dso-quota` | somme des `limits` > quota (500m/2Gi, puis 256Mi, pour un quota de 200m/0.2Gi) | 1, 3 | relever le quota **avec son unité** ; `--quota-cpu`/`--quota-memory` dans `check-cpin-rules.py` |
| Le pod tire `docker.io/debian:<tag>` | `repository` placeholder du template resté dans `values.yaml` ; la surcharge était dans un fichier non chargé | 2, 3 | image Harbor dans `values.yaml` ; le script signale « image placeholder » |
| Valeurs de `values-dev.yaml` sans effet | fichier non déclaré dans la console | 2 | déclarer les fichiers values dans la console, ou mettre les valeurs vitales dans `values.yaml` |
| Pod `Running` mais jamais `Ready`, ou `connection refused` | containerPort/probes sur 8080 alors que l'app écoute sur 3000 | 0, 3 | `--app-port <port>` dans le script |
| 404 sur l'URL | `ingress.enabled: false` par défaut dans le template tobi, ou host d'exemple | 2, 3 | ingress activé avec le host réel dans `values.yaml` ; `--require-ingress` |
| 503 sur l'URL | backend de l'Ingress sur le containerPort (3000) au lieu du **port du Service** (80) | 3 | `backend.service.port` = `Service.port` ; le script le signale |
| `sync-cpin` : `GITLAB_URL must be a single https:// URL, got ''` | variables GitHub absentes | 1 | créer `GITLAB_URL`, `GITLAB_MIRROR_ID`, `GITLAB_PROJECT_NAME` (variables) et `GITLAB_TRIGGER_TOKEN` (secret) |
| Synchro : `403 Write access to repository not granted` | token GitHub dans le mauvais champ, ou mauvais type de token | 1 | vérifier le champ (`GIT_INPUT_TOKEN` : lecture seule sur la source) avant d'élargir les droits |
| Jobs `git-sync` : `No value found at …` | secrets de synchro absents de la console | 1 | l'humain saisit les tokens dans la console (secrets du projet) |
| Token introuvable dans GitLab (« Access Token → New ») | confusion PAT (`glpat-`) / pipeline trigger token (`glptt-`) | 1 | le token de déclenchement est un `glptt-` fourni par la console |

## Plateforme (documentation CPiN)

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| Rien ne se redéploie après un push | tag d'image inchangé : ArgoCD ne voit aucun diff | faire évoluer le tag ; vérifier que la synchro a bien été déclenchée |
| Le pipeline GitLab ne se lance pas | pas de `.gitlab-ci-dso.yml`/`.yaml`, ou synchro non déclenchée | vérifier le nom du fichier ; relancer le pipeline `mirror` avec `PROJECT_NAME` et `GIT_BRANCH_DEPLOY` |
| Le build échoue tout de suite | étape `read_secret` absente ou en échec | garder le job `.vault:read_secret` en premier stage |
| Pod refusé en prod, accepté en dev | Kyverno en audit hors prod, **enforce en prod** | `check-cpin-rules.py` (skill `helm-chart-cpin`) |
| `CreateContainerConfigError` / UID hors plage | `runAsUser`/`fsGroup` figés, SCC OpenShift | les mettre à `null` dans les values |
| `ImagePullBackOff` | image absente de Harbor, tag erroné, pull secret non référencé | vérifier l'image dans Harbor ; `imagePullSecrets: [{name: registry-pull-secret}]` |
| Application injoignable (hors 404/503) | namespace en deny-all | `networkPolicy` pour les flux non couverts par les règles injectées par Kyverno |
| Dépôt qui disparaît du GitLab interne | dépôt `plugin-managed` non déclaré dans la console | toujours passer par la console |
| Réglages ArgoCD ignorés | la console est source de vérité (≥ 9.11.5) | révision, chemin et fichiers values dans la console |
| Un environnement n'est plus régénéré | un « Déploiement » (beta ≥ 9.25.0) écrase la config des dépôts d'infra | reporter toute la config dans un déploiement par environnement |
| Dérive (drift) détectée | paramètres saisis dans l'UI ArgoCD | tout mettre dans les values |
| Application déployée mais pas à jour | auto-sync désactivé | *REFRESH* puis *SYNC* dans ArgoCD |
