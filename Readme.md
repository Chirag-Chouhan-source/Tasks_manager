# TaskFlow — Application Documentation

**Document type:** System & product documentation  
**Application:** TaskFlow (Task Management and Collaboration System)  
**Architecture:** Client–server (Next.js frontend · FastAPI backend · PostgreSQL · Redis)

This document describes the purpose, architecture, domain model, modules, security model, APIs, frontend surfaces, caching behaviour, and operational setup of the TaskFlow application.

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [System Overview](#2-system-overview)
3. [Technology Stack](#3-technology-stack)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Domain Model](#5-domain-model)
6. [Application Modules](#6-application-modules)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Frontend Application](#8-frontend-application)
9. [Backend Application](#9-backend-application)
10. [API Reference](#10-api-reference)
11. [Caching](#11-caching)
12. [Validation & Business Rules](#12-validation--business-rules)
13. [Error Handling](#13-error-handling)
14. [Repository Structure](#14-repository-structure)
15. [Configuration & Deployment](#15-configuration--deployment)
16. [Operational Notes](#16-operational-notes)

---

## 1. Purpose

TaskFlow is a full-stack collaboration platform for organizing engineering and delivery work. It enables teams to:

- Represent work as **tasks** and **subtasks**
- Track progress through a defined **status workflow**
- Group work by **sprint**
- Assign ownership to one or more **users**
- Collaborate through **comments**
- Visualize work on a **Kanban board** or browse a **task list**
- Administer accounts and roles through **RBAC**

The system is designed as a layered, API-driven application with clear separation between presentation, business logic, persistence, and caching.

---

## 2. System Overview

| Concern                      | Implementation                                      |
| ---------------------------- | --------------------------------------------------- |
| Presentation                 | Next.js App Router (React, TypeScript, Material UI) |
| Client state & data fetching | Redux Toolkit + RTK Query                           |
| API                          | FastAPI REST under `/api/v1`                        |
| Business logic               | Backend service layer                               |
| Persistence                  | PostgreSQL via SQLAlchemy                           |
| Schema evolution             | Alembic migrations                                  |
| Caching                      | Redis (read-through + invalidate-on-write)          |
| Identity                     | JWT access and refresh tokens                       |
| Access control               | Role-based permissions (RBAC)                       |

Clients authenticate once, receive tokens, and call protected APIs. The frontend stores tokens locally and attaches the access token to requests. On access-token expiry, the client attempts refresh; on persistent authentication failure for protected resources, the user is returned to the login flow.

---

## 3. Technology Stack

### 3.1 Frontend

| Technology                | Role                                                |
| ------------------------- | --------------------------------------------------- |
| Next.js 15                | App Router, routing, client rendering for dashboard |
| React 19                  | UI components                                       |
| TypeScript                | Static typing                                       |
| Material UI (MUI)         | Design system and interactive controls              |
| Redux Toolkit / RTK Query | Server-state cache, mutations, invalidation         |
| React Hook Form + Zod     | Form state and client-side validation               |
| async-mutex               | Serialize token refresh                             |

### 3.2 Backend

| Technology | Role                                         |
| ---------- | -------------------------------------------- |
| FastAPI    | HTTP API, dependency injection, OpenAPI docs |
| Uvicorn    | ASGI server                                  |
| SQLAlchemy | ORM and relationships                        |
| Alembic    | Database migrations                          |
| Pydantic   | Request/response schemas                     |
| Redis      | Response caching                             |
| JWT        | Stateless authentication                     |

### 3.3 Infrastructure dependencies

- **PostgreSQL** — system of record
- **Redis** — cache for high-read endpoints

---

## 4. High-Level Architecture

```
┌──────────────────────────────────────┐
│              Frontend                │
│  Next.js · MUI · RTK Query · RHF/Zod │
└──────────────────┬───────────────────┘
                   │  HTTPS / REST + JWT
┌──────────────────▼───────────────────┐
│               Backend                │
│  FastAPI routers → services → ORM    │
│  RBAC · validation · cache control   │
└──────┬─────────────┬───────────┬─────┘
       │             │           │
       ▼             ▼           ▼
  PostgreSQL       Redis      JWT secrets
```

### Request path (typical authenticated call)

1. Browser sends request with `Authorization: Bearer <access_token>`
2. FastAPI dependency resolves the current user
3. Permission dependency enforces the required permission (where applicable)
4. Service executes business logic against PostgreSQL
5. For selected reads, Redis is checked first; misses are loaded from DB and written back
6. On writes, related cache keys are invalidated
7. Response is returned as JSON; RTK Query updates the client cache

---

## 5. Domain Model

### 5.1 Entities

#### User

- Identity: `id`, `username`, `email`, `password_hash`, optional `team_name`
- May hold one or more **roles**
- May be assigned to many **tasks** and **subtasks**
- Owns **comments** they author

#### Role

- Named role (Admin, Manager, Developer, QA)
- Associated with many **permissions**

#### Permission

- Named capability (for example `task.update`, `comment.create`, `user.view`)
- Granted to roles; users inherit permissions through their roles

#### Task

- Primary work item: `title` (unique), `description`, `status`, optional `sprint`
- Timestamps: `created_at`, `updated_at`
- Many-to-many **users** (assignees)
- One-to-many **subtasks** and **comments**

#### Subtask

- Child of a single **task**
- Own title, description, status, assignees, comments
- Used to decompose a parent task

#### Comment

- Belongs to either a **task** or a **subtask**
- Linked to the authoring **user**
- Stores content and timestamps

### 5.2 Relationships

```
User ──< user_role >── Role ──< role_permission >── Permission

User ──< user_task >── Task
User ──< user_subtask >── SubTask

Task 1──* SubTask
Task 1──* Comment
SubTask 1──* Comment
User 1──* Comment
```

### 5.3 Status workflow

Shared status enumeration used by tasks and subtasks:

| Status        | Meaning                           |
| ------------- | --------------------------------- |
| `backlog`     | Not yet scheduled for active work |
| `todo`        | Ready to start                    |
| `in_progress` | Actively being worked             |
| `in_review`   | Awaiting review                   |
| `qa`          | In quality verification           |
| `completed`   | Finished                          |

The Kanban board groups tasks by these statuses.

---

## 6. Application Modules

### 6.1 Authentication module

Capabilities:

- User registration
- Login (issues access and refresh tokens)
- Token refresh
- Logout
- Current-user profile (`/auth/me`), including roles and effective permissions
- Account profile update and password change (authenticated user)

Behavioural notes:

- Newly registered users receive the **Developer** role by default when that role exists in the database
- Login and registration failures return structured error payloads consumed by the UI

### 6.2 Task management module

Capabilities:

- Create, read, update, delete tasks
- Assign multiple users
- Update status and description inline in the UI
- Organize by sprint
- Search by title
- Filter by sprint and assignee
- Sort and paginate list results
- Kanban board with per-column pagination

### 6.3 Subtask management module

Capabilities:

- Create and list subtasks under a parent task
- View and update a single subtask
- Assign users and manage status
- Delete single or multiple subtasks (permission-gated)
- Selection mode in the UI for bulk deletion

### 6.4 Comment module

Capabilities:

- Create comments on tasks and subtasks
- List comments for a parent entity
- Attribute comments to the authoring user

Creating a comment requires `comment.create`. Viewing is governed by comment view permissions where enforced by the API.

### 6.5 User administration module

Capabilities:

- List users (requires `user.view`)
- Update user profile/role fields (requires `user.update`)
- Delete users (requires `user.delete`)
- Password reset flows where permitted (`user.reset_password`)

UI behaviour:

- The Users page excludes the currently authenticated user from the list
- Navigation to Users (desktop sidebar and mobile drawer) is shown only when `user.view` is present

### 6.6 Dashboard module

Provides aggregated summary data for the authenticated user’s home dashboard view.

---

## 7. Authentication & Authorization

### 7.1 Authentication

| Token         | Purpose                   | Typical lifetime                                         |
| ------------- | ------------------------- | -------------------------------------------------------- |
| Access token  | Authorize API requests    | Configurable (`ACCESS_TOKEN_EXPIRE_MINUTES`, default 60) |
| Refresh token | Obtain a new access token | Configurable (`REFRESH_TOKEN_EXPIRE_DAYS`, default 30)   |

Frontend storage: `localStorage` keys `access_token` and `refresh_token`.

Client reauth behaviour:

- On **401** for protected resources, the client attempts refresh
- If refresh is unavailable or fails, tokens are cleared and the user is redirected to login
- **Auth endpoints** (`/auth/login`, `/auth/register`, `/auth/refresh`) are excluded from this global 401 redirect so credential failures do not force a full page reload

Dashboard shell behaviour:

- Waits for `/auth/me` after mount
- If the current-user request fails, the user is redirected to login (avoids an indefinite loading state)

### 7.2 Authorization (RBAC)

Permissions are string identifiers. Backend routes declare required permissions via `require_permission(...)`. The frontend mirrors capability checks with `hasPermission(currentUser.permissions, "<permission>")` to show or hide controls.

#### Permission catalog

| Permission            | Description          |
| --------------------- | -------------------- |
| `task.create`         | Create tasks         |
| `task.view`           | View tasks           |
| `task.update`         | Update tasks         |
| `task.delete`         | Delete tasks         |
| `subtask.create`      | Create subtasks      |
| `subtask.view`        | View subtasks        |
| `subtask.update`      | Update subtasks      |
| `subtask.delete`      | Delete subtasks      |
| `comment.create`      | Create comments      |
| `comment.view`        | View comments        |
| `comment.update`      | Update comments      |
| `comment.delete`      | Delete comments      |
| `user.view`           | View users           |
| `user.update`         | Update users         |
| `user.delete`         | Delete users         |
| `role.manage`         | Manage roles         |
| `permission.manage`   | Manage permissions   |
| `user.reset_password` | Reset user passwords |

#### Role → permission matrix (seeded)

| Permission            | Admin | Manager | Developer | QA  |
| --------------------- | :---: | :-----: | :-------: | :-: |
| `task.create`         |   ✓   |    ✓    |           |     |
| `task.view`           |   ✓   |    ✓    |     ✓     |  ✓  |
| `task.update`         |   ✓   |    ✓    |           |     |
| `task.delete`         |   ✓   |    ✓    |           |     |
| `subtask.create`      |   ✓   |    ✓    |           |     |
| `subtask.view`        |   ✓   |    ✓    |     ✓     |  ✓  |
| `subtask.update`      |   ✓   |    ✓    |           |     |
| `subtask.delete`      |   ✓   |    ✓    |           |     |
| `comment.create`      |   ✓   |    ✓    |     ✓     |  ✓  |
| `comment.view`        |   ✓   |    ✓    |     ✓     |  ✓  |
| `comment.update`      |   ✓   |    ✓    |     ✓     |     |
| `comment.delete`      |   ✓   |    ✓    |           |     |
| `user.view`           |   ✓   |    ✓    |           |     |
| `user.update`         |   ✓   |         |           |     |
| `user.delete`         |   ✓   |         |           |     |
| `role.manage`         |   ✓   |         |           |     |
| `permission.manage`   |   ✓   |         |           |     |
| `user.reset_password` |   ✓   |         |           |     |

**Default registration role:** Developer.

Users with view-oriented roles can open task/subtask detail in read mode (limited editing), while still collaborating via comments when `comment.create` is granted.

---

## 8. Frontend Application

### 8.1 Route map

| Route                      | Description                   |
| -------------------------- | ----------------------------- |
| `/`                        | Landing / entry               |
| `/login`                   | Authentication                |
| `/register`                | Account creation              |
| `/dashboard`               | Home dashboard                |
| `/dashboard/tasks`         | Task list and Kanban          |
| `/dashboard/tasks/[id]`    | Task detail                   |
| `/dashboard/subtasks/[id]` | Subtask detail                |
| `/dashboard/users`         | User administration           |
| `/dashboard/users/account` | Current user account settings |

### 8.2 Major UI capabilities

**Tasks workspace**

- Toggle between list and Kanban presentations
- Search, sort, and filter (status where applicable, sprint, assignee)
- When a sprint is selected, the assignee filter options are derived from users assigned to tasks in that sprint (not the full user directory)
- Create task dialog with validated fields

**Task / subtask detail**

- Inline title and description editing (permission-gated)
- Status control
- Assignee field with click-away dismissal; delete chips hidden in view-only mode
- Subtask list with select mode for bulk actions
- Comment thread and composer

**Users**

- Role chips and management actions based on permissions
- Self excluded from the management list

**Navigation**

- Desktop sidebar and mobile drawer
- Users entry gated by `user.view`
- Navigation loading overlay while dashboard child routes resolve

### 8.3 Client data layer

RTK Query (`frontend/src/services/api.ts`) centralizes:

- Base URL configuration
- Auth header injection
- Refresh-token mutex
- Endpoint definitions and cache tags (`Tasks`, `Task`, `Users`, `Subtasks`, `CurrentUser`)

Forms use React Hook Form with Zod schemas for register, login, create task/subtask, and account flows.

---

## 9. Backend Application

### 9.1 Layering

| Layer      | Responsibility                                                      |
| ---------- | ------------------------------------------------------------------- |
| `api/v1`   | HTTP routes, query params, dependency wiring                        |
| `services` | Business rules, persistence orchestration, response shaping         |
| `models`   | SQLAlchemy entities and associations                                |
| `schemas`  | Pydantic contracts                                                  |
| `core`     | Config, JWT, RBAC helpers, error handlers                           |
| `seeds`    | Permissions, roles, role–permission links, optional user–role seeds |

### 9.2 Router composition

All versioned APIs are mounted at `/api/v1`.

Protected resource routers (tasks, subtasks, comments, users) require an authenticated user at the router level. Individual operations may additionally require specific permissions.

Interactive API documentation is available at `/docs` when the server is running.

---

## 10. API Reference

**Base URL:** `http://127.0.0.1:8000/api/v1`  
**Health check:** `GET /` on the server root returns API status.

### 10.1 Auth

| Method | Path             | Auth                  | Description                         |
| ------ | ---------------- | --------------------- | ----------------------------------- |
| POST   | `/auth/register` | Public                | Create user; default Developer role |
| POST   | `/auth/login`    | Public                | Issue access + refresh tokens       |
| POST   | `/auth/refresh`  | Public (refresh body) | Rotate access token                 |
| POST   | `/auth/logout`   | —                     | Client-side logout support          |
| GET    | `/auth/me`       | Required              | Current user, roles, permissions    |

### 10.2 Tasks

Mounted under `/task1` (authenticated).

| Method | Path             | Description                                                                                        |
| ------ | ---------------- | -------------------------------------------------------------------------------------------------- |
| POST   | `/task1/`        | Create task                                                                                        |
| GET    | `/task1/`        | List tasks (`search`, `status`, `sprint`, `user_id`, `page`, `page_size`, `sort_by`, `sort_order`) |
| GET    | `/task1/kanban`  | Kanban columns with per-status paging                                                              |
| GET    | `/task1/sprints` | Distinct sprint values                                                                             |
| GET    | `/task1/{id}`    | Task detail (nested preview data)                                                                  |
| PATCH  | `/task1/{id}`    | Partial update                                                                                     |
| DELETE | `/task1/{id}`    | Delete task (subject to business rules)                                                            |

List responses use a paginated envelope, including `results`, `count`, `page`, and `page_size`.

### 10.3 Subtasks

| Method | Path                        | Description                                           |
| ------ | --------------------------- | ----------------------------------------------------- |
| POST   | `/tasks/{task_id}/subtasks` | Create under parent task                              |
| GET    | `/tasks/{task_id}/subtasks` | List for parent (filterable/paginated as implemented) |
| GET    | `/subtasks/{id}`            | Subtask detail                                        |
| PATCH  | `/subtasks/{id}`            | Partial update                                        |
| DELETE | `/subtasks/{id}`            | Delete subtask                                        |

### 10.4 Comments

| Method | Path                              | Description                               |
| ------ | --------------------------------- | ----------------------------------------- |
| POST   | `/tasks/{task_id}/comments`       | Create task comment (`comment.create`)    |
| POST   | `/subtasks/{subtask_id}/comments` | Create subtask comment (`comment.create`) |
| GET    | `/tasks/{task_id}/comments`       | List task comments                        |
| GET    | `/subtasks/{subtask_id}/comments` | List subtask comments                     |

### 10.5 Users

| Method | Path                   | Description              |
| ------ | ---------------------- | ------------------------ |
| GET    | `/users`               | List users (`user.view`) |
| GET    | `/users/{id}/tasks`    | Tasks for a user         |
| GET    | `/users/{id}/subtasks` | Subtasks for a user      |
| PATCH  | `/users/{id}`          | Update user              |
| DELETE | `/users/{id}`          | Delete user              |

### 10.6 Error payload shape

HTTP exceptions are normalized to JSON of the form:

```json
{
  "success": false,
  "message": "<human-readable message>"
}
```

Clients should prefer `message` when presenting errors to users.

---

## 11. Caching

Redis is used as a **read-through cache** with **invalidate-on-write** semantics.

### 11.1 Key patterns

| Pattern                                   | Content                              |
| ----------------------------------------- | ------------------------------------ |
| `task:{id}`                               | Single task detail                   |
| `subtask:{id}`                            | Single subtask detail                |
| `tasks:...`                               | Filtered/sorted/paginated task lists |
| `tasks:kanban:...`                        | Kanban board snapshots               |
| `tasks:sprints`                           | Distinct sprint list                 |
| `subtasks:...` / `subtasks:{task_id}:...` | Subtask list caches                  |

Exact key suffixes encode filter and pagination dimensions so different views do not collide.

### 11.2 Invalidation

Cache entries related to lists and details are cleared or rewritten when:

- Tasks are created, updated, or deleted
- Subtasks are created, updated, or deleted
- Comments are created (parent task/subtask and related list caches)

Serialization uses JSON-safe dumps (for example Pydantic `mode="json"` or `default=str`) so datetime fields do not silently fail cache writes.

### 11.3 Availability

Cache operations are generally wrapped so Redis outages degrade to database reads rather than hard failures. Running Redis is required for the intended performance profile.

---

## 12. Validation & Business Rules

### 12.1 Frontend validation

- React Hook Form + Zod on authentication, registration, and create dialogs
- Field-level constraints: required values, email format, password strength, max lengths, whitespace handling where defined

### 12.2 Backend validation

- Pydantic request schemas
- Service-layer checks (entity existence, invalid assignee IDs, uniqueness)
- Database constraints (primary keys, foreign keys, unique titles where applicable)

### 12.3 Notable business rules

- Task titles are unique
- A task with existing subtasks cannot be deleted until subtasks are removed
- Comments are cascadingly removed with their parent entity where cascade is configured
- Assignee updates replace the association set for the entity
- Registration without an available Developer role still creates the user account, but without a default role until an administrator assigns one

---

## 13. Error Handling

### Backend

- Global exception handler for unexpected errors
- Dedicated HTTPException handler returning `{ success, message }`
- Service-layer `HTTPException` for domain failures (401, 403, 404, 409, 400)

### Frontend

- Mutation `catch` blocks surface `data.message` (with fallbacks) in snackbars or inline field errors
- Form validation errors are shown adjacent to fields
- Auth and dashboard gates prevent rendering protected shells without a resolved user

---

## 14. Repository Structure

```
Training/
├── frontend/
│   └── src/
│       ├── app/                 # Routes and layouts
│       ├── components/          # Feature and shared UI
│       ├── services/api.ts      # RTK Query API
│       ├── store/               # Redux store
│       ├── constants/           # Status/role presentation config
│       ├── types/               # Shared TypeScript types
│       └── utils/               # Auth helpers, permissions
├── backend/
│   └── app/
│       ├── api/v1/              # HTTP routers
│       ├── services/            # Domain services
│       ├── models/              # ORM models
│       ├── schemas/             # Pydantic schemas
│       ├── seeds/               # RBAC seed scripts
│       ├── core/                # Config, JWT, RBAC, errors
│       ├── db/                  # Engine and session
│       └── main.py              # Application entry
│   ├── alembic/                 # Migrations
│   └── alembic.ini
└── Readme.md                    # This documentation
```

---

## 15. Configuration & Deployment

### 15.1 Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL
- Redis

### 15.2 Backend configuration

Environment file: `backend/.env`

| Variable                      | Purpose                         |
| ----------------------------- | ------------------------------- |
| `DATABASE_URL`                | SQLAlchemy PostgreSQL URL       |
| `SECRET_KEY`                  | JWT signing secret              |
| `ALGORITHM`                   | JWT algorithm (default `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime           |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | Refresh token lifetime          |

Example:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/task_management
SECRET_KEY=replace-with-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30
```

Install and run:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.seeds.run_seeds
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 15.3 Frontend configuration

The API client base URL is defined in `frontend/src/services/api.ts` and defaults to:

```text
http://127.0.0.1:8000/api/v1/
```

Install and run:

```bash
cd frontend
npm install
npm run dev
```

Default local UI origin: `http://localhost:3000`.

### 15.4 Seeding

`python -m app.seeds.run_seeds` loads:

1. Permissions
2. Roles
3. Role–permission associations
4. Optional user–role seed data (as implemented in `seed_user_role.py`)

Seeds are idempotent for existing permission/role rows.

---

## 16. Operational Notes

- Keep the backend reachable at the frontend’s configured base URL during local operation
- Ensure Redis is running for cache hits; the application should continue against PostgreSQL if Redis is unavailable for many read paths
- Prefer assigning elevated roles only to trusted operators; Developer/QA are collaboration-oriented defaults
- OpenAPI/Swagger at `/docs` is the live contract companion to this document
- Cache keys are intentionally specific to filter combinations; mutating data correctly depends on the invalidation logic in the task, subtask, and comment services/routers

---

## Document control

This file is the primary documentation for the TaskFlow application: product scope, architecture, domain, security, APIs, UI surfaces, caching, and runtime configuration. Update it when modules, permissions, routes, or operational requirements change.
