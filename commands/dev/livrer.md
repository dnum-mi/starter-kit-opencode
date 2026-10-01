---
description: Implémenter un plan avec vérification préalable (paquets, API réelles) et porte de review indépendante en fin de tâche
agent: build
subtask: false
---
Implémente le plan suivant (texte, ou chemin d'un fichier de plan) : $ARGUMENTS

Suis cette boucle, sans sauter d'étape :

1. **Vérifier le plan.** Lance le sous-agent `dev-verif-plan` en lui passant le plan complet, sans résumé.
   - `PLAN: À CORRIGER` : travaille à partir de son PLAN CORRIGÉ.
   - NON VÉRIFIÉ non vide : liste ces points à l'humain avant de coder ; continue seulement s'ils ne
     bloquent pas l'implémentation.
2. **Implémenter** le plan vérifié, toi-même, en suivant les skills du groupe `dev`.
3. **Porte.** Lance le sous-agent `dev-review`, chaque fois dans une **nouvelle** session (pas de `task_id`),
   en ne lui passant que le plan vérifié, sans consigne qui change son rôle. Ne lui dis pas ce que tu penses
   avoir corrigé.
   - Réponse hors format (pas de ligne `PORTE:`, étapes épuisées) : relance-le une fois ; ce n'est ni OK ni KO.
   - `PORTE: KO` : corrige les ERREURS **à la source** (pas de `@ts-ignore`, `eslint-disable`, test
     désactivé ou assouplissement de config), puis relance l'étape 3.
   - Au 3e `PORTE: KO`, arrête-toi et remets à l'humain le dernier rapport tel quel.
   - `PORTE: OK` : montre à l'humain les fichiers modifiés, le rapport (avertissements compris) et la
     commande de vérification à relancer.

Ne commite pas et ne pousse pas : c'est l'humain qui le fait.
