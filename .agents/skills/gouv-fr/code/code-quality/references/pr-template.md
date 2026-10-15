# Modèle de corps de pull request

À utiliser pour toute PR produite en appliquant le skill (voir « Livraison des
changements » dans `SKILL.md`). Remplacer les `<chevrons>` ; ne supprimer
aucune section — écrire « N/A » avec une justification si une section est sans
objet. Le trailer `Assisted-by` figure aussi dans chaque commit de la branche.

---

Assisted-by: `<nom de l'agent> (<identifiant exact du modèle>)`

## Intention

`<L'effet recherché, en 2-3 phrases : quel problème, pour qui, pourquoi
maintenant. Pas la liste des fichiers modifiés.>`

## Propriétaire humain

`<Nom / @pseudo de l'humain qui assume cette PR, répondra aux questions de
revue et portera la reprise.>`

## Preuve de comportement

`<Selon le cas :
- correction de bug : reproduction + test rouge→vert ;
- refactorisation du rituel : mesures avant/après (mêmes outils, mêmes flags)
  et suite de tests verte avant comme après ;
- documentation / process : extrait de sortie démontrant le nouveau
  comportement.>`

## Auto-évaluation (Niveaux 1 et 3 de la grille)

| Règle | Cote | Justification |
|---|---|---|
| 1.1 Intention déclarée | ✅/⚠️/❌ | `<…>` |
| 1.2 Propriétaire humain | ✅/⚠️/❌ | `<…>` |
| 1.3 Preuve de comportement | ✅/⚠️/❌ | `<…>` |
| 1.4 Coût de revue proportionné | ✅/⚠️/❌ | `<taille du diff, découpe>` |
| 3.1 Statut (durable / jetable) | ✅/⚠️/❌ | `<…>` |
| 3.2 Porte unique | ✅/⚠️/❌ | Revue humaine attendue, pas d'auto-fusion |
| 3.3 Origine IA tracée | ✅/⚠️/❌ | Trailer `Assisted-by` dans les commits et ci-dessus |
