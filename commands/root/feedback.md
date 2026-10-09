---
description: Ouvrir une issue GitHub pour documenter un problème lié à un skill ou au harnais
agent: build
subtask: false
---

# /feedback

Ouvre une issue GitHub pour consigner un problème rencontré avec un skill ou le harnais : **Raison**, **Contexte**, **Symptôme**, **Attendu**, **Reproduction**.

## Raison

$ARGUMENTS

## Déroulé

1. **Raison** : identifie le type de problème à partir de `$ARGUMENTS` :
   - `tourne-en-rond` : l'utilisateur répète la même demande sans progression.
   - `bloque` : le harnais n'a pas pu résoudre un problème lié à un skill.
   - `contradiction` : une solution trouvée contredit un skill ou le harnais.
   - (autre) : décris la situation.
2. **Contexte** : utilise le contexte fourni dans `$ARGUMENTS` (après la raison), sinon demande à l'utilisateur le message d'erreur ou la contradiction détectée.
3. **Symptôme** : demande à l'utilisateur de décrire le symptôme observé (ou de coller le message d'erreur complet).
4. **Attendu** : demande le comportement attendu.
5. **Reproduction** : demande les étapes pour reproduire le problème.

## Création de l'issue

Une fois les champs recueillis, écris le corps de l'issue dans `/tmp/feedback_body.md` au format :

```markdown
## Raison
<raison>

## Contexte
<contexte>

## Symptôme
<symptôme>

## Attendu
<attendu>

## Reproduction
<reproduction>
```

Puis crée l'issue :

```bash
gh issue create \
  --repo dnum-mi/starter-kit-opencode \
  --title "Feedback : <raison> — <résumé>" \
  --body "$(cat /tmp/feedback_body.md)" \
  --label documentation
```

> **🔧 Action manuelle requise**
>
> - Confirme avec l'utilisateur que le résumé du titre est correct avant de créer l'issue.

## Sécurité

- N'inclus **aucune donnée sensible** (secrets, tokens, chemins internes) dans l'issue.
- Si le message d'erreur contient un secret, retire-le avant l'envoi.
