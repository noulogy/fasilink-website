---
trigger: model_decision
description: Apply when creating or reviewing NestJS modules, controllers, services, repositories, DTOs, authentication, authorization, API responses, caching, or realtime events.
---
# Backend Rules

- Use TypeScript + NestJS with modules organized by business domain. Use typed DTOs, interfaces, and enums; minimize `any`.
- Use PostgreSQL + TypeORM for relational/transactional domain data. Use TypeORM migrations; production schema synchronization is forbidden.
- Use `class-transformer` + `class-validator` for DTO input validation. Controllers handle transport only; services own business rules; repositories own persistence access.
- Use JWT + Passport for authentication and Nest Guards for role/permission authorization. Check both role and record ownership.
- Use Nest Cache Manager selectively. Cache is never authoritative for approvals or availability; invalidate after relevant writes and re-read database state before approval.
- Use Nest Logger only, including HTTP logging middleware. Do not log passwords, access/refresh tokens, secrets, or unnecessary personal data.
- Configure a global Exception Filter for errors and a global Response Interceptor for success responses. Keep `IResponseEntity<T>` and `ImetaPagination` exact and consistent.
- Apply CORS allowlists and rate limiting, especially for login and sensitive endpoints. Do not expose internal stack traces.
- Use Socket.IO Gateway / SSE only where the product requires them. Authenticate WebSocket at handshake; REST remains fallback/current-state read path.
- Use database transactions for approvals, stock movements, and schedule changes. Re-check state and conflicts inside the transaction; handle concurrent requests safely.
- Write unit tests for services and e2e/integration tests for endpoints and role boundaries. Never bypass tests to report completion.
