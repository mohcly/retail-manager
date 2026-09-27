---
trigger: always_on
description: Sentry Headless CI/CD Auto-Heal & Per-Branch Error Hub Rules
---

# Sentry Autonomous CI/CD & Error Tracking Directives
- **Zero-Interactive CI/CD:** When running in GitHub Actions, use `GEMINI_API_KEY` and `${{ secrets.GITHUB_TOKEN }}`. Never attempt interactive browser login.
- **Build Verification Required:** Always test `npm run build` in `backend/local-bridge` and `frontend` before finalizing changes.
- **Branch Segregation:** Log all incidents in `memory-bank/errors/ERRORS_<BRANCH>.md`.
