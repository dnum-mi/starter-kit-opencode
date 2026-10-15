# Checklist détaillée — contrôle qualité de code

Grille exécutable, point par point. Pour chaque item : la **question à se
poser**, les **signaux d'alerte** typiques (souvent propres au code IA), et la
**cotation**.

## Échelle commune

| Statut | Critère |
|---|---|
| ✅ conforme | Une preuve accessible et suffisante soutient le critère. |
| ⚠️ à corriger | Déficience réelle mais non bloquante ; la revue continue. |
| ❌ bloquant | Défaut matériel confirmé qui empêche une fusion sûre. |
| ◻️ non évalué | La preuve ou l'accès manque. Ce n'est pas un défaut. |
| N/A | Le critère ne s'applique pas, avec justification. |

Qualifier chaque constat par une sévérité (**critique** : compromission, perte
de données, comportement central faux ; **majeure** : comportement requis
incomplet, test essentiel absent, API inexistante ; **mineure** : amélioration
locale) et, pour un risque inféré, une confiance (haute / moyenne / faible —
une confiance faible appelle une vérification, pas une accusation). Ne pas
employer ⚠️ pour masquer une absence de preuve : utiliser ◻️.

---

## NIVEAU 1 — Règles d'entrée

### 1.1 Intention déclarée
- Question : quel *effet* la contribution vise-t-elle ? Est-il énoncé, ou
  faut-il le deviner à partir du diff ?
- Alerte : titre générique (« fix », « update »), description absente ou
  visiblement générée, PR qui « améliore » sans problème identifié.
- Cotation : ❌ si les métadonnées accessibles ne contiennent aucune intention
  lisible ; ◻️ si la description ou l'issue n'est pas accessible — demander
  avant de coter.

### 1.2 Propriétaire humain responsable
- Question : quel humain nommé assume ce code et sa reprise ?
- Alerte : « généré par l'agent », aucun mainteneur prêt à répondre aux
  questions, contributeur incapable d'expliquer son propre diff.
- Cotation : ❌ si la contribution déclare qu'aucun humain ne l'assume ; ◻️ si
  les métadonnées ne sont pas accessibles. Un agent ou un bot ne remplace
  jamais le propriétaire humain.

### 1.3 Preuve de comportement
- Question : y a-t-il une reproduction, ou un test rouge → vert ?
- Alerte : « les tests passent » sans nouveau test ; correctif sans cas
  reproduisant le bug ; capture d'écran au lieu d'une preuve exécutable.
- Cotation : ⚠️ si preuve faible, ❌ si aucune preuve pour un correctif de
  bug ; ◻️ si les résultats de tests sont inaccessibles. Ne pas exiger
  mécaniquement un nouveau test pour un changement sans comportement
  exécutable (documentation, configuration triviale).

### 1.4 Coût de revue proportionné
- Question : la taille et la découpe rendent-elles la revue humainement
  possible dans un temps raisonnable ?
- Alerte : méga-PR (milliers de lignes) générée en minutes, mélange de
  refactor + feature + reformatage dans un seul diff.
- Cotation : ⚠️/❌ → demander un découpage avant toute revue de fond. Une
  taille élevée est un signal, pas une preuve : une grosse PR expliquée,
  découpée en commits cohérents et testée peut rester révisable.

### Décision après le Niveau 1

Si un élément indispensable est ❌ ou ◻️ et empêche une décision sûre :
effectuer le **balayage critique** (secrets, injection, contrôle d'accès,
destruction de données, dépendance suspecte — voir SKILL.md), rendre
**NON RÉVISABLE**, marquer les contrôles restants ◻️, et lister exactement ce
qu'il faut fournir ou découper pour reprendre.

---

## NIVEAU 2 — Règles de fond

### 2.1 Lisibilité / intention du code
- Question : puis-je lire une fonction et dire *ce qu'elle fait et pourquoi*
  sans exécuter mentalement chaque ligne ?
- Alerte : noms vagues (`data`, `tmp`, `handle`), fonctions trop longues,
  abstractions inutiles, commentaires qui paraphrasent le code au lieu de
  justifier les choix.
- Cotation : ⚠️ si des noms ou structures obscurcissent l'intention par
  endroits ; ❌ si une fonction centrale du diff reste incompréhensible sans
  exécution mentale ligne à ligne. Repère chiffré : une fonction de complexité
  cyclomatique > 15 vaut ⚠️ d'office.

### 2.2 Absence de duplication
- Question : ce bloc existe-t-il déjà ailleurs ? Aurait-il dû être factorisé ?
- Alerte : copier-coller avec variations minimes, logique répétée dans
  plusieurs fichiers, réimplémentation d'un utilitaire existant. (Défaut n°1
  documenté du code assisté par IA.)
- Cotation : ⚠️ duplication locale facilement factorisable ; ❌ bloc de logique
  métier cloné ou réimplémentation d'un utilitaire déjà présent dans le dépôt.
  Repère chiffré : tout bloc cloné de plus de 5-10 lignes se justifie ou se
  factorise.

### 2.3 Justesse vérifiée ≠ tests qui passent
- Question : les tests vérifient-ils le *bon* comportement, ou ont-ils été
  taillés pour passer ?
- Alerte : assertions triviales, valeurs attendues codées en dur qui reflètent
  la sortie observée plutôt que la spécification, tests sans cas négatifs,
  mocks qui masquent la vraie logique. (Le piège « optimiser la mesure ».)
- Cotation : ⚠️ tests présents mais faibles (pas de cas négatifs, assertions
  minces) ; ❌ test taillé pour verdir (assertion recopiant la sortie observée)
  ou comportement central du diff non testé.

### 2.4 API et fonctions réelles
- Question : chaque appel externe existe-t-il réellement dans cette version ?
- Alerte : méthodes/options/paramètres inventés, signatures fausses, imports
  de paquets inexistants, exemples plausibles mais faux (cas curl). Vérifier
  contre la doc/le code réel, pas contre la vraisemblance.
- Cotation : ❌ dès qu'un appel, une option ou un import inexistant est
  confirmé (vérifié contre la doc ou le code, pas l'intuition) ; ⚠️ si l'usage
  est réel mais déprécié ou fragile. Un paquet inconnu ou privé n'est pas une
  hallucination tant que la vérification n'a pas conclu.

### 2.5 Erreurs et cas limites
- Question : que se passe-t-il hors du chemin heureux ?
- Alerte : pas de gestion d'erreur, entrées nulles/vides ignorées, hypothèses
  implicites (liste non vide, réseau fiable), absence de timeout/retry,
  conditions de course.
- Cotation : ⚠️ bords secondaires négligés ; ❌ chemin d'erreur du flux
  principal absent (entrée nulle, échec réseau) là où le contexte l'exige.

### 2.6 Sécurité, secrets, dépendances
- Question : introduit-on une faille, un secret, une dépendance douteuse ?
- Alerte : secrets/clés en dur, entrées non validées, SQL/commande concaténée,
  dépendance hallucinée (nom inexistant → risque de *slopsquatting*), paquet
  non maintenu ou vulnérable, permissions trop larges.
- Outils : `npm audit --audit-level=high`, `pip-audit` ou `trivy fs .` pour
  les dépendances vulnérables ; pour tout paquet nouvellement introduit,
  vérifier qu'il existe réellement sur le registre officiel
  (anti-*slopsquatting*).
- Cotation : ❌ secret en dur, injection possible ou dépendance
  inexistante/vulnérable ; ⚠️ validation d'entrée incomplète sans exposition
  directe.

### 2.7 Surface de maintenance
- Question : quel poids de long terme ce code ajoute-t-il ?
- Alerte : nouvelle dépendance lourde pour un petit gain, couplage fort,
  config supplémentaire, chemin de code que personne ne comprendra dans 3 ans.
- Cotation : ⚠️ poids ajouté réel mais assumé et documenté ; ❌ dépendance
  lourde ou couplage fort dont le gain ne justifie pas le coût de long terme.

---

## NIVEAU 3 — Règles de statut

### 3.1 Marquer le jetable comme jetable
- Question : ce code est-il un prototype ? Si oui, est-ce explicite ?
- Alerte : prototype qui glisse en production sans étiquette, « démo » branchée
  sur des données réelles, absence de date de mort ou de plan de reprise.
- Cotation : ⚠️ statut ambigu à clarifier avant fusion ; ❌ prototype branché
  sur de la production sans étiquette ni plan de reprise.

### 3.2 Une porte unique
- Question : ce code a-t-il subi la même revue que n'importe quel autre ?
- Alerte : contournement au motif que « c'est le chef qui l'a écrit » ou « c'est
  l'IA, c'est propre », auto-merge sans relecture.
- Cotation : ❌ si un contournement de revue est constaté (auto-fusion,
  passe-droit) ; ✅ sinon.

### 3.3 Tracer l'origine IA
- Question : sait-on quelle part est générée, pour en suivre le taux de défaut ?
- Alerte : aucune traçabilité, impossibilité de mesurer si le code IA casse
  plus souvent. (Mesurer, pas interdire.)
- Cotation : dépôt sans convention de traçage → consultative, ⚠️ au maximum
  (recommander d'instaurer la convention) ; convention en place → ❌ si du code
  généré n'est pas déclaré ; ◻️ si l'usage de l'IA ne peut pas être établi ;
  N/A si aucune assistance n'est connue et qu'aucune politique ne l'exige.
  (Voir la calibration dans SKILL.md.) Ne pas inventer l'identité ou le modèle
  d'un agent : écrire « non exposé par l'environnement ». `Assisted-by` est
  documenté pour le noyau Linux mais n'est pas une norme universelle :
  <https://www.kernel.org/doc/html/next/process/coding-assistants.html>.

---

## Modèle de compte rendu de revue

```
VERDICT : NON RÉVISABLE | ACCEPTER | CORRIGER | REFUSER

Résumé (2-3 lignes) : intention de la contribution + décision.

Balayage critique (toujours, même si non révisable) :
- résultat

Bloquants (❌) :
- [sévérité] fichier:ligne — problème — action attendue

À corriger (⚠️) :
- [sévérité] fichier:ligne — problème — suggestion

Non évalué (◻️) / N-A :
- élément — raison — information nécessaire pour coter

Réserves mineures / cosmétique :
- ...

Statut : prototype étiqueté ? origine IA tracée ? propriétaire identifié ?

Revue réalisée par : <humain, ou agent : nom (identifiant exact du modèle)>
```

Règle d'or : citer des emplacements précis, séparer le bloquant du cosmétique,
et refuser proprement quand il le faut — laisser entrer une dette que quelqu'un
paiera en silence n'est pas un service rendu.
