---
description: Ouvrir une issue GitHub pour documenter une contradiction ou un problème lié à un skill
agent: build
subtask: false
---

# /feedback

Cette commande permet d’ouvrir automatiquement une issue GitHub afin de consigner :
- le **Contexte** (généralement le message d’erreur ou la contradiction détectée ),
- le **Symptôme** observé,
- l’**Attendu** (ce que le skill aurait dû faire),
- la **Reproduction** (étapes pour reproduire le problème).

## Étape 1 : Contexte (pré‑rempli si disponible)

Si la commande a été invoquée par l’événement `skill:error`, le paramètre `$ARGUMENTS` contiendra le message d’erreur à inclure.  

```
Contexte (pré‑rempli) :
$ARGUMENTS
```

Vous pouvez modifier ce texte ou simplement appuyer sur **Entrée** pour le conserver.

## Étape 2 : Symptôme

Veuillez décrire le symptôme observé (ou coller le message d’erreur complet) :

<await user input>

## Étape 3 : Attendu

Quel était le comportement attendu ?

<await user input>

## Étape 4 : Reproduction

Décrivez les étapes pour reproduire le problème :

<await user input>

---

## Génération du corps de l’issue

Le modèle construira le fichier temporaire `/tmp/feedback_body.md` à partir du template suivant :

```markdown
## Contexte
{{CONTEXT}}

## Symptôme
{{SYMPTOM}}

## Attendu
{{EXPECTED}}

## Reproduction
{{REPRODUCTION}}
```

---

## Création de l’issue

```bash
gh issue create \
  --repo dnum-mi/starter-kit-opencode \
  --title "Feedback : <résumé>" \
  --body "$(cat /tmp/feedback_body.md)" \
  --label documentation,feedback
```

---

**Utilisation**
- **Manuel** : tapez `/feedback` puis répondez aux invites.
- **Automatique** : le plugin écoute les événements `skill:error` (ou `skill:contradiction`). Si vous acceptez, le champ *Contexte* est pré‑rempli avec le message d’erreur.

---

> ⚠️ **Sécurité** : aucune donnée sensible n’est incluse dans l’issue. Si le message d’erreur contient des secrets, le handler les supprime avant l’envoi.

