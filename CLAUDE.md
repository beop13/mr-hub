# mr-hub: agent guide

Local dashboard for merge requests. A Node server reads a provider (now GitLab). A React page shows the data.

## Commands

| Task | Command |
|---|---|
| Run (build + server) | `npm start` → http://127.0.0.1:4317 |
| Dev (hot reload) | `npm run dev` → http://localhost:5173 |
| Tests | `npm test` |
| Typecheck | `npm run typecheck` |

Run `npm test` and `npm run typecheck` before you finish a change.

## Stack rules

- Node 24 runs `.ts` files directly (type stripping). There is no build step for the server.
- Imports must have the `.ts` / `.tsx` extension.
- `erasableSyntaxOnly` is on: no `enum`, no `namespace`, no constructor parameter properties.
- Frontend: React 19 + Vite. No UI or table libraries. Sorting is in `src/web/SortableTable.tsx`.
- Do not add comments to code.

## Layout

| Path | Contents |
|---|---|
| `src/shared/domain.ts` | Provider-agnostic types. The server and the page both use them. |
| `src/server/provider.ts` | `Provider` interface. |
| `src/server/gitlab/` | GitLab provider: REST client, API→domain mapping, provider. |
| `src/server/review/classify.ts` | Review category logic. It uses only domain types. |
| `src/server/dashboard.ts` | Builds the `Dashboard` from a provider (8 parallel requests). |
| `src/server/cache.ts`, `main.ts` | Cache with refresh, HTTP API, static files. |
| `src/web/` | React page. `Review.tsx` = «Я ревьюер», `MyMRs.tsx` = «Мои MR». |

## Data flow

1. `main.ts` loads the config and makes the provider.
2. The cache calls `buildDashboard` every `MR_HUB_REFRESH_MINUTES` (default 5).
3. `GET /api/dashboard` returns the cached data. `POST /api/refresh` loads it again.
4. The page polls `GET /api/dashboard` every 60 s.

## Review categories

`classifyReview` in `src/server/review/classify.ts` sets one category per MR:

| Category | Rule |
|---|---|
| `approved_with_threads` | I approved; some of my threads are open. |
| `approved` | I approved; none of my threads are open. |
| `review` | Not approved; I have no notes. |
| `rereview` | Not approved; after my last note: a reply in my thread, a push, or a new review request for me. |
| `waiting_author` | Not approved; I have notes; nothing new. |

"My thread" = a thread with a note by me. If you change a rule, change `classify.test.ts` too.

## Config

- `.env` (gitignored): `MR_HUB_GITLAB_HOST`, `MR_HUB_PORT`, `MR_HUB_REFRESH_MINUTES`. See `.env.example`.
- Token: `MR_HUB_GITLAB_TOKEN`, else `glab config get token --host <host>`.
- Do not commit the real host, a token, or user names.

## Add a provider

1. Implement `Provider` from `src/server/provider.ts` in `src/server/<name>/`.
2. Map the API data to the types in `src/shared/domain.ts`.
3. Select the provider in `src/server/main.ts`.

## Open work

- The «IDE» button in `src/web/cells.tsx` is a disabled stub.
- When a project has no approval rules, the approvals cell shows `1/0`.
