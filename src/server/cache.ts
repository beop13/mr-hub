export type Cache<T> = {
  get(): Promise<T>
  refresh(): Promise<T>
}

export function createRefreshingCache<T>(load: () => Promise<T>, intervalMs: number): Cache<T> {
  let value: T | null = null
  let inflight: Promise<T> | null = null

  const refresh = () => {
    inflight ??= load()
      .then((v) => (value = v))
      .finally(() => (inflight = null))
    return inflight
  }

  setInterval(() => refresh().catch((e) => console.error('background refresh failed:', e)), intervalMs).unref()

  return {
    get: () => (value === null ? refresh() : Promise.resolve(value)),
    refresh,
  }
}
