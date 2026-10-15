import { loadSecrets, checkService } from './lib.mjs'

const GITLAB_URL = process.env.GITLAB_URL ?? 'https://gitlab.sdid.cpin.numerique-interieur.com'

const secrets = await loadSecrets()
await checkService('GitLab', GITLAB_URL, '/api/v4/user', secrets.GITLAB_PAT)
