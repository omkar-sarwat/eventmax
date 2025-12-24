<!--
File: architecture.md
Responsibility: High-level architecture overview.
Future: Keep diagram updated as components evolve.
-->

## ASCII architecture diagram

`
[ Browser ]
     |
     v
[ Vite Dev Server ] -- serves --> [ React SPA ]
     |                                 |
     v                                 v
           HTTP (REST/JSON)
                  |
                  v
           [ Node.js API ]
             /        \
     [ PostgreSQL ]  [ Redis ]

[ Docker ]: local dev services (postgres, redis)
[ K8s ]: manifests scaffold (future deploy)
`

Components
- Backend API: Node.js server (Express in Phase 1)
- Frontend: React + Vite SPA
- Data: PostgreSQL (primary), Redis (cache/queues)
- Ops: Docker compose for dev; Kubernetes manifests scaffold
