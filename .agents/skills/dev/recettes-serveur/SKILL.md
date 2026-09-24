---
name: recettes-serveur
description: Use when building server projects for Fabrique Numérique — project scaffolding, structure, logging, error handling, OpenAPI docs, and testing patterns
allowed-tools: Bash Read Write
---

# CoFabNum Server Recipes

Node.js/TypeScript: **Fastify** or **NestJS**. Python: **FastAPI**.

## Available Scripts

- **`scripts/scaffold-nestjs.sh`** — Creates a NestJS project with CoFabNum conventions
  - Usage: `bash scripts/scaffold-nestjs.sh <project-name>`
  - Installs nestjs-pino, @nestjs/swagger, configures ESLint for NestJS
  - Sets up tsconfig with decorator support
- **`scripts/scaffold-fastify.sh`** — Creates a Fastify project with CoFabNum conventions
  - Usage: `bash scripts/scaffold-fastify.sh <project-name>`
  - Full project structure: plugins, routes, schemas, error handler, logger, tests
  - Configures @fastify/swagger, @fastify/cors, @sinclair/typebox
- **`scripts/scaffold-fastapi.sh`** — Creates a FastAPI project with CoFabNum conventions
  - Usage: `bash scripts/scaffold-fastapi.sh <project-name>`
  - Full project structure: routers, schemas, services, models, utils
  - Configures ruff, pytest, lifespan pattern

### Scaffolding

```shell
npx @nestjs/cli new my-app
```

### Project structure

```
src/
└── modules/
    └── cats/
        ├── controllers/cats.controller.ts
        ├── providers/cats.service.ts
        ├── entity/cats.entity.ts
        └── cats.module.ts
```

Modules and files **plural**: `CatsModule`, `CatsService`, `CatsController`.

### Logging (nestjs-pino)

```shell
pnpm add nestjs-pino pino-http
```

```typescript
// app.module.ts
import { LoggerModule } from 'nestjs-pino';
@Module({ imports: [LoggerModule.forRoot()] })
class AppModule {}

// main.ts
import { Logger } from 'nestjs-pino';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))
  await app.listen(3000)
}
```

**Gotcha**: Pass `{ bufferLogs: true }` to `NestFactory.create()`, otherwise logs are lost before pino is set up.

### Error filter

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status = exception.getStatus()
    this.logger.error(exception.getResponse())
    response.status(status).json({
      ...(exception.getResponse() as any),
      timestamp: new Date().toISOString(),
    })
  }
}
```

### OpenAPI

See [stack-technique] for full setup. Use `@nestjs/swagger`.

### Gotchas

- Use `nestjs-pino` not the built-in NestJS logger — it outputs JSON automatically
- The `HttpExceptionFilter` must be registered in `main.ts`: `app.useGlobalFilters(new HttpExceptionFilter(logger))`
- Enable `experimentalDecorators` and `emitDecoratorMetadata` in `tsconfig.json` or ESLint errors

## Fastify

### Scaffolding

```shell
mkdir my-app && cd my-app
pnpm init
pnpm add fastify
pnpm add -D typescript @types/node tsx
```

### Project structure

```
src/
├── index.ts             # Entry point
├── app.ts               # Fastify instance
├── plugins/             # CORS, Swagger, Auth
├── routes/
│   ├── index.ts
│   └── cats/
│       ├── index.ts
│       ├── cats.schema.ts
│       └── cats.service.ts
└── utils/logger.ts
test/routes/cats.test.ts
```

### Plugin pattern

```typescript
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

const myPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('myUtil', () => { /* ... */ })
}
export default fp(myPlugin, { name: 'my-plugin' })
```

### Validation with TypeBox

```typescript
import { Type, Static } from '@sinclair/typebox'

const CatSchema = Type.Object({
  id: Type.Number(),
  name: Type.String({ minLength: 1 }),
  age: Type.Number({ minimum: 0 }),
})
type Cat = Static<typeof CatSchema>

export const getCatOpts = {
  schema: {
    params: Type.Object({ id: Type.Number() }),
    response: { 200: CatSchema },
  },
}
```

### Routes

```typescript
const catsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => catsService.findAll())
  fastify.get<{ Params: { id: number } }>('/:id', { schema: getCatOpts.schema }, async (req) =>
    catsService.findById(req.params.id))
  fastify.post<{ Body: Cat }>('/', async (req, reply) => {
    const cat = await catsService.create(req.body)
    return reply.code(201).send(cat)
  })
}
```

### Logging

Uses [pino](https://getpino.io/) by default:

```typescript
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    ...(process.env.NODE_ENV === 'development' && {
      transport: { target: 'pino-pretty' },
    }),
  },
})
```

### Error handler

```typescript
fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error)
  const statusCode = error.statusCode ?? 500
  reply.status(statusCode).send({ statusCode, error: error.name, message: error.message, timestamp: new Date().toISOString() })
})
```

### OpenAPI

See [stack-technique] for full setup. Use `@fastify/swagger` + `@fastify/swagger-ui`.

### Testing

```typescript
import { buildApp } from '../src/app'

it('GET /cats returns list', async () => {
  const app = await buildApp()
  const res = await app.inject({ method: 'GET', url: '/cats' })
  expect(res.statusCode).toBe(200)
})
```

**Gotcha**: Use `app.inject()` — no need to start a real server for tests.

## FastAPI

### Scaffolding

```shell
uv init my-api && cd my-api
uv add "fastapi[standard]"
uv run fastapi dev
```

### Project structure

```
app/
├── main.py              # Entry
├── config.py            # Env vars (BaseSettings)
├── models/              # SQLAlchemy
├── schemas/             # Pydantic
├── routers/             # APIRouter
├── services/            # Business logic
└── utils/
tests/
```

### Pydantic schemas

```python
from pydantic import BaseModel, Field

class CatBase(BaseModel):
    name: str = Field(min_length=1, description="Nom du chat")
    age: int = Field(ge=0)

class CatCreate(CatBase): pass

class CatResponse(CatBase):
    id: int
    model_config = {"from_attributes": True}
```

### Routes

```python
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/cats", tags=["cats"])

@router.get("/", response_model=list[CatResponse])
async def get_cats():
    return await CatsService.find_all()

@router.post("/", response_model=CatResponse, status_code=status.HTTP_201_CREATED)
async def create_cat(cat: CatCreate):
    return await CatsService.create(cat)
```

### Async vs sync

```python
# ✅ I/O operations — async
@router.get("/cats")
async def get_cats():
    return await db.fetch_all(query)

# ✅ CPU-bound — sync
@router.get("/compute")
def compute():
    return heavy_computation()
```

### Logging with lifespan

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("App started")
    yield
    logger.info("App stopped")

app = FastAPI(lifespan=lifespan)
```

**Gotcha**: Use `lifespan` context manager, not `@app.on_event("startup")` (deprecated since FastAPI 0.93+).

### Error handling

```python
class AppException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

@app.exception_handler(AppException)
async def handler(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
```

### OpenAPI

Auto-generated at `/docs` (Swagger) and `/redoc`.

### Testing

```shell
uv add --dev pytest httpx
```

```python
from fastapi.testclient import TestClient

def test_get_cats():
    assert client.get("/cats").status_code == 200
```

### Dockerfile template

See [conventions-cofabnum] for the optimized multi-stage Dockerfile template with `uv`.

## Gotchas

- **NestJS**: Always register the global exception filter in `main.ts`, not just the class definition
- **Fastify**: JSON Schema validation is mandatory, not optional. Use `@sinclair/typebox` for type inference
- **FastAPI**: Use `async` for I/O endpoints but `def` (sync) for CPU-bound work — mixing them up blocks the event loop
- **FastAPI**: `lifespan` replaces `@app.on_event` — using the old pattern generates deprecation warnings
- **All**: Always return proper HTTP status codes (201 for POST create, not 200)
- **All**: Error messages should be in French or use dictionary keys understood by the client
- **All**: Log response time on every request
- **All**: Use structured JSON logs (stdout) for container collection
