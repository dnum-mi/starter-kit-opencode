import { loadSecrets, checkService, instanceUrl } from './lib.mjs'

const CONSOLE_URL = instanceUrl('CONSOLE_URL')

const secrets = await loadSecrets()
await checkService('Console', CONSOLE_URL, '/api/v1/user/tokens', secrets.DSO_TOKEN, {
  header: 'x-dso-token',
  prefix: '',
})
