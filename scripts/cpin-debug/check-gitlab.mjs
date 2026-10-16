import { loadSecrets, checkService, instanceUrl } from './lib.mjs'

const GITLAB_URL = instanceUrl('GITLAB_URL')

const secrets = await loadSecrets()
await checkService('GitLab', GITLAB_URL, '/api/v4/user', secrets.GITLAB_PAT)
