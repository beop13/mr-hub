import type { Activity, MRRef, User } from '../../shared/domain.ts'
import type { Provider } from '../provider.ts'
import type { GitLabClient } from './client.ts'
import {
  toMR,
  toPipeline,
  toReviewRequests,
  toThreads,
  toUser,
  type ApiApprovals,
  type ApiDiscussion,
  type ApiMR,
  type ApiUser,
  type ApiVersion,
} from './mapping.ts'

const openMRs = 'merge_requests?scope=all&state=opened'

export function createGitLabProvider(client: GitLabClient): Provider {
  return {
    name: 'gitlab',

    async currentUser() {
      return toUser(await client.get<ApiUser>('user'))
    },

    async authoredMRs(me: User) {
      const mrs = await client.getAll<ApiMR>(`${openMRs}&author_username=${encodeURIComponent(me.username)}`)
      return mrs.map(toMR)
    },

    async reviewMRs(me: User) {
      const mrs = await client.getAll<ApiMR>(`${openMRs}&reviewer_username=${encodeURIComponent(me.username)}`)
      return mrs.map(toMR)
    },

    async activity(ref: MRRef): Promise<Activity> {
      const mrPath = `projects/${ref.projectId}/merge_requests/${ref.iid}`
      const [mr, discussions, approvals, versions] = await Promise.all([
        client.get<ApiMR>(mrPath),
        client.getAll<ApiDiscussion>(`${mrPath}/discussions`),
        client.get<ApiApprovals>(`${mrPath}/approvals`),
        client.getAll<ApiVersion>(`${mrPath}/versions`),
      ])
      return {
        threads: toThreads(discussions),
        approvedBy: approvals.approved_by.map((a) => a.user.username),
        approvalsRequired: approvals.approvals_required,
        reviewRequests: toReviewRequests(discussions),
        pushes: versions.map((v) => v.created_at),
        pipeline: toPipeline(mr.head_pipeline),
      }
    },
  }
}
