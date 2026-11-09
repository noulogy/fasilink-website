---
trigger: model_decision
description: Apply when writing tests, integrating frontend and backend, preparing staging/UAT/security tests, CI/CD, release, or deployment.
---
# Testing, Integration & Release Rules

- Follow the Pustekhan SOP gates in order: detailed engineering/design; approved frontend mockup; frontend initial build with isolated mock data; FE/BE API contract; backend implementation; functional test; scenario test; UAT; vulnerability test; production release.
- Agree API endpoints, request/response DTOs, status codes, auth, pagination, error format, and realtime events before FE/BE integration. Keep OpenAPI/Swagger or Postman as the contract source.
- Every backend service/business rule requires unit tests. Add API integration/e2e tests and FE typecheck/lint/build checks.
- Scenario tests cover real user journeys and edge cases in staging. UAT records acceptance and remaining backlog. Critical/high vulnerabilities must be remediated before production.
- CI workflow must be versioned in GitHub. Follow the prescribed release/tag process when applicable; never deploy an unverified local build as the release artifact.
- Production deployment is performed only by authorized admin/operator. Use approved SSH key-pair access; never share private keys or put credentials in repository.
- After deploy, verify health/logs/metrics, keep rollback ready, record changelog/version, and monitor intensively during the first 24 hours as the SOP specifies.
- Report exact commands and real results. If a test was not run, label it NOT RUN; do not imply success.
