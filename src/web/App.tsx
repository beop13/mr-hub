import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dashboard, MR } from '../shared/domain.ts'
import { fetchDashboard, refreshDashboard } from './api.ts'
import { ago, fullDate } from './format.ts'
import { MyMRs } from './MyMRs.tsx'
import { Review } from './Review.tsx'

type Tab = 'review' | 'mine'

const TAB_KEY = 'mr-hub:tab'
const POLL_MS = 60_000

function storedTab(): Tab {
  try {
    return localStorage.getItem(TAB_KEY) === 'mine' ? 'mine' : 'review'
  } catch {
    return 'review'
  }
}

function storeTab(tab: Tab) {
  try {
    localStorage.setItem(TAB_KEY, tab)
  } catch {}
}

const matches = (mr: MR, query: string) =>
  [mr.title, mr.key, mr.author.username, mr.sourceBranch].some((s) => s.toLowerCase().includes(query))

export function App() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>(storedTab)
  const [query, setQuery] = useState('')
  const [project, setProject] = useState('')

  const load = useCallback(async (force: boolean) => {
    setLoading(true)
    try {
      setData(await (force ? refreshDashboard() : fetchDashboard()))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(false)
    const id = setInterval(() => load(false), POLL_MS)
    return () => clearInterval(id)
  }, [load])

  const selectTab = (t: Tab) => {
    setTab(t)
    storeTab(t)
  }

  const filtered = useMemo(() => {
    if (!data) return null
    const q = query.trim().toLowerCase()
    const keep = (mr: MR) => (!project || mr.project === project) && (!q || matches(mr, q))
    return {
      authored: data.authored.filter((r) => keep(r.mr)),
      review: data.review.filter((r) => keep(r.mr)),
    }
  }, [data, query, project])

  const projects = useMemo(
    () => [...new Set([...(data?.authored ?? []), ...(data?.review ?? [])].map((r) => r.mr.project))].sort(),
    [data],
  )

  return (
    <div className="page">
      <header>
        <h1>MR Hub</h1>
        <nav className="tabs">
          <button className={tab === 'review' ? 'active' : ''} onClick={() => selectTab('review')}>
            Я ревьюер <b>{filtered?.review.length ?? ''}</b>
          </button>
          <button className={tab === 'mine' ? 'active' : ''} onClick={() => selectTab('mine')}>
            Мои MR <b>{filtered?.authored.length ?? ''}</b>
          </button>
        </nav>
        <div className="spacer" />
        <input type="search" placeholder="Поиск: название, автор, ветка" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">Все проекты</option>
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <span className="muted small" title={fullDate(data?.fetchedAt ?? null)}>
          {data ? `обновлено ${ago(data.fetchedAt)} назад` : ''}
        </span>
        <button className="btn" onClick={() => load(true)} disabled={loading}>
          {loading ? '…' : '↻ Обновить'}
        </button>
      </header>

      {error && <div className="alert">Ошибка: {error}</div>}
      {data?.errors.map((e) => (
        <div key={e} className="alert">
          {e}
        </div>
      ))}
      {!data && !error && <p className="empty">Загрузка…</p>}

      {filtered && (tab === 'review' ? <Review rows={filtered.review} /> : <MyMRs rows={filtered.authored} />)}
    </div>
  )
}
