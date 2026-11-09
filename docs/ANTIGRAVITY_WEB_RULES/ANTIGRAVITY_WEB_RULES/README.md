# Antigravity Workspace Rules — Web Migration

## Isi paket
- `AGENTS.md`: instruksi inti yang selalu aktif di workspace.
- `.agents/rules/architecture-migration.md`: audit desktop, migrasi, dan ADR.
- `.agents/rules/frontend.md`: standar React frontend.
- `.agents/rules/backend.md`: standar NestJS backend.
- `.agents/rules/data-business.md`: database dan aturan bisnis kritis.
- `.agents/rules/testing-release.md`: integrasi, testing, security gate, dan release.
- `PROMPT_ANTIGRAVITY_HEMAT_TOKEN.md`: prompt awal Phase 0 dan template prompt berikutnya.

## Pemasangan
1. Ekstrak/copy isi folder paket ke root repository web yang sama dengan `IMPLEMENTATION_PLAN_WEB.md`.
2. Pastikan susunan `AGENTS.md` dan `.agents/rules/*.md` tidak berubah.
3. Buka root repository sebagai workspace Antigravity.
4. Mulai dengan prompt Phase 0 dari `PROMPT_ANTIGRAVITY_HEMAT_TOKEN.md`.

Antigravity membaca `AGENTS.md` secara terus-menerus dan memuat file `.agents/rules/*.md` berdasarkan trigger `model_decision`. File rule sengaja dipisah agar instruksi teknis hanya dimuat ketika relevan.
