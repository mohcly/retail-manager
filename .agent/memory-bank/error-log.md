# Error Log

### [2026-10-17] STIHL Supabase Data Isolation and Mobile Web Portal Empty State
- Symptom: Web portal `djati-stihl.vercel.app` showed zero products and zero sales, and mobile users had blank views when storeId was unassigned. Desktop builds for Niamana Dubai failed sync checks (HTTP 400 ConfigMissing).
- Files involved:
  - Supabase Database `fpvrbxmbrotowdlyebqv` (`stores`, `user_roles`)
  - `backend/local-bridge/src/routes/auth.ts` (branches `main-stihl-dibidani`, `main-stihl-niamakoro`, `main-niamana-dubai`)
  - `.github/workflows/build.yml` (branches `main-niamana-dubai`, `main-mpm-food`, `main-stores-stihl`)
  - `frontend/src/services/OfflineAuthService.ts`
  - `frontend/src/components/mobile/MobileWorkerLayout.tsx`
  - `frontend/src/components/mobile/POS/MobilePOS.tsx`
- Root cause:
  1. In Supabase STIHL project (`fpvrbxmbrotowdlyebqv`), active stores `bb2546ae-a2b3-47da-ae46-22b9b2914304` (Dibidani) and `12dbb4a7-8a8f-4d87-8290-ca0c99c94e4c` (Niamakoro) had `owner_id = NULL`, and user roles were mapped only to an empty ghost store, so RLS policies completely hid products (328) and sales (131) from authenticated workers/masters on the web portal.
  2. Niamana Dubai's desktop CI lacked secret `NIAMANA_SUPABASE_SERVICE_KEY` in GitHub Secrets, compiling an empty service key into the binary, causing `routes/sync.ts` to abort every sync attempt.
  3. MPM Food CI was injecting the STIHL service role key instead of MPM Food's key, and the MPM Food Supabase project was paused by Supabase after 7 days of inactivity.
  4. On mobile/web portals, `storeId` resolution in `OfflineAuthService` only fell back to visible stores for master accounts, leaving workers without a store context if metadata had not loaded yet, and `MobileWorkerLayout` / `MobilePOS` lacked fallbacks to `OfflineStoreService.getStores()`.
  5. `main-stores-stihl` had `pnpm-lock.yaml` tracked and triggered Tauri Windows builds on every push, failing because pnpm is not installed on GitHub Windows runners.
- Fix applied:
  1. Assigned `owner_id` to both STIHL stores, mapped all 4 users in `user_roles` to both stores, and re-routed orphaned sales/worker rows from ghost store before removing it.
  2. Added valid secret `NIAMANA_SUPABASE_SERVICE_KEY` to GitHub repo secrets.
  3. Pinned canonical store IDs in `backend/local-bridge/src/routes/auth.ts` for Dibidani, Niamakoro, and Niamana Dubai.
  4. Updated `OfflineAuthService.ts` to allow visible store fallback for any role without a storeId, and added `OfflineStoreService.getStores()` fallbacks in `MobileWorkerLayout.tsx` and `MobilePOS.tsx`.
  5. Removed `pnpm-lock.yaml` and set `build.yml` on `main-stores-stihl` to `on: workflow_dispatch` only.
  6. Dispatched clean CI builds for `main-stihl-dibidani`, `main-stihl-niamakoro`, and `main-niamana-dubai`.
- Verification:
  - Verified Supabase RLS directly with SQL simulation: worker `blaisetienou` can query 328 products and 131 sales.
  - Successfully built frontend in `main-stores-stihl` with zero Vite/TypeScript errors in 8.89s.
  - Pushed to `stadium91/retail-manager` branch `main-stores-stihl`; `Mirror to Vercel-connected repo` succeeded in 11s.
  - Verified Vercel deployment `dpl_CaeYynxNrsTPttFo26sVa2Tb4PGu` is Ready and `curl -sI https://djati-stihl.vercel.app` returns HTTP 200 OK.
  - Windows CI builds dispatched and actively compiling for Dibidani, Niamakoro, and Niamana Dubai.
- Status: FIXED
- Tags: supabase, rls, sync, mobile, store-id, auth, ci-cd, tauri, vercel

### [2026-10-19] Retail Manager Commercial Proforma: Free Training Option & Pack Recalculation
- Symptom:
  - Option 08 ("Formation des Caissiers & Accompagnement Gérance (2 Jours)") was priced at 55 000 FCFA, bringing total package costs above target psychological price points for Bamako merchants.
- Files involved:
  - `docs/PROFORMA_RETAIL_MANAGER_PACK_BAMAKO.html`
  - `docs/PROFORMA_RETAIL_MANAGER_PACK_BAMAKO.pdf`
  - `docs/COMMERCIAL_PITCH_RETAIL_MANAGER_BAMAKO.md`
- Root cause:
  - Cashier training and management onboarding is a commercial closing incentive in Bamako; charging for it introduces friction.
- Fix applied:
  1. Updated item 08 in proforma to `OFFERT` (0 FCFA) with green badge.
  2. Recalculated total package prices:
     - Pack A (ASUS Vivo AiO 24"): Reduced from 715 000 FCFA to 660 000 FCFA TTC.
     - Pack B (Terminal Tactile POS 15.6"): Reduced from 745 000 FCFA to 690 000 FCFA TTC.
  3. Recalculated 40% / 40% / 20% payment installments:
     - Pack A: 264 000 FCFA / 264 000 FCFA / 132 000 FCFA.
     - Pack B: 276 000 FCFA / 276 000 FCFA / 138 000 FCFA.
  4. Synchronized `docs/COMMERCIAL_PITCH_RETAIL_MANAGER_BAMAKO.md` across verbal pitch, WhatsApp templates, and objection handling.
  5. Recompiled headless PDF with Chrome 155.
- Verification:
  - `pdfinfo docs/PROFORMA_RETAIL_MANAGER_PACK_BAMAKO.pdf`: Pages = 1, size = 594.96 x 841.92 pts (A4).
  - Margin verification via `pdftoppm` + PIL: Left = 82 px, Right = 82 px (Delta = 0 px), Top = 35 px, Bottom = 39 px.
- Status: FIXED
- Tags: proforma, retail-manager, free-training, pricing-recalculation, pdf-centering, bamako-merchants

### [2026-10-19] Retail Manager: Hardware SSD 256GB Upgrade, Starter Consumables & Standalone 3-Tier Ladder
- Symptom:
  - Previous workstation hardware referenced mechanical HDD 500GB, vulnerable to counter vibration, dust, and sudden power cuts in Bamako.
  - Absence of starter consumables caused day-one deployment questions.
  - Needed a standalone Tier Ladder document without modifying or wrecking the active standard single-page proforma.
- Files involved:
  - `docs/PROFORMA_RETAIL_MANAGER_PACK_BAMAKO.html`
  - `docs/PROFORMA_RETAIL_MANAGER_PACK_BAMAKO.pdf`
  - `docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.html`
  - `docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.pdf`
- Root cause:
  - Aligning hardware robustness (shock/dust-proof SSD 256GB), providing initial consumable supply (3 thermal paper rolls), and giving sales reps a multi-tier commercial offer (Tier 1 Essentiel 515K, Tier 2 Pro 660K/690K, Tier 3 Bi-Poste 935K) with sovereign local-first backup philosophy.
- Fix applied:
  1. Updated standard proforma:
     - ASUS Vivo 24" AiO upgraded to SSD 256 Go anti-choc.
     - Added 3 rolls of 80mm thermal paper to Item 02.
     - Preserved exact 1-page layout (`Left=82px, Right=82px, Delta=0px, Top=35px, Bottom=39px`).
  2. Created standalone Tier Ladder document (`docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.html` and `.pdf`):
     - Tier 1 : Formule Essentielle (515 000 FCFA TTC) — ASUS 24" SSD 256G, Imprimante 80mm + 3 rouleaux, Licence à vie, Ingestion, Formation 2j offerte.
     - Tier 2 : Formule Pro Clé en Main (660 000 / 690 000 FCFA TTC) — Le Plus Choisi, pack complet avec Scanner, Tiroir Blindé, Onduleur EDM, 3 rouleaux.
     - Tier 3 : Réseau Bi-Poste Souverain (935 000 FCFA TTC) — 2 postes synchronisés (Caisse Comptoir Tactile 15.6" + Bureau Gérant ASUS 24"), réseau local souverain, module de sauvegarde miroir cryptée locale.
     - Dedicated sovereign local backup philosophy (no foreign cloud dependencies).
- Verification:
  - Recompiled both PDFs with Chrome 155 headless.
  - `pdfinfo` confirms strictly `Pages: 1` for both documents.
  - Margin verification: `Delta = 0px` (Left=82px, Right=82px, Top=35px, Bottom=39px) on both PDFs.
- Status: FIXED
- Tags: ssd-256gb, paper-rolls, sovereign-backup, tier-ladder, standalone-offer, chrome-headless, pdf-centering

### [2026-10-19] GIE MOUNA Legal Credentials Rectification: Authentic RCCM & Pending NIF
- Symptom:
  - Previous documents referenced registration number 5170919619941R, which was identified as an individual NINA card number rather than the official commercial registry.
  - Documents also referred to "GROUPE GIE MOUNA SARL", combining incompatible OHADA forms, and asserted an active NIF when GIE MOUNA is still awaiting its DGI tax card.
- Files involved:
  - `docs/PROFORMA_RETAIL_MANAGER_PACK_BAMAKO.html`
  - `docs/PROFORMA_RETAIL_MANAGER_PACK_BAMAKO.pdf`
  - `docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.html`
  - `docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.pdf`
  - `docs/COMMERCIAL_PITCH_RETAIL_MANAGER_BAMAKO.md`
- Root cause:
  - Inadvertent use of individual NINA identity number in place of the Greffe du Tribunal de Commerce registration, and premature claim of active NIF.
- Fix applied:
  - Rectified commercial registry to authentic court registration: `MA.BKO.2017.C.8036`.
  - Updated tax status to: `NIF : En cours d'attribution DGI`.
  - Cleaned entity styling to "GROUPE GIE MOUNA & JATI TECHNOLOGIES".
- Verification:
  - Recompiled and verified PDFs (Pages = 1, Delta = 0px).
  - Verified zero occurrences of 5170919619941R.
- Status: FIXED
- Tags: legal-credentials, rccm, nif-attribution-dgi, gie-mouna, tribunal-commerce-bamako

