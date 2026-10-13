---
name: gouv-fr-api-rest
description: Conventions API RESTful, OpenAPI, Swagger et tests d'API pour Fabrique Numérique.
category: backend
version: 0.1.0
author: Hermes Agent
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, api, rest, openapi, swagger, http, routes, logging]
    related_skills: [gouv-fr-code-index, gouv-fr-projet-structure, gouv-fr-stack-technique, gouv-fr-datagouv-apis]
---

# Gouv-fr — API RESTful

Conventions pour la conception d'APIs RESTful, la documentation OpenAPI et les tests d'API.

## Quand utiliser
- Concevoir une nouvelle API REST
- Documenter une API avec OpenAPI/Swagger
- Tester des endpoints d'API avec les fichiers `.rest`
- Standardiser les réponses d'erreur

## Prérequis
- Framework choisi : Fastify (TypeScript), NestJS (TypeScript) ou FastAPI (Python)
- Swagger/OpenAPI configuré dans le framework

## Comment lancer
- Fastify : `pnpm add @fastify/swagger @fastify/swagger-ui`
- NestJS : `pnpm add @nestjs/swagger`
- FastAPI : auto-généré à `/docs` et `/redoc`

## Référence rapide — Nommage des routes

### Règle d'or
Routes **uniquement avec des noms**, toujours au **pluriel**, jamais de verbes. Le verbe HTTP fait office de verbe.

| Méthode | Route | Action |
|---|---|---|
| `GET` | `/cats` | Liste des cats |
| `GET` | `/cats/:id` | Un cat |
| `POST` | `/cats` | Créer un cat |
| `PUT` | `/cats/:id` | Modifier toutes les propriétés |
| `PATCH` | `/cats/:id` | Modifier quelques propriétés |
| `DELETE` | `/cats/:id` | Supprimer un cat |

### ❌ Interdit
- `/session/create`, `/users/get/1`, `/user/1`
- Verbes dans les routes (`get`, `create`, `update`)
- Singulier (`/cat` au lieu de `/cats`)

## Référence rapide — Codes HTTP

| Code | Signification |
|---|---|
| `200` | Succès (GET, PUT/PATCH, DELETE) |
| `201` | Créé (POST uniquement) |
| `400` | Requête invalide |
| `401` | Non authentifié |
| `403` | Non autorisé |
| `404` | Non trouvé |
| `409` | Conflit (ressource existe déjà) |
| `429` | Trop de requêtes |
| `500` | Erreur serveur |

## Référence rapide — Logging

- Logs sortant en **sortie standard** (stdout) pour les conteneurs
- Chaque requête loggée avec **temps de réponse**
- Actions importantes loggées (connexion, création d'enregistrement)
- Niveaux : `verbose` (dev), `debug` (dev), `log` (info), `warn`, `error`
- Logs en **JSON structuré** (pino pour Node, standard `logging` pour Python)

### Exemple Fastify (pino)
```typescript
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
  },
})
```

### Exemple FastAPI (Python)
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
```

## Référence rapide — Réponses d'erreur

- Réponses en **français** compréhensibles par l'utilisateur
- Ou clés de dictionnaire (clé → traduction côté client)
- Centraliser la gestion des erreurs (filter/exception handler)

## Référence rapide — OpenAPI / Swagger

### Fastify
```typescript
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'

await fastify.register(fastifySwagger, {
  openapi: {
    info: { title: 'Mon API', version: '1.0.0' },
  },
})
await fastify.register(fastifySwaggerUI, { routePrefix: '/documentation' })
```

### NestJS
```typescript
import { SwaggerModule } from '@nestjs/swagger'

const config = DocumentBuilder()
  .setTitle('Mon API')
  .setVersion('1.0.0')
  .addBearerAuth()
  .build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('documentation', app, document)
```

### FastAPI (auto-généré)
- Swagger UI : `/docs`
- ReDoc : `/redoc`
- Généré automatiquement depuis les schémas Pydantic

## Référence rapide — Fichiers `.rest`

### Tester des API dans VS Code

Installer l'extension **REST Client** de VS Code.

```http
@baseUrl = http://localhost:3000/api

###
GET {{baseUrl}}/cats

###
POST {{baseUrl}}/cats
Content-Type: application/json

{
  "name": "Minou",
  "age": 3
}
```

### Variables d'environnement
Dans `.vscode/settings.json` :
```json
{
  "rest-client.environmentVariables": {
    "local": { "baseUrl": "http://localhost:3000" },
    "prod": { "baseUrl": "https://api.example.com" }
  }
}
```

### Récupérer le token d'auth
```http
@name login
POST {{baseUrl}}/auth/token
Content-Type: application/json

{ "email": "admin@example.com", "password": "..." }

###
GET {{baseUrl}}/cats
Authorization: Bearer {{login.response.body.token}}
```

## Pièges
- Toujours utiliser le pluriel dans les routes (`/cats`, pas `/cat`)
- Ne jamais mettre de verbes dans les routes
- Codes HTTP : ne pas retourner 200 pour une création (utilisez 201)
- OpenAPI : la doc doit être mise à jour avec le code, pas l'inverse
- `.rest` files : ne jamais commité de vrais credentials

## Vérification
- `curl /docs` affiche la documentation OpenAPI
- Les routes respectent le format `/ressources` (pluriel, pas de verbes)
- Tous les endpoints loguent avec temps de réponse
- Les réponses d'erreur sont structurées et en français
