import { loadSecrets, checkService, instanceUrl } from './lib.mjs'

const HARBOR_URL = instanceUrl('HARBOR_URL')

const secrets = await loadSecrets()
await checkService('Harbor', HARBOR_URL, '/api/v2.0/projects', secrets.ARGOCD_TOKEN)
