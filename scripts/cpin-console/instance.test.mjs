// node --test scripts/cpin-console/instance.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { currentInstance, instanceEnvTemplate, instanceFileContent, parseEnv, urlsFromServices, withUrls } from './instance.mjs'

test('sans fichier : aucune URL codée en dur', () => {
  const { urls } = currentInstance({ env: {}, file: null })
  assert.equal(urls.CONSOLE_URL, undefined)
  assert.equal(urls.VAULT_URL, undefined)
})

test('les URLs viennent du fichier', () => {
  const file = { CONSOLE_URL: 'https://console.rie/' }
  const { urls } = currentInstance({ env: {}, file })
  assert.equal(urls.CONSOLE_URL, 'https://console.rie')
  assert.equal(urls.ARGOCD_URL, undefined)
  assert.equal(urls.HARBOR_URL, undefined)
})

test('priorité : variable d\'environnement > fichier', () => {
  const file = { ARGOCD_URL: 'https://argocd.fichier/' }
  assert.equal(currentInstance({ env: {}, file }).urls.ARGOCD_URL, 'https://argocd.fichier')
  const env = { ARGOCD_URL: 'https://argocd.env' }
  assert.equal(currentInstance({ env, file }).urls.ARGOCD_URL, 'https://argocd.env')
})

test('choix : URL https d\'une console, ou refus', () => {
  assert.equal(instanceFileContent('https://console.exemple.fr/').content,
    'CONSOLE_URL=https://console.exemple.fr\n')
  for (const bad of ['sdid', 'rie', 'scaleway', 'http://console.exemple.fr', 'https://argocd.exemple.fr', undefined])
    assert.ok(instanceFileContent(bad).error, String(bad))
})

test('une valeur vide dans le fichier laisse l\'URL absente', () => {
  const file = parseEnv('CONSOLE_URL=\nARGOCD_URL=\n')
  assert.equal(currentInstance({ env: {}, file }).urls.ARGOCD_URL, undefined)
})

test('instanceEnvTemplate : placeholders, aucune URL réelle', () => {
  const content = instanceEnvTemplate()
  for (const key of ['CONSOLE_URL', 'ARGOCD_URL', 'HARBOR_URL', 'GITLAB_URL', 'VAULT_URL'])
    assert.match(content, new RegExp(`^${key}=$`, 'm'))
  assert.doesNotMatch(content, /https?:\/\//)
})

test('--url : ajoute ou remplace une URL relevée, refuse le reste', () => {
  const { content } = withUrls('CONSOLE_URL=https://console.rie\nARGOCD_URL=https://old\n', ['ARGOCD_URL=https://argocd.rie/', 'HARBOR_URL=https://harbor.rie'])
  assert.equal(content, 'CONSOLE_URL=https://console.rie\nARGOCD_URL=https://argocd.rie\nHARBOR_URL=https://harbor.rie\n')
  for (const bad of ['DSO_TOKEN=https://x', 'ARGOCD_URL=http://x', 'ARGOCD_URL'])
    assert.ok(withUrls('', [bad]).error, bad)
})

test('urlsFromServices : origine seule, services connus, chemin ignoré', () => {
  const services = [
    { name: 'argocd', urls: [{ to: 'https://argocd.sdid.exemple.fr/applications?search=projet' }] },
    { name: 'gitlab', urls: [{ to: 'https://gitlab.sdid.exemple.fr/forge-mi/projects/projet' }] },
    { name: 'registry', urls: [{ to: 'https://harbor.sdid.exemple.fr/harbor/projects/323' }] },
    { name: 'vault', urls: [{ to: 'https://vault.sdid.exemple.fr/ui/vault/secrets/projet' }] },
    { name: 'sonarqube', urls: [{ to: 'https://sonar.sdid.exemple.fr/projects' }] },
    { name: 'nexus', urls: [] },
  ]
  assert.deepEqual(urlsFromServices(services), [
    'ARGOCD_URL=https://argocd.sdid.exemple.fr',
    'GITLAB_URL=https://gitlab.sdid.exemple.fr',
    'HARBOR_URL=https://harbor.sdid.exemple.fr',
    'VAULT_URL=https://vault.sdid.exemple.fr',
  ])
  assert.deepEqual(urlsFromServices(undefined), [])
})
