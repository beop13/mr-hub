# mr-hub

Local dashboard for merge requests: your own MRs and the MRs where you are a reviewer.

## Run

```sh
cp .env.example .env
npm install
npm start
```

Open http://127.0.0.1:4317. For development with hot reload: `npm run dev`, then http://localhost:5173.

The GitLab token comes from `glab` (`glab auth login --hostname <host>`) or from `MR_HUB_GITLAB_TOKEN`.

## Review categories

| Category | Rule | Waiting since |
|---|---|---|
| Re-review | not approved; after my last comment there is a reply in my thread, a push, or a new review request | first such event |
| Review | not approved; I have no threads | last review request for me, else MR creation |
| Waiting for author | not approved; my threads have no news | — |
| Approved with threads | approved; some of my threads are open | — |
| Approved | approved; none of my threads are open | — |

## Providers

`src/server/provider.ts` defines the `Provider` interface. GitLab is in `src/server/gitlab/`. To add a provider, implement the interface and select it in `src/server/main.ts`.
