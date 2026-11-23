import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseRequestedReviewers, toThreads, type ApiNote } from './mapping.ts'

test('parses review requests from system notes', () => {
  const cases: [string, string[]][] = [
    ['requested review from @kmk', ['kmk']],
    ['requested review from @a and @b.c', ['a', 'b.c']],
    ['requested review from @a, @b, and @c-d', ['a', 'b', 'c-d']],
    ['requested review from @a and removed review request for @b', ['a']],
    ['removed review request for @a', []],
    ['approved this merge request', []],
  ]
  for (const [body, expected] of cases) assert.deepEqual(parseRequestedReviewers(body), expected, body)
})

const note = (author: string, extra: Partial<ApiNote> = {}): ApiNote => ({
  system: false,
  body: '',
  author: { username: author, name: author },
  created_at: '2026-11-01T10:00:00Z',
  resolvable: true,
  resolved: false,
  ...extra,
})

test('threads drop system notes and empty discussions', () => {
  const threads = toThreads([
    { id: 'sys', notes: [note('a', { system: true })] },
    { id: 't', notes: [note('a'), note('b', { system: true }), note('c')] },
  ])
  assert.deepEqual(
    threads.map((t) => [t.id, t.notes.map((n) => n.author)]),
    [['t', ['a', 'c']]],
  )
})

test('thread is resolved only when all resolvable notes are resolved', () => {
  const [open, done] = toThreads([
    { id: 'open', notes: [note('a', { resolved: true }), note('b', { resolved: false })] },
    { id: 'done', notes: [note('a', { resolved: true }), note('b', { resolved: true })] },
  ])
  assert.equal(open?.resolved, false)
  assert.equal(done?.resolved, true)
})
