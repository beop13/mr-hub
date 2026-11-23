export type GitLabClient = {
  get<T>(path: string): Promise<T>
  getAll<T>(path: string): Promise<T[]>
}

export function createGitLabClient(host: string, token: string): GitLabClient {
  const base = `https://${host}/api/v4/`

  async function request(path: string): Promise<Response> {
    const res = await fetch(base + path, { headers: { 'PRIVATE-TOKEN': token } })
    if (!res.ok) throw new Error(`GitLab ${res.status} ${res.statusText}: GET ${path}`)
    return res
  }

  const withPage = (path: string, page: string) =>
    `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`

  return {
    async get<T>(path: string) {
      return (await request(path)).json() as Promise<T>
    },
    async getAll<T>(path: string) {
      const items: T[] = []
      let page: string | null = '1'
      while (page) {
        const res = await request(withPage(path, page))
        items.push(...((await res.json()) as T[]))
        page = res.headers.get('x-next-page') || null
      }
      return items
    },
  }
}
