# 📋 Retail Manager - Central Errors Index & Field Feedback Hub

*Canonical registry tracking all production, field, and CI/CD errors categorized by Branch, Store Organization, Computer/POS Type, and Runtime System.*

---

## 1. Quick Navigation per Branch

| Branch | Store Organization | Primary Target Hardware | Dedicated Error Log |
| :--- | :--- | :--- | :--- |
| `main-stihl-dibidani` | Magasin STIHL Dibidani | Windows 11 POS (Caisse 1 / Bureau) | [`ERRORS_STIHL_DIBIDANI.md`](./ERRORS_STIHL_DIBIDANI.md) |
| `main-stihl-niamakoro` | Magasin STIHL Niamakoro | Windows 11 POS (Caisse 1 / Caisse 2 / Bureau) | [`ERRORS_STIHL_NIAMAKORO.md`](./ERRORS_STIHL_NIAMAKORO.md) |
| `main-stores-dubai` / `main-niamana-dubai` | Magasin Niamana / Dubai | Windows 11 Touch POS (Caisse Principale) | [`ERRORS_STORES_DUBAI.md`](./ERRORS_STORES_DUBAI.md) |
| `main-mpm-food` / `main-restaurants` | Restaurant MPM Food | Windows POS + Tablette Android (Cuisine/Salles) | [`ERRORS_MPM_FOOD.md`](./ERRORS_MPM_FOOD.md) |

---

## 2. Standardized Error Entry Schema

Whenever an autonomous agent, developer, or Sentry webhook investigates an error, it MUST append an entry to the corresponding branch file using this exact structure:

```markdown
### [YYYY-MM-DD] <Title / Short Symptom>
- **Organization:** <STIHL Dibidani | STIHL Niamakoro | Stores Dubai | MPM Food>
- **Branch:** <Branch Name>
- **Computer Role:** <Caisse 1 | Caisse 2 | Bureau Gérant | Tablette Serveur | CI Runner>
- **Operating System:** <Windows 11 POS | Windows 10 | macOS | Android>
- **Runtime Layer:** <Tauri Rust | Local Bridge Fastify/SQLite | Frontend React/Vite | Cloud Sync>
- **Error Category:** <SQLITE_SYNC | CASH_JOURNAL | TICKET_PRINTING | BARCODE_SCAN | PRICING_TIER | NETWORK_OFFLINE>
- **Symptom:** <Detailed description of what failed in the field>
- **Files Involved:** <List of files modified>
- **Root Cause:** <Technical diagnosis>
- **Fix Applied:** <Exact code modifications>
- **Verification:** <Evidence: npm run build, tsc, playwright, or field run>
- **Status:** FIXED | FAILED | INVESTIGATING
```

---

## 3. Sentry Field Tag Mapping

When initializing Sentry in the frontend (`src/main.tsx`) or backend (`src/index.ts`):

```typescript
import * as Sentry from "@sentry/react";

export function configureFieldMonitoring(config: {
  organization: string;
  branch: string;
  computerRole: string;
  computerOs: string;
}) {
  Sentry.setTags({
    organization: config.organization,
    branch: config.branch,
    computer_role: config.computerRole,
    computer_os: config.computerOs,
    app_version: __APP_VERSION__,
  });
}
```
