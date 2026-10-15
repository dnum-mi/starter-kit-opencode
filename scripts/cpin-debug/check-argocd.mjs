import { loadSecrets, checkService } from './lib.mjs'

const ARGOCD_URL = process.env.ARGOCD_URL ?? 'https://argocd.sdid.cpin.numerique-interieur.com'

const secrets = await loadSecrets()
await checkService('ArgoCD', ARGOCD_URL, '/api/v1/applications', secrets.ARGOCD_TOKEN)
