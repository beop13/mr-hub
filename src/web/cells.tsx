import type { Approvals, MR, Pipeline, PipelineStatus } from '../shared/domain.ts'
import { ageLevel, ago, fullDate } from './format.ts'

export function MRTitle({ mr }: { mr: MR }) {
  return (
    <div className="mr-title">
      <a href={mr.url} target="_blank" rel="noreferrer">
        {mr.draft && <span className="badge draft">Draft</span>}
        {mr.title}
      </a>
      <div className="muted small">
        {mr.key}
        {mr.hasConflicts && <span className="badge danger">конфликт</span>}
      </div>
    </div>
  )
}

const pipelineIcons: Record<PipelineStatus, string> = {
  success: '✅',
  failed: '❌',
  running: '🔄',
  pending: '⏸️',
  canceled: '⛔',
  skipped: '⏭️',
  manual: '✋',
  none: '—',
}

export function PipelineCell({ pipeline }: { pipeline: Pipeline }) {
  const icon = <span title={pipeline.status}>{pipelineIcons[pipeline.status]}</span>
  return pipeline.url ? (
    <a href={pipeline.url} target="_blank" rel="noreferrer" className="plain">
      {icon}
    </a>
  ) : (
    icon
  )
}

export function ApprovalsCell({ approvals }: { approvals: Approvals }) {
  const done = approvals.required > 0 && approvals.given >= approvals.required
  return <span className={done ? 'ok' : ''}>{`${approvals.given}/${approvals.required}`}</span>
}

export function Age({ iso, highlight = false }: { iso: string | null; highlight?: boolean }) {
  return (
    <span title={fullDate(iso)} className={highlight ? `age ${ageLevel(iso)}` : 'muted'}>
      {ago(iso)}
    </span>
  )
}

export function Actions({ mr }: { mr: MR }) {
  return (
    <div className="actions">
      <a className="btn" href={mr.url} target="_blank" rel="noreferrer">
        GitLab ↗
      </a>
      <button className="btn" disabled title="Скоро: открыть ветку в IDE">
        IDE
      </button>
    </div>
  )
}
