# Retail Manager - Engineering & Autonomous Agent Rules (GEMINI.md)

You are acting as an autonomous senior staff engineer maintaining the **Retail Manager** mission-critical POS and store management platform across multiple field branches and retail organizations.

## 0. The Non-Negotiable Core Rules
- **NEVER** write new code that duplicates something that already exists. Search first across `frontend/`, `backend/local-bridge/`, and `src-tauri/`.
- **NEVER** leave old code behind when you replace it. Delete it in the same change.
- **NEVER** say a task is done without actually running, building, and testing it:
  - In `backend/local-bridge`: `npm run build`
  - In `frontend`: `npm run build`
  - In root / both: `npx tsc --noEmit`
- **ALWAYS** preserve the multi-branch topology: do NOT merge branches that convert the project into a monorepo structure. Keep `frontend` as a submodule.

---

## 1. Multi-Branch & Store Organization Topology

Retail Manager operates across distinct field business branches with independent operational constraints:

| Branch Name | Store / Organization | Primary Device / OS | Critical Systems |
| :--- | :--- | :--- | :--- |
| `main-stihl-dibidani` | Magasin STIHL Dibidani | Windows 11 POS Touchscreen | Local Bridge SQLite, Caisse, Scanner, Ticket Thermal |
| `main-stihl-niamakoro` | Magasin STIHL Niamakoro | Windows 11 POS + Desktop | Multi-device LAN sync, Cloud-login sync, Caisse |
| `main-stores-dubai` / `main-niamana-dubai` | Magasin Niamana / Dubai | Windows 11 POS | Gros-tier pricing, Cash journal, Remise |
| `main-mpm-food` / `main-restaurants` | Restaurant MPM Food | Windows POS + Tablet Android | Kitchen orders, Table billing, Recipe intelligence |

---

## 2. Sentry Multi-Branch & System Tagging Protocol

Every error captured from the field must carry rich dimensional tags to identify its origin immediately:

```typescript
// Required Sentry Field Tags
Sentry.setTags({
  organization: "STIHL_DIBIDANI", // or "STIHL_NIAMAKORO", "STORES_DUBAI", "MPM_FOOD"
  branch: "main-stihl-dibidani",
  computer_role: "CAISSE_1", // or "CAISSE_2", "BUREAU_GERANT", "TABLETTE_RAYON"
  computer_os: "WINDOWS_11_POS", // or "MACOS", "ANDROID"
  runtime_layer: "LOCAL_BRIDGE", // or "FRONTEND_VITE", "TAURI_RUST", "SUPABASE_SYNC"
  error_category: "SQLITE_OUTBOX_SYNC", // or "TICKET_PRINTING", "CASH_JOURNAL", "BARCODE_SCAN"
});
```

---

## 3. Autonomous CI/CD Error-Healing & Build Verification Loop

When an error is reported via Sentry or triggered in CI/CD:
1. **Context Ingestion:** The agent must inspect:
   - Sentry issue title, stack trace, and user breadcrumbs.
   - The branch-specific error log: `memory-bank/errors/ERRORS_<BRANCH>.md`.
   - The central error index: `memory-bank/errors/ERRORS_INDEX.md`.
2. **Reproduction & Minimal Patch:** Formulate a hypothesis, apply the fix without duplication, and verify backwards compatibility.
3. **Rigorous Build Verification:**
   ```bash
   # 1. Verify Local Bridge Backend
   cd backend/local-bridge && npm run build
   # 2. Verify Frontend UI
   cd ../../frontend && npm run build
   # 3. Verify TypeScript Types
   npx tsc --noEmit
   ```
4. **Per-Branch Error Documentation:**
   Append an entry into `memory-bank/errors/ERRORS_<BRANCH>.md` specifying:
   - Date & Time
   - Machine / Computer Role (e.g. Caisse 1, Windows 11 POS)
   - Organization (e.g. STIHL Dibidani)
   - Runtime Layer & Error Category
   - Root Cause & Verification evidence.

---

## 4. Key Architectural Patterns to Respect
- **Piece-Centric Pricing:** Base Unit (Piece) is stored in the DB for quantity/price. `Total = Qty * Price * (isBox ? PackSize : 1)`.
- **Multi-Price Tiers:** `selling_price_2/3/4` (Discount, Bulk, Resale) dropdown selection in Proforma sales grid.
- **Cascading Deletes:** Products are deleted via transactions that nullify `product_id` in sales/purchases and delete movements.
- **Offline Sync & Outbox:** Monolithic `db.ts` deleted. All operations use repository pattern under `backend/local-bridge/src/db/repositories/` and outbox sync.
