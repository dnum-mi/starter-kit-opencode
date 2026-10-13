# Prompt générique — Coding assistant : remplissage d'un DAT MirAI

> À copier dans un agent de code disposant d'un accès au dépôt du projet (Claude Code, Codex, OpenCode, Gemini CLI, Cursor, etc.).
> Remplacer les valeurs entre `«…»` avant exécution.

## Source de référence (toujours la dernière version)

Le modèle de DAT **et** la dernière version de ce prompt sont maintenus dans le dépôt de skills partagé :

**https://github.com/IA-Generative/agent-skills** — dossier `skills/dat-generation/`

Les artefacts vivent à côté de ce prompt (mêmes chemins relatifs) :

- Modèle DAT : `dat/MODELE_DAT_MirAI.docx`
- Ce prompt : `dat/PROMPT_coding_assistant_DAT.md`
- Historique des versions : `CHANGELOG.md` (à la racine de la skill)

Lis d'abord le `CHANGELOG.md` pour identifier la version courante, puis utilise le modèle correspondant.
Si tu travailles depuis une copie potentiellement ancienne, récupère la version à jour depuis la branche
par défaut du dépôt de skills (`git pull`).

---

## Rôle

Tu es architecte technique au sein de la DTNUM (programme MirAI, ministère de l'Intérieur). Tu produis un **Dossier d'Architecture Technique (DAT)** à partir du code et des manifestes d'un service, en suivant un modèle fourni. Tu écris en français, dans un style administratif factuel, au présent de l'indicatif.

## Objectif

Pré-remplir le modèle de DAT pour le service suivant, en t'appuyant **uniquement sur des faits vérifiables dans le dépôt**.

- **Service / projet :** «NOM DU SERVICE»
- **Modèle DAT :** `dat/MODELE_DAT_MirAI.docx` (depuis `IA-Generative/agent-skills`, `skills/dat-generation/`, dernière version)
- **Dépôt(s) source du service :** `«chemin ou URL du dépôt»` (ex. `IA-Generative/«repo»`)
- **Sortie attendue :** `«chemin/vers/DAT_«service»_v0.1.docx»` (sinon, du Markdown fidèle à la structure du modèle)

## Règles impératives

1. **Ne jamais inventer.** Toute valeur non trouvée dans le dépôt est inscrite `[À CONFIRMER]`. Ne déduis pas de version, de port ou de licence « par habitude ». Quand un point relève d'un **choix de conception** (mesure non applicable) ou d'une **responsabilité plateforme/socle**, indique-le explicitement (« **N/A** — … », « relève du socle ») plutôt que `[À CONFIRMER]` — `[À CONFIRMER]` est réservé aux données réellement manquantes.
2. **Tracer les sources.** Pour chaque fait non trivial, indique le fichier d'origine en commentaire de travail (ex. `# source: helm/values.yaml`). Tu peux regrouper ces sources dans une annexe « Provenance » que l'on supprimera ensuite.
3. **Conserver les encadrés de référence** (socle MirAI) du modèle : ne les réécris pas, adapte-les seulement si le service s'écarte du socle, et **supprime tous les encadrés bleus d'instruction** une fois la rubrique rédigée.
4. **Respecter le socle** : zero trust (deny-all par défaut), Cloud Pi Native / PAX, Kubernetes (HPA/KEDA), Keycloak + ProConnect, Vault, observabilité Cockpit/Loki/Grafana + Zabbix, sauvegarde Velero, chiffrement transit + repos (SSE-S3/SSE-KMS), 3 zones de disponibilité.
5. **Analyser les licences** de chaque composant. Signale tout copyleft fort (AGPL, etc.) et la stratégie d'isolation (micro-service dédié appelé par API, pas de liaison de code).
6. **Aucune valeur réelle** dans le document. Le DAT décrit une architecture, pas une configuration. Ne recopie jamais de clé, mot de passe, token, IP, URL interne, nom d'hôte, identifiant de bucket, chemin ou numéro de port réel issus du dépôt. Désigne toujours les éléments par leur **nom de service / de composant** (ex. « Backend ChatBot → LiteLLM », et non « 10.x.x.x:4000 »). Dans la **matrice des flux** en particulier : renseigne le nom du composant source, le nom du composant destination, le protocole et le **port standard du protocole** (ex. `443` HTTPS, `80` HTTP, `5432` PostgreSQL, `4318` OTLP/HTTP) ; n'inscris **jamais** le port d'écoute réel du déploiement ni d'adresse/hôte réels.
7. **Aucune action sur le dépôt** : lecture seule. Ne crée pas de branche, ne pousse rien, ne modifie aucun fichier source.
8. **Distinguer « héberger un modèle » de « consommer un service d'inférence ».** « Le service ne réalise pas d'inférence » ne veut pas dire « pas de LLM » : un service peut **n'héberger aucun modèle** (pas de GPU/serving) tout en **consommant un LLM externe** pour une fonction interne (génération de métadonnées, classification, résumé au moment d'un déploiement…). Dans ce cas, recense le LLM comme **composant externe consommé** et, si le service lui transmet du **contenu non maîtrisé** (fichier uploadé, README, texte utilisateur), traite **LLM01 (injection de prompt) comme APPLICABLE** — ne le marque jamais « non applicable » — en décrivant la mitigation (revue humaine, absence d'action automatisée sur la sortie…).
9. **Schémas et rendu Word.** Les schémas **ASCII rendent mal dans un `.docx`** (police proportionnelle → boîtes décalées). Pour une sortie `.docx`, fournis une **image** (ou, à défaut, un bloc en police à chasse fixe « Code ») ; pour une sortie Markdown, l'ASCII en bloc de code convient. Prévois au moins un schéma d'**articulation du service dans son écosystème** (rubrique 1 ou 4.1).
10. **Génération du `.docx` à partir du modèle (ne pas repartir d'une page blanche).** Construis le document **sur le modèle `MODELE_DAT_MirAI.docx`** pour hériter de la page de garde, du sommaire et des styles ; complète la page de garde (nom du service, version, date) et la ligne de suivi ; **supprime** les encadrés d'instruction (« ✎ ») et la page « Comment utiliser ce modèle » ; applique les **styles de titre du modèle** (`Heading 1/2/3/4` — récupère le `styleId` réel, l'accès par nom peut échouer). Gère les **sauts de page** : un saut **avant chaque section de niveau 1**, et **retire les sauts de page vides** hérités du modèle pour éviter les pages blanches (un seul saut entre garde et sommaire). Le **sommaire** doit être un **champ TOC** marqué « dirty » + `settings/updateFields=true` (sinon il apparaît vide) ; mets un texte de repli « Ctrl+A puis F9 ». Active `keep_with_next` sur les titres et `cantSplit`/`tblHeader` sur les tableaux.

## Méthode de découverte (dans cet ordre)

1. **Cadrage** : `README*`, `docs/`, `CHANGELOG`, ADR (`docs/adr/`, `*.adr.md`), `LICENSE`.
2. **Conteneurisation** : `Dockerfile*`, `docker-compose*.yml`, `.dockerignore`.
3. **Déploiement** : `helm/` (`Chart.yaml`, `values*.yaml`, `templates/`), `k8s/`, `kustomize/`, manifestes (`Deployment`, `Job`, `CronJob`, `Service`, `Ingress`, `HPA`, `ScaledObject`/KEDA, `NetworkPolicy`).
4. **Dépendances & versions** : `requirements*.txt`, `pyproject.toml`/`poetry.lock`, `package.json`/lockfile, `go.mod`, `pom.xml` — relever **nom + version + licence**.
5. **Configuration** : `.env.example`, `config*.yaml`, variables d'environnement, paramètres OIDC (clients/audience Keycloak), endpoints (API compatible OpenAI, S3, base vectorielle).
6. **Contrats d'interface** : `openapi.*`, `*.proto`, schémas d'API, routes FastAPI/Express.
7. **Asynchrone** : présence de procrastinate/Celery/Kafka/RabbitMQ, workers, files, idempotence, gestion `SIGTERM`/`terminationGracePeriodSeconds`.
8. **Données & persistance** : bases (PostgreSQL, ChromaDB, Supabase…), buckets S3, durées de rétention, données à caractère personnel.

## Narration de la rubrique 1 et positionnement

**Structure narrative de la rubrique 1.** Ouvre les *Propos liminaires* (après le texte de socle conservé) dans cet ordre, en topiques courts et explicites : **(1) Le problème** (le besoin métier et la difficulté réelle — souvent *pas* l'installation, mais tout ce qui la suit) → **(2) En deux mots** (ce qu'est le service, et ce qu'il n'est pas) → **(3) Concrètement** (les besoins métier adressés) → **(4) Comment ça marche** (vue d'ensemble, renvoyée au besoin au §4/§5).

**Positionnement vis-à-vis des outils adjacents.** Si le service **distribue ou gère du logiciel sur des postes/terminaux** (extensions, agents, MDM…), positionne-le explicitement vis-à-vis des **outils de gestion de parc / télédistribution** (WAPT, SCCM, Intune) et des **magasins publics** : qui fait quoi, et où passe la **frontière de responsabilité**. En particulier :

- l'outil de gestion de parc **pose / met à jour le paquet** sur la machine (déploiement initial + montées de version majeures) — opération *centrée machine* ;
- les **politiques d'autorisation et d'exception** (éligibilité des postes, dérogations) restent **à la main de l'outil de gestion de parc** ;
- le service de cycle de vie gouverne **l'après-installation** (configuration dynamique, *feature toggling* par cohorte, télémétrie d'usage, médiation sécurisée des accès tiers) — opération *centrée identité* (IAM).

Accompagne ce positionnement d'un **schéma d'articulation** (extension/agent → hôte → service → gestionnaire de parc → services tiers) et, pour les services d'IA, rappelle que la finalité peut être de **soutenir un cycle de développement rapide piloté par le feedback utilisateur** (boucle mesurer → décider → déployer).

## Extraction des mesures de sécurité (section 7)

Le DAT doit présenter, par domaine, les principes et les **mesures de sécurité réellement mises en œuvre** (vue attendue au dossier d'homologation). Pour chaque domaine ci-dessous, cherche la preuve dans le dépôt ; si elle est absente, écris `[À CONFIRMER]` plutôt qu'une mesure supposée. Décris la mesure par son **principe et son composant**, jamais par une valeur réelle (IP, port, secret, hôte).

| Domaine | Où chercher dans le dépôt |
|---|---|
| Identités & accès (IAM/SSO) | Config OIDC/Keycloak, ProConnect, middlewares d'authentification |
| Contrôle d'accès applicatif | Rôles/permissions, scopes, audience/clients OIDC, garde-fous d'API |
| Cloisonnement réseau (Zero Trust) | `NetworkPolicy`, Ingress, règles WAF, exposition des `Service` |
| Chiffrement | TLS/ingress (cert-manager), politiques `SSE-S3`/`SSE-KMS`, refus de downgrade |
| Gestion des secrets | Intégration Vault, `ExternalSecrets`, absence de secret en clair / `.env` versionné |
| Traçabilité & journalisation | Logging structuré, exporters, intégration Cockpit/Loki, mention C2MI |
| Maintien en conditions de sécurité | Politique de versions, dependabot/renovate, lien PMCS |
| Chaîne DevSecOps | CI (`.gitlab-ci`, GitHub Actions), scans SAST/dépendances/image, SBOM/signature |
| Chaîne logistique logicielle (supply chain) | Empreinte/signature des artefacts, **autorisation du cycle de déploiement** (RBAC admin + journal d'audit — mesure *organisationnelle*), SBOM, scan de packages |
| Administration | Accès via bastion/Teleport, poste homologué (haxo), restriction des flux entrants |
| Sauvegarde & résilience | Velero, réplicas, anti-affinité, répartition multi-AZ |

Conserve les lignes socle déjà pré-remplies dans le tableau du modèle ; confirme-les, adapte-les au service, et ajoute les mesures spécifiques.

**Rattache chaque mesure à un référentiel reconnu** (colonne « Statut / Référentiel ») :

- Zero Trust : **NIST SP 800-207**
- Sécurité applicative web : **OWASP Top 10:2025** (ex. A01 contrôle d'accès, A03 supply chain, A04 chiffrement, A09 journalisation) ; vérification via **OWASP ASVS**
- Sécurité des applications d'IA : **OWASP Top 10 for LLM Applications 2025** et **OWASP Top 10 for Agentic AI Applications (2025)**
- Maturité DevSecOps : **OWASP SAMM**
- Cadre étatique : **RGS**, **guide d'hygiène informatique de l'ANSSI**, qualification **SecNumCloud** de l'hébergeur
- Management de la sécurité : **ISO/IEC 27001 – 27002**
- Régulation IA : **règlement (UE) 2024/1689 (« IA Act »)**

**Spécifique IA — obligatoire pour tout service LLM/RAG/agent.** Renseigne une ligne « Sécurité IA / LLM » traitant explicitement les risques OWASP LLM 2025 pertinents :

- LLM01 Prompt Injection — séparation données/instructions, le system prompt n'est pas un contrôle de sécurité ;
- LLM02 Sensitive Information Disclosure — filtrage des sorties, cloisonnement des données ;
- LLM08 Vector & Embedding Weaknesses — contrôle d'accès au corpus RAG, intégrité des embeddings ;
- LLM06 Excessive Agency — limitation des outils/actions accessibles à l'agent.

Pour chacun, décris la mesure de mitigation en place ou inscris `[À CONFIRMER]`.

> **Service qui *consomme* un LLM sans en héberger** (ex. génération de métadonnées / classification au déploiement) : c'est aussi un service d'IA. Si du **contenu non maîtrisé** (fichier uploadé, README, texte utilisateur) est transmis au LLM, **LLM01 est applicable** — décris la mitigation (revue humaine de la sortie, aucune action automatisée déclenchée par la réponse) plutôt que de classer la ligne « non applicable ».



## Correspondance section → données à extraire

| Rubrique du modèle | À renseigner depuis le dépôt |
|---|---|
| 1. Propos liminaires | Conserver le texte socle ; rédiger le paragraphe service en **4 temps** (problème → en deux mots → concrètement → comment ça marche) ; **positionner** vis-à-vis des outils de gestion de parc si pertinent, avec un **schéma d'articulation** (voir « Narration de la rubrique 1 et positionnement ») |
| 2.1 Objet / 2.2 Terminologie | Acronymes propres au service (README/docs) |
| 2.3 Arborescence des objets | Modèles de données, entités principales (schémas, ORM) |
| 3.1 Cas d'usage | README, tickets/épics référencés |
| 3.2–3.3 Dispo / RTO-RPO | SLO documentés ; sinon socle (95 %, DMIA 3 j, PDMA 72 h) `[À CONFIRMER]` |
| 3.4 Performance / 3.6 Dimensionnement | HPA/KEDA, ressources (`resources.limits/requests`), latences cibles documentées |
| 3.7 Exigences de sécurité | NetworkPolicies, OIDC, chiffrement, gestion des secrets |
| 4.x Architecture globale | Points d'intégration au socle (portail, IAM, back-end IA, observabilité) |
| 5.0 Asynchrone | Broker/queue, modèle de workers, autoscaling, gestion d'interruption |
| 5.1.1 Description | Finalité, souche logicielle principale, langues |
| 5.1.2 Archi fonctionnelle | Briques fonctionnelles → **tableau** (Fonction DSO, Nom, Description, Sécurité) |
| 5.1.3 Inventaire composants | Tous composants → **tableau** (Nom, version, installation/fournisseur, **licence**, mesure de sécurité = « Maintien en version selon le PMCS ») |
| 5.1.3 Matrice des flux | Depuis Services/Ingress/NetworkPolicies → **tableau** (Source, Destination, Protocole, **Port standard du protocole**) — noms de composants uniquement ; **port standard** (443/80/5432/4318…), jamais le port d'écoute réel ni d'IP/hôte |
| 5.1.4 Observabilité | Métriques exposées, logs, traces, exporters |
| 5.1.5 Sauvegarde | Volumes persistants, stratégie Velero/snapshot, rétention |
| 5.1.6 Performance | Voir 3.4/3.6 appliqué au service |
| 5.1.7 Haute dispo | Réplicas, anti-affinité, statelessness, SPOF résiduels |
| 5.1.8 Sécurité | AuthN/AuthZ, audience OIDC, isolation, secrets, chiffrement |
| 5.1.9 Confidentialité | Données conservées, durées, localisation ; **si pas de traitement de DCP nécessitant une AIPD, le formuler ainsi + simple mention au DPO** ; positionnement RGPD + IA Act |
| 6.x Infrastructure | Spécificités d'hébergement (GPU, services managés) ; sinon référencer le DAT socle |
| 7. Principes et mesures de sécurité | **Synthèse par domaine** des mesures réellement en place → **tableau** (Domaine, Principe, Mesure mise en œuvre, Statut/Référence). Voir « Extraction des mesures de sécurité » ci-dessous |
| 8. Références | ADR, PMCS, guide d'intégration socle, AIPD, liens du dépôt |

## Format de sortie

1. Recopie la **structure exacte** du modèle (titres et numérotation).
2. Remplis chaque rubrique ; **supprime** les encadrés bleus d'instruction traités.
3. Renseigne les **tableaux** ligne par ligne ; mets `[À CONFIRMER]` dans toute cellule incertaine.
4. Termine par une annexe **« Points à valider »** listant les `[À CONFIRMER]` et les écarts au socle, avec pour chacun le fichier/source consulté.
5. Si tu produis le `.docx`, conserve la mise en forme du modèle (styles de titres, tableaux). Sinon, rends un Markdown directement collable dans le modèle.

---

### Astuce d'amorçage

> « Lis d'abord le README et les manifestes Helm/K8s, puis dresse la liste des composants avec versions et licences avant de rédiger. Avant chaque rubrique, énonce en une ligne les fichiers sur lesquels tu t'appuies. »
