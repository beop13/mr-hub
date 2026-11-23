const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function ago(iso: string | null, now = Date.now()): string {
  if (!iso) return '—'
  const diff = now - Date.parse(iso)
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MINUTE))} мин`
  if (diff < DAY) return `${Math.round(diff / HOUR)} ч`
  return `${Math.floor(diff / DAY)} д`
}

export function ageLevel(iso: string | null, now = Date.now()): 'fresh' | 'stale' | 'old' {
  if (!iso) return 'fresh'
  const diff = now - Date.parse(iso)
  if (diff > 3 * DAY) return 'old'
  if (diff > DAY) return 'stale'
  return 'fresh'
}

export const fullDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ru-RU') : '')
