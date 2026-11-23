export type User = {
  username: string
  name: string
  avatarUrl?: string
}

export type MRRef = {
  projectId: string
  iid: number
}

export type PipelineStatus =
  | 'success'
  | 'failed'
  | 'running'
  | 'pending'
  | 'canceled'
  | 'skipped'
  | 'manual'
  | 'none'

export type Pipeline = {
  status: PipelineStatus
  url?: string
}

export type MR = {
  ref: MRRef
  key: string
  title: string
  url: string
  project: string
  sourceBranch: string
  targetBranch: string
  author: User
  reviewers: string[]
  draft: boolean
  hasConflicts: boolean
  createdAt: string
  updatedAt: string
}

export type Note = {
  author: string
  createdAt: string
}

export type Thread = {
  id: string
  resolvable: boolean
  resolved: boolean
  notes: Note[]
}

export type ReviewRequest = {
  reviewer: string
  at: string
}

export type Activity = {
  threads: Thread[]
  approvedBy: string[]
  approvalsRequired: number
  reviewRequests: ReviewRequest[]
  pushes: string[]
  pipeline: Pipeline
}

export type Approvals = {
  given: number
  required: number
}

export const reviewCategories = [
  'rereview',
  'review',
  'waiting_author',
  'approved_with_threads',
  'approved',
] as const

export type ReviewCategory = (typeof reviewCategories)[number]

export type ReviewReason = 'replied' | 'pushed' | 'rerequested'

export type ReviewVerdict = {
  category: ReviewCategory
  waitingSince: string | null
  myLastActivityAt: string | null
  reasons: ReviewReason[]
  myOpenThreads: number
}

export type ReviewRow = ReviewVerdict & {
  mr: MR
  approvals: Approvals
  pipeline: Pipeline
}

export type AuthoredRow = {
  mr: MR
  approvals: Approvals
  approvedBy: string[]
  openThreads: number
  pipeline: Pipeline
}

export type Dashboard = {
  me: User
  authored: AuthoredRow[]
  review: ReviewRow[]
  fetchedAt: string
  errors: string[]
}
