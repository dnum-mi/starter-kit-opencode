import { loadSecrets, checkService } from './lib.mjs'

const CONSOLE_URL = process.env.CONSOLE_URL ?? 'https://console.sdid.cpin.numerique-interieur.com'

const secrets = await loadSecrets()
await checkService('Console', CONSOLE_URL, '/api/v1/me', secrets.DSO_TOKEN, {
  header: 'x-dso-token',
  prefix: '',
})
