# 🛠️ Branch Error Log: Stores Dubai / Niamana (`main-stores-dubai` / `main-niamana-dubai`)

*Organization: Magasin Niamana / Dubai*  
*Hardware: Windows 11 Touch POS Caisse Principale*

---

### [2026-07-31] Remise Theatre, Gros-Tier Pricing, & Cash Journal Discrepancies
- **Organization:** Stores Dubai / Niamana
- **Branch:** `main-niamana-dubai` / `main-stores-dubai`
- **Computer Role:** Caisse Principale
- **Operating System:** Windows 11 POS
- **Runtime Layer:** Frontend React / Fastify Local Bridge
- **Error Category:** PRICING_TIER / CASH_JOURNAL
- **Symptom:** Remise calculations displayed inaccurate amounts; gros-tier wholesale pricing failed to persist; cash journal sorting failed on missing `created_at` timestamps.
- **Files Involved:** `frontend/src/components/worker/Sales/`, `backend/local-bridge/src/db/repositories/sales.repo.ts`, `backend/local-bridge/src/db/repositories/cashJournal.repo.ts`
- **Root Cause:** Proforma sales grid failed to propagate secondary tier price coefficients, and cash journal queries fell back to string date comparison instead of timestamp ordering.
- **Fix Applied:** Enforced wholesale price mapping on multi-tier items, added fallback `created_at ?? date` in cash journal, and pinned store-scope ID on all sales queries.
- **Verification:** Verified end-to-end sales creation and `/settle` endpoint. Commit `ef532ca`.
- **Status:** FIXED
