import { execFileSync } from 'node:child_process'

export type Config = {
  gitlabHost: string
  gitlabToken: string
  port: number
  refreshMinutes: number
}

function glabToken(host: string): string {
  try {
    return execFileSync('glab', ['config', 'get', 'token', '--host', host], { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const gitlabHost = env.MR_HUB_GITLAB_HOST
  if (!gitlabHost) throw new Error('MR_HUB_GITLAB_HOST is not set: copy .env.example to .env')

  const gitlabToken = env.MR_HUB_GITLAB_TOKEN || glabToken(gitlabHost)
  if (!gitlabToken) throw new Error(`No GitLab token: run "glab auth login --hostname ${gitlabHost}" or set MR_HUB_GITLAB_TOKEN`)

  return {
    gitlabHost,
    gitlabToken,
    port: Number(env.MR_HUB_PORT ?? 4317),
    refreshMinutes: Number(env.MR_HUB_REFRESH_MINUTES ?? 5),
  }
}
