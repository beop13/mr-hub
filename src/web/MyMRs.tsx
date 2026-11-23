import type { AuthoredRow } from '../shared/domain.ts'
import { SortableTable, type Column } from './SortableTable.tsx'
import { Actions, Age, ApprovalsCell, MRTitle, PipelineCell } from './cells.tsx'

const columns: Column<AuthoredRow>[] = [
  { id: 'title', header: 'MR', cell: (r) => <MRTitle mr={r.mr} />, sortValue: (r) => r.mr.title.toLowerCase() },
  {
    id: 'branch',
    header: 'Ветка',
    cell: (r) => (
      <code className="small">
        {r.mr.sourceBranch} → {r.mr.targetBranch}
      </code>
    ),
  },
  {
    id: 'reviewers',
    header: 'Ревьюеры',
    cell: (r) =>
      r.mr.reviewers.map((u) => (
        <span key={u} className={`chip ${r.approvedBy.includes(u) ? 'ok' : ''}`}>
          {r.approvedBy.includes(u) ? '✓ ' : ''}
          {u}
        </span>
      )),
  },
  {
    id: 'approvals',
    header: 'Апрувы',
    cell: (r) => <ApprovalsCell approvals={r.approvals} />,
    sortValue: (r) => r.approvals.given - r.approvals.required,
    className: 'num',
  },
  {
    id: 'threads',
    header: 'Треды',
    cell: (r) => (r.openThreads ? <span className="badge warn">{r.openThreads}</span> : '—'),
    sortValue: (r) => r.openThreads,
    className: 'num',
  },
  { id: 'pipeline', header: 'CI', cell: (r) => <PipelineCell pipeline={r.pipeline} />, sortValue: (r) => r.pipeline.status },
  { id: 'created', header: 'Создан', cell: (r) => <Age iso={r.mr.createdAt} />, sortValue: (r) => r.mr.createdAt },
  { id: 'updated', header: 'Обновлён', cell: (r) => <Age iso={r.mr.updatedAt} />, sortValue: (r) => r.mr.updatedAt },
  { id: 'actions', header: '', cell: (r) => <Actions mr={r.mr} /> },
]

export function MyMRs({ rows }: { rows: AuthoredRow[] }) {
  return (
    <SortableTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.mr.key}
      initialSort={{ id: 'updated', dir: -1 }}
      empty="Открытых MR нет"
    />
  )
}
