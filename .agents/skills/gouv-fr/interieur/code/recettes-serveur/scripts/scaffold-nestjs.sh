#!/usr/bin/env bash
set -euo pipefail

# CoFabNum NestJS Scaffold
# Creates a new NestJS project with CoFabNum conventions.
# Usage: bash scripts/scaffold-nestjs.sh <project-name>

NAME="${1:-}"

if [[ -z "$NAME" ]]; then
  echo "Error: project name is required"
  echo "Usage: bash scripts/scaffold-nestjs.sh <project-name>"
  echo "Example: bash scripts/scaffold-nestjs.sh my-api"
  exit 1
fi

echo "Creating NestJS project: $NAME"

# Create project with NestJS CLI
npx @nestjs/cli new "$NAME" --language ts --package-manager pnpm --skip-git

cd "$NAME"

# Add required dependencies
pnpm add nestjs-pino pino-http
pnpm add -D @nestjs/swagger @prisma/client prisma

# Add eslint config override for NestJS
cat >> eslint.config.js << 'LINT'

// NestJS overrides
export default [
  antfu(),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
LINT

# Fix the eslint config to properly extend antfu
cat > eslint.config.js << 'LINT'
import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'style/comma-dangle': ['error', 'always-multiline'],
    'no-irregular-whitespace': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
  },
})
LINT

# Ensure tsconfig has decorators enabled
# Modify existing tsconfig.json to add decorator options
if ! grep -q "experimentalDecorators" tsconfig.json 2>/dev/null; then
  # Add decorator config after compilerOptions
  python3 -c "
import json
with open('tsconfig.json', 'r') as f:
    tsconfig = json.load(f)
tsconfig['compilerOptions']['experimentalDecorators'] = True
tsconfig['compilerOptions']['emitDecoratorMetadata'] = True
tsconfig['compilerOptions']['moduleResolution'] = 'node'
with open('tsconfig.json', 'w') as f:
    json.dump(tsconfig, f, indent=2)
    f.write('\n')
"
fi

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

echo ""
echo "═══════════════════════════════════════"
echo " NestJS project '$NAME' created ✓"
echo ""
echo " Next steps:"
echo "   cd $NAME"
echo "   pnpm install"
echo "   pnpm add @prisma/client prisma  # if using Prisma"
echo "   npx prisma init                  # if using Prisma"
echo ""
echo " Structure follows CoFabNum conventions."
echo " See conventions-cofabnum for full guidelines."
echo "═══════════════════════════════════════"
