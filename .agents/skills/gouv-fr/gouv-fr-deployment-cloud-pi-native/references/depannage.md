# Dépannage Cloud Pi Native

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| Rien ne se redéploie après un push | le tag d'image n'a pas changé : ArgoCD ne voit aucun diff | faire évoluer le tag (SHA court, version) dans les values du dépôt d'infra ; vérifier que la synchro a bien été déclenchée |
| Le pipeline GitLab ne se lance pas | dépôt applicatif sans fichier `.gitlab-ci-dso.yml`/`.yaml`, ou synchro non déclenchée | vérifier le nom du fichier attendu (les docs CPiN ne sont pas cohérentes) ; relancer le pipeline `mirror` avec `PROJECT_NAME` et `GIT_BRANCH_DEPLOY` |
| Le build échoue tout de suite | étape `read_secret` absente ou en échec | garder le job `.vault:read_secret` en premier stage |
| Pod refusé en prod, accepté en dev | Kyverno en audit hors prod, **enforce en prod** | rendre le chart avec `helm template` puis `scripts/check-cpin-rules.py` (skill `helm-chart-cpin`) ; corriger labels, probes, resources, tag, registre |
| `CreateContainerConfigError` / UID hors plage | `runAsUser`/`fsGroup` figés, SCC OpenShift | les mettre à `null` dans les values (skill `helm-chart-cpin`) |
| `ImagePullBackOff` | image absente de Harbor, tag erroné, ou pull secret non référencé | vérifier l'image dans Harbor ; `imagePullSecrets: [{name: registry-pull-secret}]` |
| Application injoignable | namespace en deny-all | `networkPolicy` pour l'ingress/egress non couverts par les règles injectées par Kyverno |
| Dépôt qui disparaît du GitLab interne | dépôt `plugin-managed` non déclaré dans la console, supprimé au reprovisionnement | toujours créer/modifier/supprimer les dépôts par la console |
| Mes réglages ArgoCD sont ignorés | la console est source de vérité (≥ 9.11.5) | modifier révision, chemin et fichiers values dans la console |
| Un environnement n'est plus régénéré | un « Déploiement » (beta ≥ 9.25.0) existe et écrase la config des dépôts d'infra | reporter toute la config dans un déploiement, en créer un par environnement |
| Dérive (drift) détectée | paramètres saisis dans l'UI ArgoCD, ou fichiers values non nommés selon l'environnement | mettre les paramètres dans les values ; nommer `values-<env>.yaml` ; corriger avant de repasser en synchronisation automatique |
| Application déployée mais pas à jour | auto-sync désactivé | bouton *SYNC* dans ArgoCD (et *REFRESH* pour relire le dépôt GitLab) |
| Quota dépassé | somme des `resources.limits` de tous les pods du namespace > quota | réduire les limits ou demander un quota via la Service Team |
