---
description: Ouvrir une issue GitHub pour documenter une contradiction ou un problème lié à un skill
agent: build
subtask: false
---

# /feedback

Ouvre une issue GitHub pour consigner un problème de skill : **Contexte**, **Symptôme**, **Attendu**, **Reproduction**.

## Contexte

$ARGUMENTS

## Déroulé

1. **Contexte** : utilise `$ARGUMENTS` s'il est fourni (pré-rempli par l'événement `session.error`), sinon demande à l'utilisateur le message d'erreur ou la contradiction détectée.
2. **Symptôme** : demande à l'utilisateur de décrire le symptôme observé (ou de coller le message d'erreur complet).
3. **Attendu** : demande le comportement attendu.
4. **Reproduction** : demande les étapes pour reproduire le problème.

## Création de l'issue

Une fois les 4 champs recueillis, écris le corps de l'issue dans `/tmp/feedback_body.md` au format :

```markdown
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
  --title "Feedback : <résumé>" \
  --body "$(cat /tmp/feedback_body.md)" \
  --label documentation
```

> **🔧 Action manuelle requise**
>
> - Confirme avec l'utilisateur que le résumé du titre est correct avant de créer l'issue.

## Sécurité

- N'inclus **aucune donnée sensible** (secrets, tokens, chemins internes) dans l'issue.
- Si le message d'erreur contient un secret, retire-le avant l'envoi.
