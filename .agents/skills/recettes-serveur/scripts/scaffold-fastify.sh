#!/usr/bin/env bash
set -euo pipefail

# CoFabNum Fastify Scaffold
# Creates a new Fastify project with CoFabNum conventions.
# Usage: bash scripts/scaffold-fastify.sh <project-name>

NAME="${1:-}"

if [[ -z "$NAME" ]]; then
  echo "Error: project name is required"
  echo "Usage: bash scripts/scaffold-fastify.sh <project-name>"
  echo "Example: bash scripts/scaffold-fastify.sh my-api"
  exit 1
fi

echo "Creating Fastify project: $NAME"

# Initialize project
pnpm init
pnpm add fastify

# Dev dependencies
pnpm add -D typescript @types/node tsx @sinclair/typebox
pnpm add -D @fastify/swagger @fastify/swagger-ui
pnpm add -D @fastify/autoload pino-pretty

# Create tsconfig
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"]
}
EOF

# Create source structure
mkdir -p src/{plugins,routes/cats,test/routes}

# Entry point
cat > src/index.ts << 'EOF'
import { buildApp } from './app'

const PORT = process.env.PORT || 3000

async function main() {
  const app = await buildApp()
  try {
    await app.listen({ port: Number(PORT), host: '0.0.0.0' })
    console.log(`Server running on port ${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
EOF

# App config
cat > src/app.ts << 'EOF'
import Fastify, { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import cors from '@fastify/cors'

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      ...(process.env.NODE_ENV === 'development' && {
        transport: { target: 'pino-pretty' },
      }),
    },
  })

  // Plugins
  await fastify.register(cors, { origin: true })
  await fastify.register(fastifySwagger, {
    openapi: {
      info: { title: 'My API', version: '1.0.0' },
    },
  })
  await fastify.register(fastifySwaggerUI, { routePrefix: '/documentation' })

  // Routes
  await fastify.register(import('./routes/index'), { prefix: '/api/v1' })

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error)
    const statusCode = error.statusCode ?? 500
    reply.status(statusCode).send({
      statusCode,
      error: error.name,
      message: error.message,
      timestamp: new Date().toISOString(),
    })
  })

  return fastify
}
EOF

# CORS plugin
cat > src/plugins/cors.ts << 'EOF'
import fp from 'fastify-plugin'
import cors from '@fastify/cors'

export default fp(async (fastify) => {
  await fastify.register(cors, { origin: true })
})
EOF

# Routes index
cat > src/routes/index.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify'
import cats from './cats/index'

const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cats, { prefix: '/cats' })
}

export default routes
EOF

# Cats route
cat > src/routes/cats/index.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'

const catsRoutes: FastifyPluginAsync = async (fastify) => {
  const CatSchema = Type.Object({
    id: Type.Number(),
    name: Type.String({ minLength: 1 }),
    age: Type.Number({ minimum: 0 }),
  })

  fastify.get('/', async () => {
    return [] // catsService.findAll()
  })

  fastify.get<{ Params: { id: string } }>('/:id', async (request) => {
    return {} // catsService.findById(Number(request.params.id))
  })

  fastify.post('/', {
    schema: {
      body: CatSchema,
      response: { 201: CatSchema },
    },
  }, async (request, reply) => {
    // const cat = await catsService.create(request.body)
    // return reply.code(201).send(cat)
    return reply.code(201).send({ id: 1, name: request.body.name, age: request.body.age })
  })
}

export default catsRoutes
EOF

# Logger utility
cat > src/utils/logger.ts << 'EOF'
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
})
EOF

# Test example
cat > test/routes/cats.test.ts << 'EOF'
import { describe, it, expect } from 'vitest'
import { buildApp } from '../../src/app'

describe('GET /cats', () => {
  it('should return empty array', async () => {
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/cats' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toBeInstanceOf(Array)
  })
})

describe('POST /cats', () => {
  it('should create a cat with 201', async () => {
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/cats',
      payload: { name: 'Minou', age: 3 },
    })
    expect(res.statusCode).toBe(201)
  })
})
EOF

# Add .editorconfig
cat > .editorconfig << 'EOF'
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
EOF

# Update package.json with scripts
node -e "
const fs = require('fs')
const pkg = JSON.parse(fs.readFileSync('package.json'))
pkg.scripts = {
  dev: 'tsx watch src/index.ts',
  build: 'tsc',
  start: 'node dist/index.js',
  lint: 'eslint .',
  test: 'vitest',
  typecheck: 'tsc --noEmit'
}
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
"

echo ""
echo "═══════════════════════════════════════"
echo " Fastify project '$NAME' created ✓"
echo ""
echo " Next steps:"
echo "   cd $NAME"
echo "   pnpm install"
echo "   pnpm dev"
echo ""
echo " Structure follows CoFabNum conventions."
echo " See conventions-cofabnum for full guidelines."
echo "═══════════════════════════════════════"
