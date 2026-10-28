# Project Management App - Spec Plan

## 1) Problem statement recap
Build a Project Management App where users can create projects, assign tasks, manage statuses, set deadlines, and track progress. 

Tech requirements:
- Monorepo: pnpm workspace with a clean, scalable structure.
- Frontend: TanStack React, TypeScript, Tailwind CSS, shadcn/ui, and reusable shared components.
- Data Fetching: TanStack Query for caching, mutations, and server-state management.
- Backend: TanStack Start server functions and API routes.
- Database: PostgreSQL with Drizzle ORM, proper relations, migrations, and indexes.
- Shared Packages: Reusable UI components, types, validation schemas, and utility functions.
- Core Features: Authentication, CRUD operations, search, filtering, pagination, form validation, and error/loading states.
- Code Quality: Clear separation of concerns, type safety, security, and basic tests.

Evaluation goal: deep technical understanding and architectural thinking (architecture, DB design, request/data flow, server functions vs API routes, TanStack Query caching, key decisions). 

## 2) Goals
- Deliver a working monorepo with above stack
- Provide a public git repo with this spec plan committed/pushed
- Document architecture and key decisions clearly (for explanation)

## 3) Non-goals (initial)
- Real-time collaboration beyond basic (no websockets unless necessary) 
- File uploads/attachments (can be added later)
- Complex permissions/RBAC beyond owner/member roles
- Email notifications/integrations
- Mobile native app

## 4) Architecture overview
Monorepo layout (pnpm workspaces):
```
managementapp/
├── apps/
│   ├── web/        # TanStack Start app (frontend + backend: server functions + API routes)
│   └── docs/       # optional docs site (or remove)
├── packages/
│   ├── ui/         # shadcn/ui components + shared UI primitives
│   ├── types/      # shared TypeScript types (DB/API/DTO)
│   ├── validation/ # Zod schemas (shared)
│   ├── db/         # Drizzle schema/migrations/connection/client
│   ├── utils/      # shared helpers (cn, date utils, etc.)
│   └── config/     # tsconfig/eslint/prettier/shared configs
├── package.json
├── pnpm-workspace.yaml
└── turbo.json      # optional but recommended for builds
```

Notes: TanStack Start allows server functions (type-safe RPC) and API routes (REST). We’ll use both appropriately (server functions for internal app calls, API routes for external/REST needs).

## 5) Tech stack details
- Package manager: pnpm
- Build toolchain: Turbo (optional) / Vite (via TanStack Start)
- Frontend: React 19 + TanStack Router + TanStack Query
- Styling: Tailwind CSS v4 + shadcn/ui
- Backend: TanStack Start (Nitro under the hood) - server functions and file-based API routes
- Auth: Better Auth (recommended for TS/Drizzle/Postgres/TanStack Start) or Auth.js; Better Auth integrates well with Drizzle
- DB: PostgreSQL (local dev + prod)
- ORM: Drizzle ORM
- Validation: Zod
- Testing: Vitest + React Testing Library + msw or just unit tests for utils/validation/db logic
- Lint/format: Biome or ESLint + Prettier

## 6) Database design
We need proper relations, migrations, indexes.

Entities:
- users (Better Auth compatible or custom) - id, name, email, emailVerified, image, createdAt, updatedAt
- sessions / accounts / verification (if using Better Auth)
- projects: id(uuid), ownerId(users.id), name, description, status(enum: planning/active/on_hold/completed/archived), deadline(date/timestamp), progress(int 0-100 or computed), timestamps, indexes (ownerId, status, deadline)
- project_members: id(uuid), projectId(projects.id), userId(users.id), role(enum: owner/admin/member/viewer), joinedAt, unique(projectId,userId), indexes
- tasks: id(uuid), projectId(projects.id), assigneeId(users.id) nullable, title, description, status(enum: todo/in_progress/review/done), priority(enum: low/medium/high/urgent), deadline(timestamp), position(int for ordering), createdBy, timestamps, indexes (projectId, assigneeId, status, deadline)
- labels/tags (optional) or task_labels (many-to2-many) - optional for MVP, include basic
- comments (optional) - can skip for MVP focus on core

Relations:
- users 1:N projects (owner)
- projects 1:N tasks
- projects M:N users via project_members
- tasks M:1 users (assignee)
- tasks belong to project

Enums and constraints:
- FK with onDelete: restrict/cascade as appropriate (cascade delete tasks when project deleted, restrict delete user if owner)
- unique constraints
- indexes on foreign keys and frequently filtered fields (projectId, assigneeId, status)

Migrations: Drizzle Kit

## 7) Core features (functional requirements)
- Authentication: sign up/sign in/sign out, session management, protected routes/guards
- Projects: CRUD, list (owned/membership), search by name/description, filter by status, pagination
- Tasks: CRUD within project, assign/unassign, change status/priority, set deadline, reorder (by position), search/filter by status/assignee/priority/due date
- Progress tracking: project progress can be computed (done/total tasks) or stored; show % and counts
- Dashboard: summary (projects count, tasks assigned to me, overdue, due today)
- Search: across projects/tasks
- Filtering & pagination: server-side where possible
- Form validation: client + server using shared Zod schemas
- Error/loading states: skeletons, toasts (sonner), error boundaries
## 8) Request/data flow
- Frontend (TanStack Router) loads route; uses TanStack Query to fetch data
- For server functions: client calls `serverFn()` (type-safe) which runs on server (Nitro), validates with Zod, checks auth/permissions, uses Drizzle to query/insert/update/delete, returns data
- For API routes: REST endpoints (e.g., /api/trpc-like or conventional) similar flow; can be used for external clients
- TanStack Query: queries for reads, mutations for writes, invalidates/optimistic updates, caching with staleTime/gcTime
- Shared types/validation between client and server via packages

## 9) Server functions vs API routes (explanation)
- Server functions: type-safe RPC, easier integration with TanStack Router/Start, better for internal app logic, no need to manually serialize/define fetchers separately, automatic type inference
- API routes: RESTful, better for external consumption/public APIs, easier to test with curl/Postman, can follow conventional REST patterns
We’ll prefer server functions for most CRUD, use API routes only where REST convention makes sense or needed.

## 10) TanStack Query caching (strategy)
- Query keys: structured (e['projects'], e['projects', id], e['tasks', {projectId, filters}])
- staleTime: e.g., 30s-60s for lists, more for static
- gcTime: keep cached data in memory
- Mutations: onSuccess invalidate relevant queries (projects list, project details, tasks list)
- Optimistic updates for quick actions (status change) to improve UX
- Selective hydration/errors/retries
## 11) Security considerations
- Authentication required for protected routes/functions
- Authorization: project ownership/member role checks
- Input validation with Zod on server
- SQL injection prevention via Drizzle parameterized queries
- CSRF protection (TanStack Start/Nitro defaults)
- Secure headers, sameSite cookies if using session cookies
- Rate limiting (optional for MVP)
- Environment variables with validation
## 12) Testing strategy (basic)
- Unit: validation schemas, utils/cn/date
- Integration: server functions logic (authz/validation)
- Component: UI components (shadcn primitives) with RTL
- E2E (optional): Playwright
## 13) Implementation plan (step by step)
1. **Repo setup**: pnpm init, pnpm-workspace.yaml, turbo.json, .gitignore, README
2. **Shared packages**: config (tsconfig), types, validation, utils, ui (shadcn setup)
3. **Database package**: Drizzle schema, migrations, client, connection
4. **Auth setup**: Better Auth config with Drizzle adapter
5. **App setup**: TanStack Start app (apps/web), router setup, query client
6 **.security**: protected routes, middleware
7. **Features**: Projects CRUD, Tasks CRUD, Dashboard, search/filter/pagination
8. **Styling/UI**: layout, nav, forms, tables, cards, skeletons, toasts
9. **Testing**: basic unit tests
10. **Docs**: README with setup/run/migrations/architecture explanation (for interview)
## 14) Key technical decisions & rationale
- TanStack Start: unified full-stack with server functions + routing in one framework (reduces context switching)
- Drizzle: SQL-like, type-safe, lightweight, migrations easy
- Better Auth: modern auth for TS ecosystem
- shadcn/ui: accessible, customizable, composable
- TanStack Query: industry standard for server state
- pnpm workspaces + packages: clear separation, reusable, scalable

## 15) Deliverables
- Public git repo (GitHub) containing this spec plan + full app code
- README.md explaining architecture, DB design, request/data flow, server functions vs API routes, TanStack Query caching, key decisions
- Working app with core features
- Basic tests
- Migrations
## 16] Acceptance criteria
# PR Title
[WIP] Project Management App Spec Plan
# PR based on spec outline above

## Commit 17) Current status
Spec plan created. Next: commit and push to public repo. (Need to create GitHub repo via gh CLI or manually; gh available?)
 
## Appendix
- Environment: C:\Projects\managementapp
- Node/pnpm versions (to confirm later)
- PostgreSQL connection details (to be set via env)
- Better Auth secret
 
---
**Prepared for:** Full-Stack Developer Assessment
**Purpose:** Create spec plan and push to public git repo
**Status:** Draft - Ready to commit
