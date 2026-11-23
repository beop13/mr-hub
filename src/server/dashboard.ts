import type { Activity, AuthoredRow, Dashboard, MR, ReviewRow } from '../shared/domain.ts'
import type { Provider } from './provider.ts'
import { classifyReview } from './review/classify.ts'

async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i] as T)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

const approvalsOf = (a: Activity) => ({ given: a.approvedBy.length, required: a.approvalsRequired })

const openThreadsOf = (a: Activity) => a.threads.filter((t) => t.resolvable && !t.resolved).length

const FETCH_CONCURRENCY = 8

export async function buildDashboard(provider: Provider): Promise<Dashboard> {
  const me = await provider.currentUser()
  const [authoredMRs, reviewMRs] = await Promise.all([provider.authoredMRs(me), provider.reviewMRs(me)])
  const reviewOnly = reviewMRs.filter((mr) => mr.author.username !== me.username)
  const errors: string[] = []

  const withActivity = (mrs: MR[]) =>
    mapLimited(mrs, FETCH_CONCURRENCY, async (mr) => {
      try {
        return { mr, activity: await provider.activity(mr.ref) }
      } catch (e) {
        errors.push(`${mr.key}: ${e instanceof Error ? e.message : String(e)}`)
        return null
      }
    })

  const [authored, review] = await Promise.all([withActivity(authoredMRs), withActivity(reviewOnly)])

  const authoredRows: AuthoredRow[] = authored.flatMap((x) =>
    x
      ? [
          {
            mr: x.mr,
            approvals: approvalsOf(x.activity),
            approvedBy: x.activity.approvedBy,
            openThreads: openThreadsOf(x.activity),
            pipeline: x.activity.pipeline,
          },
        ]
      : [],
  )

  const reviewRows: ReviewRow[] = review.flatMap((x) =>
    x
      ? [
          {
            ...classifyReview(me.username, x.activity, x.mr.createdAt),
            mr: x.mr,
            approvals: approvalsOf(x.activity),
            pipeline: x.activity.pipeline,
          },
        ]
      : [],
  )

  return { me, authored: authoredRows, review: reviewRows, fetchedAt: new Date().toISOString(), errors }
}
