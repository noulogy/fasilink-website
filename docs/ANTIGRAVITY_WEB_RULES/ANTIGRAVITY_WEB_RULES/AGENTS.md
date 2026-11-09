# Workspace Instructions — Campus Facility & Schedule Manager (Web)

## 1. Source of truth
- Treat `IMPLEMENTATION_PLAN_WEB.md` as the project-level plan and business baseline.
- Treat the uploaded LSKK/Pustekhan standards in the repository as technology and process constraints. If a source file is missing, report it; do not pretend to have read it.
- The completed desktop application is the behavioral baseline. Audit its real source code and database before changing or migrating anything. Never infer table/field names or claim feature parity without evidence.
- Distinguish **existing facts**, **proposed decisions**, and **not-yet-implemented work** in reports and documentation.

## 2. Non-negotiable architecture
- Frontend: TypeScript + React Functional Components + Vite + Tailwind CSS + Ant Design; MUI X Data Grid for primary data grids; Axios; TanStack Query; Zustand/Context only for appropriate client state; React Router DOM with `createHashRouter`; React Hook Form + Zod; Prettier and Vite ESLint.
- Backend: TypeScript + NestJS; PostgreSQL + TypeORM for relational/transactional data; DTO validation with `class-transformer` and `class-validator`; JWT + Passport; Guards for authorization; Nest Cache Manager; Nest Logger and HTTP logging middleware; global Exception Filter and Response Interceptor; Jest/Nest testing.
- Use the LSKK response contract consistently: `IResponseEntity<T>` with `code`, `status`, `message`, optional `data`, and optional `meta` (`totalPages`, `totalData`, `totalDataPerPage`, `page`, `limit`).
- Browser talks to API only. Never connect frontend directly to a database.
- Business rules and final authorization/validation belong in backend services/guards, not only in React.
- Use Socket.IO/SSE only for a demonstrated realtime need; REST must remain the source for reading current state/fallback.
- Do not add MongoDB, MQTT, RabbitMQ, Go Worker, object storage, or other infrastructure without identifying the actual use case and recording an architecture decision. Do not contradict an explicit mandatory standard: surface ambiguity for human approval rather than silently skipping or adding infrastructure.

## 3. Data and migration safety
- Never overwrite, delete, rename, or restructure the completed desktop project/database during initial audit.
- Before migration: backup; inspect actual schema/data; map identifiers and statuses; detect duplicates/orphans/invalid dates; test an idempotent import in staging; reconcile counts and relationships.
- Do not run destructive SQL, production migrations, or bulk data updates without explicit approval and a verified backup.
- PostgreSQL is the transactional source of truth for the web system once migration is approved. Avoid two independently writable databases for desktop and web.
- Use TypeORM migrations; do not use schema `synchronize` in production. Keep business rules in services, not hidden triggers.

## 4. Business invariants
- Only two application roles are in scope: `ADMIN` and `USER`, unless the existing approved system proves otherwise.
- Approval must re-check current conditions inside a database transaction. Never trust stale frontend/cache availability.
- Prevent overlapping room, class-group, and lecturer schedules. Respect capacity, academic period, approved room loans, and confirmed calendar exceptions.
- Item stock must never become negative; record approval, handover, return, and condition changes consistently.
- Alternative schedule results must preserve required duration and satisfy all hard constraints. Soft preferences only rank valid candidates. No candidate may directly change the official schedule; authorized approval is required.
- Follow the desktop's verified policy for recurrence/single-session changes. If unclear, raise a decision; do not invent it.

## 5. Security and quality
- Validate and transform all API inputs with DTOs. Use typed interfaces/enums; minimize `any`.
- Enforce role and record ownership in the backend. Frontend route guards are UX, not security.
- Never store passwords in plaintext, expose secrets, log tokens, or put credentials in source control.
- Configure CORS with explicit allowed origins and rate limiting; do not use wildcard CORS in production.
- Do not send stack traces or internal details to clients.
- Every meaningful service/business rule needs tests. Never claim a command/test/build passed unless it was actually run and its result inspected.

## 6. How to work
- Start by inspecting the repository and current code. Do not assume a folder layout, package manager, database engine, or existing feature state.
- Follow `IMPLEMENTATION_PLAN_WEB.md` phases and SOP gates in order. Do only the requested phase/task; do not silently jump ahead.
- Before editing: state a short plan, identify affected files, dependencies, and risks. Prefer small, reviewable changes over broad rewrites.
- Preserve working behavior and existing conventions unless a documented decision authorizes change.
- Keep API contract, frontend types, backend DTOs, and tests synchronized. Contract changes require explicit FE/BE agreement and documentation.
- After changes: run relevant format/lint/typecheck/build/tests; fix regressions; report exact commands and outcomes, files changed, remaining risks, and next step.
- If information is missing, inspect the repository first. Ask only when an irreversible or product-level decision cannot be safely inferred; otherwise record a clearly labeled assumption and continue with a non-destructive step.

## 7. Definition of done
A task is not complete merely because code was generated. It is complete only when acceptance criteria are met, relevant checks have actually passed, errors/states are handled, documentation/contracts are updated, and the final report distinguishes completed work from known gaps.
