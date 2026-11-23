import { useState } from 'react'
import { reviewCategories, type ReviewCategory, type ReviewReason, type ReviewRow } from '../shared/domain.ts'
import { SortableTable, type Column } from './SortableTable.tsx'
import { Actions, Age, ApprovalsCell, MRTitle, PipelineCell } from './cells.tsx'

export const categoryLabels: Record<ReviewCategory, string> = {
  rereview: '🔁 Пересмотреть',
  review: '👀 Посмотреть',
  waiting_author: '⏳ Жду автора',
  approved_with_threads: '✅💬 Апрувнул с тредами',
  approved: '✅ Апрувнул',
}

const reasonLabels: Record<ReviewReason, string> = {
  replied: '💬 ответили',
  pushed: '⬆️ пуш',
  rerequested: '🔔 перезапросили',
}

const columns: Column<ReviewRow>[] = [
  { id: 'title', header: 'MR', cell: (r) => <MRTitle mr={r.mr} />, sortValue: (r) => r.mr.title.toLowerCase() },
  { id: 'author', header: 'Автор', cell: (r) => r.mr.author.username, sortValue: (r) => r.mr.author.username },
  {
    id: 'waiting',
    header: 'Ждёт',
    cell: (r) => <Age iso={r.waitingSince} highlight />,
    sortValue: (r) => r.waitingSince,
  },
  {
    id: 'reasons',
    header: 'Что нового',
    cell: (r) =>
      r.reasons.map((reason) => (
        <span key={reason} className="chip">
          {reasonLabels[reason]}
        </span>
      )),
  },
  {
    id: 'mine',
    header: 'Мои треды',
    cell: (r) => (r.myOpenThreads ? <span className="badge warn">{r.myOpenThreads}</span> : '—'),
    sortValue: (r) => r.myOpenThreads,
    className: 'num',
  },
  {
    id: 'my-last',
    header: 'Мой коммент',
    cell: (r) => <Age iso={r.myLastActivityAt} />,
    sortValue: (r) => r.myLastActivityAt,
  },
  {
    id: 'approvals',
    header: 'Апрувы',
    cell: (r) => <ApprovalsCell approvals={r.approvals} />,
    sortValue: (r) => r.approvals.given - r.approvals.required,
    className: 'num',
  },
  { id: 'pipeline', header: 'CI', cell: (r) => <PipelineCell pipeline={r.pipeline} />, sortValue: (r) => r.pipeline.status },
  { id: 'actions', header: '', cell: (r) => <Actions mr={r.mr} /> },
]

type Filter = ReviewCategory | 'all'

export function Review({ rows }: { rows: ReviewRow[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const count = (c: ReviewCategory) => rows.filter((r) => r.category === c).length
  const visible = reviewCategories.filter((c) => (filter === 'all' || filter === c) && count(c) > 0)

  return (
    <>
      <div className="filters">
        <button className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          Все <b>{rows.length}</b>
        </button>
        {reviewCategories.map((c) => (
          <button key={c} className={`pill ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
            {categoryLabels[c]} <b>{count(c)}</b>
          </button>
        ))}
      </div>
      {visible.length === 0 && <p className="empty">Пусто</p>}
      {visible.map((c) => (
        <section key={c}>
          <h2>
            {categoryLabels[c]} <span className="muted">{count(c)}</span>
          </h2>
          <SortableTable
            rows={rows.filter((r) => r.category === c)}
            columns={columns}
            rowKey={(r) => r.mr.key}
            initialSort={{ id: 'waiting', dir: 1 }}
          />
        </section>
      ))}
    </>
  )
}
