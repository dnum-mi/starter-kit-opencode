import { loadSecrets, checkService } from './lib.mjs'

const HARBOR_URL = process.env.HARBOR_URL ?? 'https://harbor.sdid.cpin.numerique-interieur.com'

const secrets = await loadSecrets()
await checkService('Harbor', HARBOR_URL, '/api/v2.0/projects', secrets.ARGOCD_TOKEN)
