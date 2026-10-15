// node --test scripts/cpin-console/vault.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isAllowed, parseEnv } from './vault.mjs'

test('lecture : métadonnées, LIST et introspection du jeton seulement', () => {
  for (const path of ['auth/token/lookup-self', 'sys/internal/ui/mounts', 'org-proj/metadata', 'org-proj/metadata/app/dev'])
    assert.ok(isAllowed('GET', path), path)
  assert.ok(isAllowed('POST', 'sys/capabilities-self'))
})

test('jamais de lecture du contenu d\'un secret', () => {
  for (const path of ['org-proj/data/app/dev', 'org-proj/data/app', 'org-proj/data'])
    assert.equal(isAllowed('GET', path), false, path)
  for (const path of ['org-proj/data/app/dev?version=1', 'org-proj/metadata/../data/app', 'org-proj/metadata/%2e%2e/data/x',
    'org-proj/delete/app', 'org-proj/undelete/app', 'sys/policies/acl', 'sys/mounts', 'auth/token/create'])
    for (const method of ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'])
      assert.equal(isAllowed(method, path), false, `${method} ${path}`)
})

test('écriture : data/ en PATCH ou POST, jamais en GET/DELETE', () => {
  assert.ok(isAllowed('PATCH', 'org-proj/data/app/dev'))
  assert.ok(isAllowed('POST', 'org-proj/data/app/dev'))
  assert.equal(isAllowed('DELETE', 'org-proj/data/app/dev'), false)
  assert.equal(isAllowed('POST', 'org-proj/metadata/app/dev'), false)
})

test('parseEnv : commentaires, export, guillemets, valeurs vides', () => {
  const env = parseEnv('# c\nA=1\nexport B="deux words"\nC=\n\nD=\'x=y\'\nbad line\n')
  assert.deepEqual(env, { A: '1', B: 'deux words', C: '', D: 'x=y' })
})

test('parseEnv : commentaires après valeur, guillemets, # dans un jeton', () => {
  const env = parseEnv('API_KEY="example-key" # note\nEMPTY= # fill later\nTOK=abc#def\nSP=\'a b\'   # c\nPLAIN=v  # c\n')
  assert.deepEqual(env, { API_KEY: 'example-key', EMPTY: '', TOK: 'abc#def', SP: 'a b', PLAIN: 'v' })
})
