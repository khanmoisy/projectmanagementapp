# Project Management App

A full-stack Project Management App built with a modern monorepo architecture.

## Tech Stack

- **Monorepo**: pnpm workspaces + Turbo
- **Frontend**: TanStack Router, TanStack Query, React 19, TypeScript, Tailwind CSS v3, shadcn/ui
- **Backend**: TanStack Start (server functions + API routes)
- **Auth**: Better Auth
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod
- **Shared**: Reusable packages for UI, types, validation, utils, DB

## Architecture Overview

### Monorepo Structure
```
managementapp/
├── apps/web/          # TanStack Start app (frontend + backend)
└── packages/
    ├── ui/            # shadcn/ui components
    ├── types/         # Shared TypeScript types
    ├── validation/    # Zod schemas
    ├── db/            # Drizzle schema, migrations, client
    ├── utils/         # Shared utilities
    └── config/        # Shared configs
```

### Request/Data Flow
1. **Client** makes request via TanStack Router or fetch
2. **TanStack Query** manages server state (caching, mutations, invalidation)
3. **Server** handles via either:
   - **Server Functions** (type-safe RPC): Preferred for internal app logic
   - **API Routes** (REST): For conventional REST endpoints
4. **Auth** checked via Better Auth middleware/session
5. **Validation** with Zod schemas (shared)
6. **Database** queried via Drizzle ORM with proper relations/indexes
7. **Response** returned to client, cached by TanStack Query

### Server Functions vs API Routes
- **Server Functions** (`createServerFn`): Type-safe, direct function calls from client with automatic serialization. Better for internal operations, form submissions, and when you want full type inference. Located in `src/server/fns/`.
- **API Routes** (`createAPIFileRoute`): RESTful HTTP endpoints at `/api/*`. Better for external consumers, third-party integrations, or when following REST conventions. More explicit HTTP method handling.

### TanStack Query Caching Strategy
- **Query Keys**: Hierarchical structure like `['projects']`, `['projects', id]`, `['tasks', projectId]`
- **Stale Time**: 60s default - data considered fresh for 60 seconds
- **GC Time**: 5min - cached data retained in memory
- **Invalidation**: Mutations invalidate relevant query keys on success (e.g., creating project invalidates `['projects']`)
- **Optimistic Updates**: Can be added for better UX on frequent operations
- **Selective Fetching**: Only fetch what's needed per route

### Database Design
**Entities:**
- `user`, `session`, `account`, `verification` (Better Auth)
- `project` - Projects with owner, status, deadline, indexes on owner/status/deadline
- `project_member` - M:N relationship with roles, unique constraint on (projectId, userId)
- `task` - Tasks with assignee, status, priority, position, indexes on project/assignee/status/deadline

**Relations:**
- Users own projects, have memberships, are assigned tasks
- Projects have members and tasks
- Tasks belong to projects and can be assigned to users

All foreign keys have appropriate `onDelete` actions, indexes on frequently queried fields.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 9+
- PostgreSQL

### Installation
```bash
pnpm install
```

### Environment Setup
```bash
cp apps/web/.env.example apps/web/.env
```

Update `apps/web/.env` with your database URL and auth secret.

### Database Setup
```bash
# Generate migrations
pnpm db:generate

# Push schema to database (dev)
pnpm db:push

# Or run migrations
pnpm db:migrate
```

### Development
```bash
pnpm dev
```

App runs at `http://localhost:3000`

## Features
- ✅ Authentication (sign up/in/out) with Better Auth
- ✅ Projects CRUD
- ✅ Tasks CRUD with status/priority management
- ✅ Task assignment
- ✅ Search, filtering (foundation)
- ✅ Form validation with shared Zod schemas
- ✅ Loading and error states
- ✅ TanStack Query caching
- ✅ Server functions and API routes
- ✅ Type-safe end-to-end

## Testing
```bash
pnpm test
```

## Key Technical Decisions
1. **TanStack Start** - Unified full-stack framework, reduces complexity vs separate frontend/backend
2. **Drizzle ORM** - Type-safe SQL, great DX, explicit schema
3. **Better Auth** - Modern auth solution with Drizzle adapter
4. **pnpm Workspaces** - Efficient monorepo, shared dependencies
5. **shadcn/ui** - Accessible, customizable components
6. **Server Functions First** - Prefer type-safe RPC, use API routes when REST makes sense

## License
MIT
