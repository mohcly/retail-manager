# RETAIL-MANAGER — Master Engineering & Autonomous Agent Handoff Dossier

**Target System:** Retail-Manager Desktop POS & Cloud ERP Multi-Branch Ecosystem  
**Maintainer & Architect:** Mohamed Coulibaly (`moh.kuhh@gmail.com`)  
**Version:** 2.0.0 (Sentry Autonomous CI/CD Edition)

---

## 1. Multi-Branch Ecosystem & Deployment Topology

Retail-Manager operates across separate business branches, each maintaining its own SQLite local bridge and database synchronization:

| Branch Name | Business Organization | Computer Roles / Deployment | Error Log Path |
| :--- | :--- | :--- | :--- |
| `main-stihl-dibidani` | Stihl Dibidani (Quincaillerie) | Caisse 1, Caisse 2, Bureau (Windows 11 POS) | `memory-bank/errors/ERRORS_STIHL_DIBIDANI.md` |
| `main-stihl-niamakoro` | Stihl Niamakoro | Caisse 1, Bureau (Windows 11 POS) | `memory-bank/errors/ERRORS_STIHL_NIAMAKORO.md` |
| `main-stores-dubai` | Stores Dubai | Caisse POS, Bureau | `memory-bank/errors/ERRORS_STORES_DUBAI.md` |
| `main-niamana-dubai` | Niamana Dubai | Caisse POS, Bureau | `memory-bank/errors/ERRORS_STORES_DUBAI.md` |
| `main-mpm-food` | MPM Food Portal | Production & Food Operations | `memory-bank/errors/ERRORS_MPM_FOOD.md` |
| `main-restaurants` | Restaurants POS | Service, Kitchen, Ingredients POS | `memory-bank/errors/ERRORS_INDEX.md` |

---

## 2. Autonomous Sentry Auto-Healing & CI/CD Protocol

Every branch is equipped with the automated healing pipeline in `.github/workflows/auto-heal-and-test.yml`:
1. **Trigger:** Sentry sends a webhook (`repository_dispatch: [sentry_error_alert]`) or developer triggers `workflow_dispatch`.
2. **Context Enrichment:** The workflow identifies the target branch, client operating system (Windows 11 POS), computer role (Caisse 1/2, Bureau), and error stack trace.
3. **Memory Bank Registration:** The incident is automatically logged to the branch's error file in `memory-bank/errors/ERRORS_<BRANCH>.md`.
4. **Autonomous Fix & Verification Gates:**
   - **Backend Gate:** `cd backend/local-bridge && npm run build` (must compile with exit code 0).
   - **Frontend Gate:** `cd frontend && npm run build` (or `npx tsc --noEmit`).
5. **Persistence:** The verified fix is committed and pushed with author `mohcly <moh.kuhh@gmail.com>`.

---

## 3. Core Architectural Rules & Design Invariants (DO NOT VIOLATE)

### A. Pricing & Packaging Units:
- **Piece-Centric Pricing:** The Base Unit (`Piece`) is stored in SQLite/Supabase for quantity and price.  
  `Total = Qty * Price * (isBox ? PackSize : 1)`.
- **Multi-Price Tiers:** `selling_price_2/3/4` (Discount, Bulk, Resale) are selectable per-item in Proforma/Sales grids.
- **Packaging Regex:** Uses `/(\d+)/` to extract pack size (e.g. "Box of 12"). If pack size is 1, toggling is blocked with a warning.
- **Product Form Stability:** No auto-scaling on quantity during product create/edit when toggling units.

### B. Offline-First Synchronization & Database:
- **No Monolithic `db.ts`:** Monolithic `db.ts` is deleted. All database operations strictly use the repository pattern under `db/index.ts` and `db/repositories/`.
- **Outbox Sync Engine:** Every write emits an event into `sync_outbox` with bumped versions for remote Supabase reconciliation.
- **Never convert to monorepo:** Keep `frontend` as a submodule or isolated package. Do not merge PRs flattening the directory structure.

### C. Cascading Deletion & Permissions:
- Products are deleted via transactions that nullify `product_id` in sales/purchases, delete movements, and delete `purchase_items` (enforcing NOT NULL constraints).
- Worker role is authorized to delete products with store ownership check. Route is idempotent (returns 200 OK if already missing).

---

## 4. Verification Commands Before Every Commit

```bash
# 1. Test backend local bridge build:
cd /Users/mohamedcoulibaly/MVP/Pro/retail-manager/backend/local-bridge
npm run build

# 2. Test frontend TypeScript & Vite build:
cd /Users/mohamedcoulibaly/MVP/Pro/retail-manager/frontend
npx tsc --noEmit
npm run build
```
