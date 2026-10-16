// node --test scripts/cpin-console/instance.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { currentInstance, instanceFileContent, parseEnv, withUrls } from './instance.mjs'

test('sans fichier : SDID, comportement historique', () => {
  const { name, urls } = currentInstance({ env: {}, file: null })
  assert.equal(name, 'sdid')
  assert.equal(urls.CONSOLE_URL, 'https://console.sdid.cpin.numerique-interieur.com')
  assert.equal(urls.VAULT_URL, 'https://vault.sdid.cpin.numerique-interieur.com')
})

test('RIE : URL connues, ArgoCD sur gitops et Harbor sur registry', () => {
  const { urls } = currentInstance({ env: {}, file: { INSTANCE: 'rie' } })
  assert.equal(urls.CONSOLE_URL, 'https://console.dso.interieur.rie.gouv.fr')
  assert.equal(urls.ARGOCD_URL, 'https://gitops.dso.interieur.rie.gouv.fr')
  assert.equal(urls.HARBOR_URL, 'https://registry.dso.interieur.rie.gouv.fr')
  assert.equal(urls.GITLAB_URL, 'https://gitlab.dso.interieur.rie.gouv.fr')
  assert.equal(urls.VAULT_URL, 'https://vault.dso.interieur.rie.gouv.fr')
})

test('autre instance : seule la console est connue, le reste n\'est pas deviné', () => {
  const file = { INSTANCE: 'autre', CONSOLE_URL: 'https://console.exemple.fr' }
  assert.equal(currentInstance({ env: {}, file }).urls.ARGOCD_URL, undefined)
})

test('priorité : variable d\'environnement > fichier > instance', () => {
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

test('une valeur vide dans le fichier ne masque pas l\'instance', () => {
  const file = parseEnv('INSTANCE=sdid\nARGOCD_URL=\n')
  assert.equal(currentInstance({ env: {}, file }).urls.ARGOCD_URL, 'https://argocd.sdid.cpin.numerique-interieur.com')
})

test('--url : ajoute ou remplace une URL relevée, refuse le reste', () => {
  const { content } = withUrls('INSTANCE=rie\nARGOCD_URL=https://old\n', ['ARGOCD_URL=https://argocd.rie/', 'HARBOR_URL=https://harbor.rie'])
  assert.equal(content, 'INSTANCE=rie\nARGOCD_URL=https://argocd.rie\nHARBOR_URL=https://harbor.rie\n')
  for (const bad of ['DSO_TOKEN=https://x', 'ARGOCD_URL=http://x', 'ARGOCD_URL'])
    assert.ok(withUrls('', [bad]).error, bad)
})
