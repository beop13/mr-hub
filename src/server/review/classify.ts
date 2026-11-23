import type { Activity, ReviewReason, ReviewVerdict, Thread } from '../../shared/domain.ts'

const time = (iso: string) => Date.parse(iso)

const latest = (dates: string[]): string | null =>
  dates.reduce<string | null>((max, d) => (max === null || time(d) > time(max) ? d : max), null)

const earliest = (dates: string[]): string | null =>
  dates.reduce<string | null>((min, d) => (min === null || time(d) < time(min) ? d : min), null)

const isAfter = (date: string, pivot: string) => time(date) > time(pivot)

const writtenBy = (thread: Thread, user: string) => thread.notes.some((n) => n.author === user)

const isOpen = (thread: Thread) => thread.resolvable && !thread.resolved

function repliesAfterMyLastNote(thread: Thread, me: string): string[] {
  const myLast = latest(thread.notes.filter((n) => n.author === me).map((n) => n.createdAt))
  if (myLast === null) return []
  return thread.notes.filter((n) => n.author !== me && isAfter(n.createdAt, myLast)).map((n) => n.createdAt)
}

export function classifyReview(me: string, activity: Activity, mrCreatedAt: string): ReviewVerdict {
  const myThreads = activity.threads.filter((t) => writtenBy(t, me))
  const myOpenThreads = myThreads.filter(isOpen).length
  const myLastActivityAt = latest(myThreads.flatMap((t) => t.notes.filter((n) => n.author === me).map((n) => n.createdAt)))
  const requestsForMe = activity.reviewRequests.filter((r) => r.reviewer === me).map((r) => r.at)

  if (activity.approvedBy.includes(me)) {
    return {
      category: myOpenThreads > 0 ? 'approved_with_threads' : 'approved',
      waitingSince: null,
      myLastActivityAt,
      reasons: [],
      myOpenThreads,
    }
  }

  if (myLastActivityAt === null) {
    return {
      category: 'review',
      waitingSince: latest(requestsForMe) ?? mrCreatedAt,
      myLastActivityAt,
      reasons: [],
      myOpenThreads,
    }
  }

  const signals: Record<ReviewReason, string[]> = {
    replied: myThreads.flatMap((t) => repliesAfterMyLastNote(t, me)),
    pushed: activity.pushes.filter((p) => isAfter(p, myLastActivityAt)),
    rerequested: requestsForMe.filter((r) => isAfter(r, myLastActivityAt)),
  }
  const reasons = (Object.keys(signals) as ReviewReason[]).filter((r) => signals[r].length > 0)

  if (reasons.length === 0) {
    return { category: 'waiting_author', waitingSince: null, myLastActivityAt, reasons, myOpenThreads }
  }

  return {
    category: 'rereview',
    waitingSince: earliest(Object.values(signals).flat()),
    myLastActivityAt,
    reasons,
    myOpenThreads,
  }
}
