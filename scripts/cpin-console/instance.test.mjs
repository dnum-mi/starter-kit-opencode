// node --test scripts/cpin-console/instance.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { currentInstance, instanceEnvTemplate, instanceFileContent, parseEnv, withUrls } from './instance.mjs'

test('sans fichier : aucune URL codée en dur', () => {
  const { name, urls } = currentInstance({ env: {}, file: null })
  assert.equal(name, 'sdid')
  assert.equal(urls.CONSOLE_URL, undefined)
  assert.equal(urls.VAULT_URL, undefined)
})

test('les URLs viennent du fichier, jamais d\'un preset', () => {
  const file = { INSTANCE: 'rie', CONSOLE_URL: 'https://console.rie/' }
  const { urls } = currentInstance({ env: {}, file })
  assert.equal(urls.CONSOLE_URL, 'https://console.rie')
  assert.equal(urls.ARGOCD_URL, undefined)
  assert.equal(urls.HARBOR_URL, undefined)
})

test('priorité : variable d\'environnement > fichier', () => {
  const file = { INSTANCE: 'rie', ARGOCD_URL: 'https://argocd.fichier/' }
  assert.equal(currentInstance({ env: {}, file }).urls.ARGOCD_URL, 'https://argocd.fichier')
  const env = { ARGOCD_URL: 'https://argocd.env' }
  assert.equal(currentInstance({ env, file }).urls.ARGOCD_URL, 'https://argocd.env')
})

test('choix : nom connu, URL https d\'une console, ou refus', () => {
  assert.equal(instanceFileContent('rie').content, 'INSTANCE=rie\n')
  assert.equal(instanceFileContent('https://console.exemple.fr/').content,
    'INSTANCE=autre\nCONSOLE_URL=https://console.exemple.fr\n')
  for (const bad of ['scaleway', 'http://console.exemple.fr', 'https://argocd.exemple.fr', undefined])
    assert.ok(instanceFileContent(bad).error, String(bad))
})

test('une valeur vide dans le fichier laisse l\'URL absente', () => {
  const file = parseEnv('INSTANCE=sdid\nARGOCD_URL=\n')
  assert.equal(currentInstance({ env: {}, file }).urls.ARGOCD_URL, undefined)
})

test('instanceEnvTemplate : placeholders, aucune URL réelle', () => {
  const content = instanceEnvTemplate()
  assert.match(content, /^INSTANCE=sdid$/m)
  for (const key of ['CONSOLE_URL', 'ARGOCD_URL', 'HARBOR_URL', 'GITLAB_URL', 'VAULT_URL'])
    assert.match(content, new RegExp(`^${key}=$`, 'm'))
  assert.doesNotMatch(content, /https?:\/\//)
})

test('--url : ajoute ou remplace une URL relevée, refuse le reste', () => {
  const { content } = withUrls('INSTANCE=rie\nARGOCD_URL=https://old\n', ['ARGOCD_URL=https://argocd.rie/', 'HARBOR_URL=https://harbor.rie'])
  assert.equal(content, 'INSTANCE=rie\nARGOCD_URL=https://argocd.rie\nHARBOR_URL=https://harbor.rie\n')
  for (const bad of ['DSO_TOKEN=https://x', 'ARGOCD_URL=http://x', 'ARGOCD_URL'])
    assert.ok(withUrls('', [bad]).error, bad)
})
