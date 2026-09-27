# 🛡️ Sentry & Autonomous CI/CD Error-Healing Specification (Retail Manager)

## 1. Executive Summary & Problem Solved
Historically (documented in `memory-bank/core/roadmap-2026-07-31.md`), Retail Manager suffered from a **"blind field feedback loop"**:
- Cashiers in Dibidani, Niamakoro, or Dubai experienced silent crashes or unexpected exceptions during network flickers, printer timeouts, or SQLite sync delays.
- Bugs were reported days later via text message with no stack traces or reproduction paths.
- Multiple divergent branches (`main-stihl-dibidani`, `main-stihl-niamakoro`, `main-stores-dubai`, `main-mpm-food`) meant a bug fixed in one branch had to be manually diagnosed and ported.

This specification establishes a **Unified Field Observability & Closed-Loop Autonomous Healing Architecture**:
1. **Sentry Developer Tier (Free forever)** captures every unhandled runtime crash with contextual tags (Organization, Branch, Computer Role, OS).
2. **GitHub Actions Workflow (`auto-heal-and-test.yml`)** wakes up on Sentry Issue creation.
3. **Headless Antigravity / Gemini Agent** runs non-interactively via `GEMINI_API_KEY` (no interactive terminal prompts or copy-paste verification keys).
4. **Autonomous Testing & Build Verification** compiles `backend/local-bridge`, `frontend`, and validates `npx tsc --noEmit` before any code is approved.
5. **Per-Branch Documentation** updates `memory-bank/errors/ERRORS_<BRANCH>.md` and opens an isolated Pull Request.

---

## 2. Field Tagging Architecture

Every event sent to Sentry MUST be annotated with these structured dimensions:

```typescript
// frontend/src/lib/sentry.ts & backend/local-bridge/src/lib/sentry.ts
import * as Sentry from "@sentry/react"; // or @sentry/node in local-bridge

export interface RetailDeviceContext {
  organization: "STIHL_DIBIDANI" | "STIHL_NIAMAKORO" | "STORES_DUBAI" | "MPM_FOOD";
  branch: "main-stihl-dibidani" | "main-stihl-niamakoro" | "main-stores-dubai" | "main-mpm-food";
  computerRole: "CAISSE_1" | "CAISSE_2" | "BUREAU_GERANT" | "TABLETTE_SALLE" | "CUISINE";
  computerOs: "WINDOWS_11_POS" | "WINDOWS_10" | "MACOS" | "ANDROID";
  runtimeLayer: "TAURI_RUST" | "LOCAL_BRIDGE_FASTIFY" | "FRONTEND_REACT" | "SUPABASE_SYNC";
}

export function initSentryMonitoring(context: RetailDeviceContext) {
  const dsn = import.meta.env.VITE_SENTRY_DSN || process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
  });

  Sentry.setTags({
    organization: context.organization,
    branch: context.branch,
    computer_role: context.computerRole,
    computer_os: context.computerOs,
    runtime_layer: context.runtimeLayer,
  });
}
```

---

## 3. Autonomous Healing Flowchart

```mermaid
flowchart TD
    FieldCrash["Field Crash on Windows POS (Caisse 1 / Dibidani)"] --> SentryCapture["Sentry Event Captured with Tags: Organization, Branch, Role, OS"]
    SentryCapture --> GitHubIssue["Sentry GitHub Integration opens Issue #123 labeled 'sentry'"]
    GitHubIssue --> ActionTrigger["GitHub Actions: .github/workflows/auto-heal-and-test.yml"]
    
    subgraph AutonomousRunner["GitHub Actions Headless Runner (Ubuntu / Windows)"]
        ActionTrigger --> ContextBuild["Assemble Context Bundle:\n- Issue Stacktrace & Breadcrumbs\n- GEMINI.md\n- memory-bank/errors/ERRORS_<BRANCH>.md"]
        ContextBuild --> AgentExec["Antigravity / Gemini Agent (Non-Interactive via GEMINI_API_KEY)"]
        AgentExec --> PatchGen["Minimal Code Patch Generated"]
        PatchGen --> BuildVerify["BUILD VERIFICATION:\n1. backend/local-bridge npm run build\n2. frontend npm run build\n3. npx tsc --noEmit"]
        
        BuildVerify -->|Build Fails| AgentRetry["Agent reads compiler errors and refactors patch"]
        AgentRetry --> BuildVerify
        
        BuildVerify -->|Build 100% GREEN (Code 0)| CommitStep["Git Commit & Document in ERRORS_<BRANCH>.md"]
    end
    
    CommitStep --> PullRequest["Automated PR: fix/sentry-issue-123 into active branch"]
    PullRequest --> Notification["Slack/WhatsApp/Telegram or GitHub Notification to Mohamed"]
```

---

## 4. Headless Non-Interactive Authentication Guarantee
To eliminate interactive browser redirects or terminal token prompts in CI/CD:
- **`GEMINI_API_KEY`:** Stored in GitHub Repository Secrets. The agent SDK consumes this directly from environment variables.
- **`${{ secrets.GITHUB_TOKEN }}`:** Native short-lived GitHub token providing permissions to push branches and open Pull Requests without human credentials.
