import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyReview } from './classify.ts'
import type { Activity, Thread } from '../../shared/domain.ts'

const ME = 'me'
const AUTHOR = 'author'
const CREATED = '2026-11-01T10:00:00Z'

const at = (day: number, hour = 10) => `2026-11-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00Z`

const thread = (notes: [string, string][], opts: Partial<Thread> = {}): Thread => ({
  id: notes.map(([a, d]) => a + d).join(),
  resolvable: true,
  resolved: false,
  notes: notes.map(([author, createdAt]) => ({ author, createdAt })),
  ...opts,
})

const activity = (overrides: Partial<Activity> = {}): Activity => ({
  threads: [],
  approvedBy: [],
  approvalsRequired: 1,
  reviewRequests: [],
  pushes: [CREATED],
  pipeline: { status: 'none' },
  ...overrides,
})

test('new MR without my activity waits for review since MR creation', () => {
  const v = classifyReview(ME, activity(), CREATED)
  assert.equal(v.category, 'review')
  assert.equal(v.waitingSince, CREATED)
})

test('review waits since the latest review request for me', () => {
  const v = classifyReview(
    ME,
    activity({
      reviewRequests: [
        { reviewer: ME, at: at(2) },
        { reviewer: 'other', at: at(5) },
        { reviewer: ME, at: at(3) },
      ],
    }),
    CREATED,
  )
  assert.equal(v.category, 'review')
  assert.equal(v.waitingSince, at(3))
})

test('threads of other reviewers do not make it mine', () => {
  const v = classifyReview(ME, activity({ threads: [thread([['other', at(2)], [AUTHOR, at(3)]])] }), CREATED)
  assert.equal(v.category, 'review')
})

test('my comment without reply waits for author', () => {
  const v = classifyReview(ME, activity({ threads: [thread([[ME, at(2)]])] }), CREATED)
  assert.equal(v.category, 'waiting_author')
  assert.equal(v.waitingSince, null)
  assert.equal(v.myLastActivityAt, at(2))
})

test('reply in my thread needs re-review since the first reply', () => {
  const v = classifyReview(
    ME,
    activity({
      threads: [
        thread([[ME, at(2)], [AUTHOR, at(4)]]),
        thread([[ME, at(2, 11)], [AUTHOR, at(3)]]),
      ],
    }),
    CREATED,
  )
  assert.equal(v.category, 'rereview')
  assert.deepEqual(v.reasons, ['replied'])
  assert.equal(v.waitingSince, at(3))
})

test('reply that I already answered does not count', () => {
  const v = classifyReview(ME, activity({ threads: [thread([[ME, at(2)], [AUTHOR, at(3)], [ME, at(4)]])] }), CREATED)
  assert.equal(v.category, 'waiting_author')
})

test('push after my last comment needs re-review', () => {
  const v = classifyReview(
    ME,
    activity({ threads: [thread([[ME, at(2)]])], pushes: [CREATED, at(5)] }),
    CREATED,
  )
  assert.equal(v.category, 'rereview')
  assert.deepEqual(v.reasons, ['pushed'])
  assert.equal(v.waitingSince, at(5))
})

test('re-requested review after my comment needs re-review', () => {
  const v = classifyReview(
    ME,
    activity({ threads: [thread([[ME, at(2)]])], reviewRequests: [{ reviewer: ME, at: at(6) }] }),
    CREATED,
  )
  assert.equal(v.category, 'rereview')
  assert.deepEqual(v.reasons, ['rerequested'])
})

test('several reasons take the earliest signal', () => {
  const v = classifyReview(
    ME,
    activity({
      threads: [thread([[ME, at(2)], [AUTHOR, at(7)]])],
      pushes: [CREATED, at(4)],
      reviewRequests: [{ reviewer: ME, at: at(8) }],
    }),
    CREATED,
  )
  assert.deepEqual(v.reasons, ['replied', 'pushed', 'rerequested'])
  assert.equal(v.waitingSince, at(4))
})

test('approved without open threads', () => {
  const v = classifyReview(
    ME,
    activity({ approvedBy: [ME], threads: [thread([[ME, at(2)], [AUTHOR, at(3)]], { resolved: true })] }),
    CREATED,
  )
  assert.equal(v.category, 'approved')
  assert.equal(v.myOpenThreads, 0)
})

test('approved with my open threads', () => {
  const v = classifyReview(ME, activity({ approvedBy: [ME], threads: [thread([[ME, at(2)]])] }), CREATED)
  assert.equal(v.category, 'approved_with_threads')
  assert.equal(v.myOpenThreads, 1)
})

test('approval by someone else does not count as mine', () => {
  const v = classifyReview(ME, activity({ approvedBy: ['other'] }), CREATED)
  assert.equal(v.category, 'review')
})

test('non-resolvable comments do not count as open threads', () => {
  const v = classifyReview(
    ME,
    activity({ approvedBy: [ME], threads: [thread([[ME, at(2)]], { resolvable: false })] }),
    CREATED,
  )
  assert.equal(v.category, 'approved')
})
