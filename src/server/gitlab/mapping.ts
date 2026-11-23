import type { MR, Pipeline, PipelineStatus, ReviewRequest, Thread, User } from '../../shared/domain.ts'

export type ApiUser = { username: string; name: string; avatar_url?: string | null }

export type ApiMR = {
  project_id: number
  iid: number
  title: string
  web_url: string
  source_branch: string
  target_branch: string
  author: ApiUser
  reviewers?: ApiUser[]
  draft: boolean
  has_conflicts: boolean
  created_at: string
  updated_at: string
  references: { full: string }
  head_pipeline?: { status: string; web_url: string } | null
}

export type ApiNote = {
  system: boolean
  body: string
  author: ApiUser
  created_at: string
  resolvable: boolean
  resolved?: boolean | null
}

export type ApiDiscussion = { id: string; notes: ApiNote[] }

export type ApiApprovals = {
  approvals_required: number
  approved_by: { user: ApiUser }[]
}

export type ApiVersion = { created_at: string }

export const toUser = (u: ApiUser): User => ({
  username: u.username,
  name: u.name,
  ...(u.avatar_url ? { avatarUrl: u.avatar_url } : {}),
})

export function toMR(m: ApiMR): MR {
  const full = m.references.full
  return {
    ref: { projectId: String(m.project_id), iid: m.iid },
    key: full,
    title: m.title,
    url: m.web_url,
    project: full.slice(0, full.lastIndexOf('!')),
    sourceBranch: m.source_branch,
    targetBranch: m.target_branch,
    author: toUser(m.author),
    reviewers: (m.reviewers ?? []).map((r) => r.username),
    draft: m.draft,
    hasConflicts: m.has_conflicts,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  }
}

const pipelineStatuses: Record<string, PipelineStatus> = {
  success: 'success',
  failed: 'failed',
  running: 'running',
  pending: 'pending',
  created: 'pending',
  waiting_for_resource: 'pending',
  preparing: 'pending',
  scheduled: 'pending',
  canceled: 'canceled',
  canceling: 'canceled',
  skipped: 'skipped',
  manual: 'manual',
}

export function toPipeline(p: ApiMR['head_pipeline']): Pipeline {
  if (!p) return { status: 'none' }
  return { status: pipelineStatuses[p.status] ?? 'none', url: p.web_url }
}

export function toThreads(discussions: ApiDiscussion[]): Thread[] {
  return discussions.flatMap((d) => {
    const notes = d.notes.filter((n) => !n.system)
    const first = notes[0]
    if (!first) return []
    const resolvableNotes = notes.filter((n) => n.resolvable)
    return [
      {
        id: d.id,
        resolvable: first.resolvable,
        resolved: resolvableNotes.length > 0 && resolvableNotes.every((n) => n.resolved === true),
        notes: notes.map((n) => ({ author: n.author.username, createdAt: n.created_at })),
      },
    ]
  })
}

const requestedPart = /requested review from (.*?)(?: and removed review request| and unassigned|$)/

export function parseRequestedReviewers(body: string): string[] {
  const part = requestedPart.exec(body)?.[1]
  if (!part) return []
  return [...part.matchAll(/@([\w.-]+)/g)].map((m) => m[1] as string)
}

export function toReviewRequests(discussions: ApiDiscussion[]): ReviewRequest[] {
  return discussions
    .flatMap((d) => d.notes)
    .filter((n) => n.system)
    .flatMap((n) => parseRequestedReviewers(n.body).map((reviewer) => ({ reviewer, at: n.created_at })))
}
