import type { Dashboard } from '../shared/domain.ts'

async function call(method: 'GET' | 'POST', path: string): Promise<Dashboard> {
  const res = await fetch(path, { method })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
  return body as Dashboard
}

export const fetchDashboard = () => call('GET', '/api/dashboard')
export const refreshDashboard = () => call('POST', '/api/refresh')
