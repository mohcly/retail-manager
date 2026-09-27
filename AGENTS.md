# Autonomous Agents Standard Operating Procedure (AGENTS.md)

## Active Directives for Antigravity, Gemini, & Subagents in Retail Manager
1. **Auto-Heal CI/CD Integration:** This repository uses the Sentry Headless CI/CD Auto-Heal workflow (`.github/workflows/auto-heal-and-test.yml`).
2. **Build Verification Mandate:** Never consider an edit complete without running:
   - `cd backend/local-bridge && npm run build`
   - `cd frontend && npm run build`
   - `npx tsc --noEmit`
3. **Multi-Branch Error Segregation:** Errors must be documented per branch in `memory-bank/errors/ERRORS_<BRANCH>.md`.
4. **Sentry Tagging:** Tag all issues with `organization`, `branch`, `computer_role`, `computer_os`, and `runtime_layer`.
