---
trigger: model_decision
description: Apply when changing database entities, migrations, data import, room/inventory loans, approvals, schedule conflicts, or alternative schedule search.
---
# Data & Business Rules

- Verify the desktop behavior and actual schema before changing entities or status transitions. Do not infer unknown rules.
- Keep PostgreSQL as the web transactional source of truth after migration approval. Use explicit FK, indexes, constraints, audit fields, and documented TypeORM migrations.
- Migration must be backed up, mapped, idempotent, tested in staging, and reconciled by counts and relationships before cutover.
- Use the interval-overlap rule `requested_start < existing_end && requested_end > existing_start`, plus any confirmed room setup/cleanup buffer.
- Check room, class-group, lecturer, capacity, academic term/calendar, and approved room bookings as applicable.
- Approval re-checks current state within one transaction. On conflict, reject safely with a clear error; do not partially apply changes.
- Inventory movements must be traceable. Available stock cannot be negative; approval, handover, return, loss, and damage must follow approved status transitions.
- Schedule candidate hard constraints: exact required duration, valid period, lecturer free, class group free, room free, adequate capacity, no approved room booking, and applicable academic exceptions.
- Soft preferences only rank valid candidates. An empty result must be explained, not fabricated.
- Selecting a candidate creates a change request. The official schedule changes only after authorized approval and final transactional validation.
- Confirm whether desktop changes affect one meeting or a recurring schedule before implementing recurrence logic.
