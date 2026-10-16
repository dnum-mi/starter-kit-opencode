import { loadSecrets, checkService, instanceUrl } from './lib.mjs'

const ARGOCD_URL = instanceUrl('ARGOCD_URL')

const secrets = await loadSecrets()
await checkService('ArgoCD', ARGOCD_URL, '/api/v1/applications', secrets.ARGOCD_TOKEN)
