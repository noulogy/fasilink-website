---
trigger: model_decision
description: Apply when auditing the existing desktop project, planning web migration, changing project structure, database ownership, or making architecture decisions.
---
# Architecture & Desktop-to-Web Migration

1. Read `IMPLEMENTATION_PLAN_WEB.md` and inspect the actual repository before proposing code changes.
2. Treat the desktop implementation as evidence, not as a guessed specification. Produce a feature-parity matrix: verified working / partial / missing / unclear.
3. Inspect the actual database engine, schema, constraints, sample records, status values, and date/time representation. Never assume SQLite or any table names.
4. Keep desktop source/database untouched during audit. Create backups before any approved migration operation.
5. Decide and document whether web replaces desktop or both clients remain active. If both remain, both must use one canonical API/database or an explicitly designed synchronization mechanism; never leave two writable sources of truth.
6. Draw the target architecture and write ADRs for material decisions. Note that the LSKK Architecture v1.1 document is marked Draft for Review in the supplied copy; obtain approval where required.
7. Resolve the PostgreSQL/MongoDB interpretation with the project owner: Backend Standard Stack lists both, while Architecture v1.1 selects storage by data characteristics. Do not add meaningless Mongo collections or silently ignore a mandatory instruction.
8. No destructive migration, mass edit, or production deployment during audit/design. First deliver findings, mapping, risks, and a recommended non-destructive plan.
