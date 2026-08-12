# DevTrack — Application Documentation

**Document type:** System & product documentation  
**Application:** DevTrack (Task Management and Collaboration System)  
**Architecture:** Client–server (Next.js frontend · FastAPI backend · PostgreSQL · Redis)

This document describes the purpose, architecture, domain model, schema design (ERD and table catalog), modules, security model, APIs, frontend surfaces, caching behaviour, and operational setup of the DevTrack application.

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [System Overview](#2-system-overview)
3. [Technology Stack](#3-technology-stack)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Domain Model & Schema Design](#5-domain-model--schema-design) (ERD, table catalog, DB schema diagrams, keys/FKs, Alembic)
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

DevTrack is a full-stack collaboration platform for organizing engineering and delivery work. It enables teams to:

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

### 4.1 Deployment context

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

### 4.2 Component diagram

```mermaid
flowchart TB
  subgraph Client["Frontend Next.js"]
    UI[Pages / MUI Components]
    RHF[React Hook Form + Zod]
    RTK[RTK Query API Layer]
    UI --> RHF
    UI --> RTK
  end

  subgraph API["Backend FastAPI"]
    Routers[API Routers /v1]
    Deps[Auth + Permission Dependencies]
    Services[Service Layer]
    Routers --> Deps --> Services
  end

  subgraph Data["Data Plane"]
    PG[(PostgreSQL)]
    RD[(Redis Cache)]
  end

  RTK -->|REST + Bearer JWT| Routers
  Services --> PG
  Services --> RD
```

### 4.3 Authenticated request flow

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant API as FastAPI
  participant Auth as JWT / RBAC
  participant Svc as Service
  participant Redis as Redis
  participant DB as PostgreSQL

  UI->>API: Request + Access Token
  API->>Auth: Validate token + resolve user
  Auth->>Auth: Check required permission
  API->>Svc: Execute use case
  alt Cacheable read
    Svc->>Redis: GET cache key
    alt Cache hit
      Redis-->>Svc: Cached JSON
    else Cache miss
      Svc->>DB: Query
      DB-->>Svc: Rows
      Svc->>Redis: SETEX cache key
    end
  else Write / mutation
    Svc->>DB: Persist change
    Svc->>Redis: Invalidate related keys
  end
  Svc-->>API: Response DTO
  API-->>UI: JSON
```

### 4.4 Login and token refresh

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant API as Auth API
  participant DB as PostgreSQL

  UI->>API: POST /auth/login
  API->>DB: Verify credentials
  API-->>UI: access_token + refresh_token
  Note over UI: Store tokens in localStorage

  UI->>API: Protected request expired access
  API-->>UI: 401
  UI->>API: POST /auth/refresh
  API-->>UI: new access_token
  UI->>API: Retry original request
```

---

## 5. Domain Model & Schema Design

This section documents the logical domain, the relational schema (ERD), physical tables, and status lifecycle.

### 5.1 Conceptual entities

| Entity         | Responsibility                                       |
| -------------- | ---------------------------------------------------- |
| **User**       | Account identity; assignees and comment authors      |
| **Role**       | Named access profile (Admin, Manager, Developer, QA) |
| **Permission** | Fine-grained capability string                       |
| **Task**       | Primary work item; sprint + status + assignees       |
| **SubTask**    | Child work item under a task                         |
| **Comment**    | Collaboration note on a task or subtask              |

### 5.2 Entity-relationship diagram (ERD)

```mermaid
erDiagram
  users ||--o{ comments : authors
  users }o--o{ roles : user_roles
  roles }o--o{ permissions : role_permissions
  users }o--o{ tasks : user_task_association
  users }o--o{ subtasks : user_subtask_association
  tasks ||--o{ subtasks : contains
  tasks ||--o{ comments : has
  subtasks ||--o{ comments : has

  users {
    int id PK
    string username UK
    string email UK
    string password_hash
    string team_name
  }

  roles {
    int id PK
    string name UK
    string description
  }

  permissions {
    int id PK
    string name UK
    string description
  }

  tasks {
    int id PK
    string title UK
    text description
    enum status
    string sprint
    datetime created_at
    datetime updated_at
  }

  subtasks {
    int id PK
    string title
    enum status
    int task_id FK
    datetime created_at
    datetime updated_at
  }

  comments {
    int id PK
    string content
    int task_id FK
    int subtask_id FK
    int user_id FK
    datetime created_at
    datetime updated_at
  }

  user_roles {
    int user_id PK_FK
    int role_id PK_FK
  }

  role_permissions {
    int role_id PK_FK
    int permission_id PK_FK
  }

  user_task_association {
    int user_id PK_FK
    int task_id PK_FK
  }

  user_subtask_association {
    int user_id PK_FK
    int subtask_id PK_FK
  }
```

### 5.3 Relationship cardinality

| From    | To         | Type | Association / FK           | Notes                               |
| ------- | ---------- | ---- | -------------------------- | ----------------------------------- |
| User    | Role       | M:N  | `user_roles`               | Users inherit permissions via roles |
| Role    | Permission | M:N  | `role_permissions`         | Seeded role-permission matrix       |
| User    | Task       | M:N  | `user_task_association`    | Task assignees                      |
| User    | SubTask    | M:N  | `user_subtask_association` | Subtask assignees                   |
| Task    | SubTask    | 1:N  | `subtasks.task_id`         | Parent required                     |
| Task    | Comment    | 1:N  | `comments.task_id`         | Optional XOR with subtask           |
| SubTask | Comment    | 1:N  | `comments.subtask_id`      | Optional XOR with task              |
| User    | Comment    | 1:N  | `comments.user_id`         | Author                              |

A comment is attached to **either** a task **or** a subtask (both FKs are nullable; application logic sets one parent).

### 5.4 Physical table catalog

#### `users`

| Column          | Type        | Constraints               |
| --------------- | ----------- | ------------------------- |
| `id`            | Integer     | PK, indexed               |
| `username`      | String(255) | UNIQUE, NOT NULL          |
| `email`         | String(255) | UNIQUE, NOT NULL, indexed |
| `password_hash` | String(255) | NOT NULL                  |
| `team_name`     | String(255) | NULL                      |

#### `roles`

| Column        | Type        | Constraints               |
| ------------- | ----------- | ------------------------- |
| `id`          | Integer     | PK, indexed               |
| `name`        | String(100) | UNIQUE, NOT NULL, indexed |
| `description` | String(255) | NULL                      |

#### `permissions`

| Column        | Type        | Constraints               |
| ------------- | ----------- | ------------------------- |
| `id`          | Integer     | PK, indexed               |
| `name`        | String(100) | UNIQUE, NOT NULL, indexed |
| `description` | String(255) | NULL                      |

#### `tasks`

| Column        | Type               | Constraints                 |
| ------------- | ------------------ | --------------------------- |
| `id`          | Integer            | PK, indexed                 |
| `title`       | String(255)        | UNIQUE, NOT NULL            |
| `description` | Text               | NULL                        |
| `status`      | Enum(`statusenum`) | NOT NULL, default `backlog` |
| `sprint`      | String             | NULL                        |
| `created_at`  | DateTime(tz)       | NOT NULL                    |
| `updated_at`  | DateTime(tz)       | NOT NULL                    |

#### `subtasks`

| Column       | Type               | Constraints                 |
| ------------ | ------------------ | --------------------------- |
| `id`         | Integer            | PK, indexed                 |
| `title`      | String(255)        | NOT NULL                    |
| `status`     | Enum(`statusenum`) | NOT NULL, default `backlog` |
| `task_id`    | Integer            | FK to `tasks.id`, NOT NULL  |
| `created_at` | DateTime(tz)       | NOT NULL                    |
| `updated_at` | DateTime(tz)       | NOT NULL                    |

Unique constraint: (`title`, `task_id`) — subtask titles are unique **within** a parent task.

#### `comments`

| Column       | Type         | Constraints               |
| ------------ | ------------ | ------------------------- |
| `id`         | Integer      | PK, indexed               |
| `content`    | String(500)  | NOT NULL                  |
| `task_id`    | Integer      | FK to `tasks.id`, NULL    |
| `subtask_id` | Integer      | FK to `subtasks.id`, NULL |
| `user_id`    | Integer      | FK to `users.id`, NULL    |
| `created_at` | DateTime(tz) | NOT NULL                  |
| `updated_at` | DateTime(tz) | NOT NULL                  |

Cascade: comments are deleted when their parent task or subtask is deleted (ORM cascade).

#### Association tables

| Table                      | Columns (composite PK)                             |
| -------------------------- | -------------------------------------------------- |
| `user_roles`               | `user_id` to users, `role_id` to roles             |
| `role_permissions`         | `role_id` to roles, `permission_id` to permissions |
| `user_task_association`    | `user_id` to users, `task_id` to tasks             |
| `user_subtask_association` | `user_id` to users, `subtask_id` to subtasks       |

### 5.5 Status workflow diagram

Tasks and subtasks share the same status enum. The Kanban board is a projection of tasks by status.

```mermaid
stateDiagram-v2
  [*] --> backlog
  backlog --> todo
  todo --> in_progress
  in_progress --> in_review
  in_review --> qa
  qa --> completed
  completed --> [*]

  backlog --> in_progress: skip ahead allowed
  todo --> in_review: skip ahead allowed
  in_progress --> completed: skip ahead allowed
  in_review --> backlog: move back allowed
  qa --> in_progress: rework allowed
```

| Status        | Meaning                           |
| ------------- | --------------------------------- |
| `backlog`     | Not yet scheduled for active work |
| `todo`        | Ready to start                    |
| `in_progress` | Actively being worked             |
| `in_review`   | Awaiting review                   |
| `qa`          | In quality verification           |
| `completed`   | Finished                          |

Status transitions are not hard-locked in the database; the UI and services accept any valid enum value. The diagram shows the intended delivery path and common backflows.

### 5.6 Work hierarchy diagram

```mermaid
flowchart TB
  T[Task]
  S1[SubTask]
  S2[SubTask]
  CT[Comment on Task]
  CS[Comment on SubTask]
  U1[Assignee Users]
  U2[Assignee Users]
  A[Author User]

  T --> S1
  T --> S2
  T --> CT
  S1 --> CS
  U1 --- T
  U2 --- S1
  A --> CT
  A --> CS
```

### 5.7 Database schema overview

PostgreSQL is the system of record. The schema is managed with **Alembic** migrations under `backend/alembic/versions/`.

Logical groupings:

| Schema area        | Tables                                                            |
| ------------------ | ----------------------------------------------------------------- |
| Identity & access  | `users`, `roles`, `permissions`, `user_roles`, `role_permissions` |
| Work items         | `tasks`, `subtasks`                                               |
| Collaboration      | `comments`                                                        |
| Assignment bridges | `user_task_association`, `user_subtask_association`               |

### 5.8 Database schema diagram

Table-level view of the PostgreSQL database (boxes = tables, arrows = foreign keys).

```mermaid
flowchart LR
  subgraph Identity["Identity and Access"]
    users[(users)]
    roles[(roles)]
    permissions[(permissions)]
    user_roles[(user_roles)]
    role_permissions[(role_permissions)]

    users --- user_roles
    user_roles --- roles
    roles --- role_permissions
    role_permissions --- permissions
  end

  subgraph Work["Work Items"]
    tasks[(tasks)]
    subtasks[(subtasks)]
    tasks --> subtasks
  end

  subgraph Assignment["Assignments"]
    uta[(user_task_association)]
    usa[(user_subtask_association)]
    users --- uta
    uta --- tasks
    users --- usa
    usa --- subtasks
  end

  subgraph Collab["Collaboration"]
    comments[(comments)]
    users --> comments
    tasks --> comments
    subtasks --> comments
  end
```

### 5.9 Database schema diagram (detailed ER style)

```mermaid
erDiagram
  users ||--o{ user_roles : has
  roles ||--o{ user_roles : granted_to
  roles ||--o{ role_permissions : includes
  permissions ||--o{ role_permissions : granted_by

  users ||--o{ user_task_association : assigned
  tasks ||--o{ user_task_association : assignees

  users ||--o{ user_subtask_association : assigned
  subtasks ||--o{ user_subtask_association : assignees

  tasks ||--|{ subtasks : parent_of
  tasks ||--o{ comments : receives
  subtasks ||--o{ comments : receives
  users ||--o{ comments : writes

  users {
    serial id PK
    varchar username UK
    varchar email UK
    varchar password_hash
    varchar team_name "NULL"
  }

  roles {
    serial id PK
    varchar name UK
    varchar description "NULL"
  }

  permissions {
    serial id PK
    varchar name UK
    varchar description "NULL"
  }

  user_roles {
    int user_id PK_FK
    int role_id PK_FK
  }

  role_permissions {
    int role_id PK_FK
    int permission_id PK_FK
  }

  tasks {
    serial id PK
    varchar title UK
    text description "NULL"
    statusenum status
    varchar sprint "NULL"
    timestamptz created_at
    timestamptz updated_at
  }

  subtasks {
    serial id PK
    varchar title
    statusenum status
    int task_id FK
    timestamptz created_at
    timestamptz updated_at
  }

  user_task_association {
    int user_id PK_FK
    int task_id PK_FK
  }

  user_subtask_association {
    int user_id PK_FK
    int subtask_id PK_FK
  }

  comments {
    serial id PK
    varchar content
    int task_id FK "NULL"
    int subtask_id FK "NULL"
    int user_id FK "NULL"
    timestamptz created_at
    timestamptz updated_at
  }
```

### 5.10 PostgreSQL enum types

| Type name    | Values                                                           |
| ------------ | ---------------------------------------------------------------- |
| `statusenum` | `backlog`, `todo`, `in_progress`, `in_review`, `qa`, `completed` |

Used by:

- `tasks.status`
- `subtasks.status`

### 5.11 Keys, indexes, and uniqueness

| Table                      | Key / index  | Definition                                        |
| -------------------------- | ------------ | ------------------------------------------------- |
| `users`                    | PK           | `id`                                              |
| `users`                    | UNIQUE INDEX | `email` (`ix_users_email`)                        |
| `users`                    | UNIQUE       | `username`                                        |
| `users`                    | INDEX        | `id` (`ix_users_id`)                              |
| `roles`                    | PK           | `id`                                              |
| `roles`                    | UNIQUE INDEX | `name`                                            |
| `permissions`              | PK           | `id`                                              |
| `permissions`              | UNIQUE INDEX | `name`                                            |
| `tasks`                    | PK           | `id`                                              |
| `tasks`                    | UNIQUE       | `title`                                           |
| `tasks`                    | INDEX        | `id` (`ix_tasks_id`)                              |
| `subtasks`                 | PK           | `id`                                              |
| `subtasks`                 | UNIQUE       | (`title`, `task_id`) as `unique_subtask_per_task` |
| `subtasks`                 | INDEX        | `id` (`ix_subtasks_id`)                           |
| `comments`                 | PK           | `id`                                              |
| `comments`                 | INDEX        | `id` (`ix_comments_id`)                           |
| `user_roles`               | COMPOSITE PK | (`user_id`, `role_id`)                            |
| `role_permissions`         | COMPOSITE PK | (`role_id`, `permission_id`)                      |
| `user_task_association`    | COMPOSITE PK | (`user_id`, `task_id`)                            |
| `user_subtask_association` | COMPOSITE PK | (`user_id`, `subtask_id`)                         |

### 5.12 Foreign keys and integrity

| Child table                | Column          | References       | Notes           |
| -------------------------- | --------------- | ---------------- | --------------- |
| `subtasks`                 | `task_id`       | `tasks.id`       | Required parent |
| `comments`                 | `task_id`       | `tasks.id`       | Nullable        |
| `comments`                 | `subtask_id`    | `subtasks.id`    | Nullable        |
| `comments`                 | `user_id`       | `users.id`       | Nullable author |
| `user_roles`               | `user_id`       | `users.id`       |                 |
| `user_roles`               | `role_id`       | `roles.id`       |                 |
| `role_permissions`         | `role_id`       | `roles.id`       |                 |
| `role_permissions`         | `permission_id` | `permissions.id` |                 |
| `user_task_association`    | `user_id`       | `users.id`       |                 |
| `user_task_association`    | `task_id`       | `tasks.id`       |                 |
| `user_subtask_association` | `user_id`       | `users.id`       |                 |
| `user_subtask_association` | `subtask_id`    | `subtasks.id`    |                 |

**ORM cascade behaviour (application layer):**

- Deleting a **task** cascades delete of its **comments**
- Deleting a **subtask** cascades delete of its **comments**
- Deleting a **user** cascades delete of comments authored by that user (ORM relationship cascade)
- Task delete is **blocked by business rule** while subtasks still exist (service-layer check, not only DB FK)

### 5.13 Schema evolution (Alembic)

| Concern                              | Location                    |
| ------------------------------------ | --------------------------- |
| Migration scripts                    | `backend/alembic/versions/` |
| Alembic config                       | `backend/alembic.ini`       |
| Apply migrations                     | `alembic upgrade head`      |
| ORM models (source of truth for app) | `backend/app/models/`       |

Initial migration establishes core work tables and associations; later migrations add RBAC tables (`roles`, `permissions`, `user_roles`, `role_permissions`) and timestamp columns where applicable.

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

This file is the primary documentation for the DevTrack application: product scope, architecture, domain, security, APIs, UI surfaces, caching, and runtime configuration. Update it when modules, permissions, routes, or operational requirements change.
