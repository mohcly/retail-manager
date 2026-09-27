# Retail Manager - Claude Agent Instructions (CLAUDE.md)

Autonomous Engineering Rules for Claude Code in Retail Manager.

## Critical Rules
1. **Never Duplicate Code:** Search the codebase by behavior and purpose before writing any new helper or component.
2. **Never Leave Dead Code Behind:** Delete replaced code in the exact same change.
3. **Never Say Done Without Real Build Evidence:**
   - Must run `npm run build` in `backend/local-bridge`
   - Must run `npm run build` in `frontend`
   - Must pass `npx tsc --noEmit`
4. **Preserve Submodule & Branch Topology:** Do not convert the repository into a monorepo structure. Keep `frontend` as a submodule.

## Multi-Branch CI/CD & Error-Healing Loop
- **Active Branch Responsibility:** Retail Manager maintains isolated business logic across:
  - `main-stihl-dibidani` (STIHL Dibidani POS)
  - `main-stihl-niamakoro` (STIHL Niamakoro POS)
  - `main-stores-dubai` (Dubai / Niamana)
  - `main-mpm-food` (MPM Food Restaurant)
- **Sentry Error Documentation Mandate:**
  Every resolved error must be documented in `memory-bank/errors/ERRORS_<BRANCH>.md` with:
  - Machine Type (e.g. Windows 11 Touch POS Caisse 1, macOS, Android Tablet)
  - Organization (e.g. STIHL Dibidani, MPM Food)
  - Runtime Layer (Tauri Rust, Fastify Local Bridge, React Vite Frontend)
  - Root Cause & Build Verification output.
- **Workflow:** Sentry Alert -> Context Bundle Assembly -> Agent Fix -> `npm run build` & `tsc` Verification -> Git Commit & Branch Pull Request.
