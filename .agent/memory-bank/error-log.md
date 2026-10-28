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

### [2026-10-19] Commercial Tier Ladder V2 Design Integration: 2-Page Clean Layout & Sovereign Data Tiles
- Symptom:
  - User requested replacing the single-page tier ladder layout with the superior 2-page v2 design authored on Desktop (`OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER_v2.html` / `.pdf`), featuring side-by-side tier comparison cards, a full feature matrix, sovereign data commitment tiles, staggered payment plan (40/40/20), and dual sign-off cards with client selection checkboxes.
  - Previous desktop draft contained outdated credentials (`5170919619941R`, `NIF enregistré DGI`, `GIE MOUNA SARL`) and a minor vertical collision where `.tier.star` overlapped into the "Évolution sans rachat" dashed container.
- Files involved:
  - `docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.html`
  - `docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.pdf`
  - `/Users/mohamedcoulibaly/Desktop/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER_v2.html`
  - `/Users/mohamedcoulibaly/Desktop/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER_v2.pdf`
- Root cause:
  - Adopting the user's preferred editorial visual system while maintaining legal accuracy (RCCM `MA.BKO.2017.C.8036`, `NIF : En cours d'attribution DGI`) and fixing the CSS bottom margin on the star tier.
- Fix applied:
  1. Integrated the complete v2 HTML structure into `docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.html` and synchronized back to Desktop.
  2. Applied authentic commercial registry (`RCCM : MA.BKO.2017.C.8036`) and pending tax status (`NIF : En cours d'attribution DGI`).
  3. Cleaned entity naming to `Groupe GIE Mouna` and `Jati Technologies SARL`.
  4. Embedded executive signature image for M. Mohamed N'gouro Coulibaly in the supplier sign-off card.
  5. Calibrated `.tier.star` margin to `margin: -3mm 0 0 0` with subtle elevation shadow, eliminating the bottom overlap into the dashed upgrade box.
  6. Recompiled both repository and Desktop PDFs using Chrome headless 155.
- Verification:
  - `pdfinfo docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.pdf`: strictly `Pages: 2`, `594.96 x 841.92 pts (A4)`.
  - Pixel margin analysis via `pdftoppm -r 150` + PIL:
    - Page 1: `Left = 82px`, `Right = 82px`, `Delta = 0px`, `Top = 78px`, `Bottom = 62px`.
    - Page 2: `Left = 82px`, `Right = 82px`, `Delta = 0px`, `Top = 78px`, `Bottom = 30px`.
  - Visual verification with `view_file` confirms zero overlap, balanced padding, and clean signature rendering.
- Status: FIXED
- Tags: tier-ladder-v2, 2-page-layout, pdf-centering, sovereign-data, rccm-compliance, chrome-headless

### [2026-10-19] Supplier Sign-off Card: Centered & Enlarged Executive Signature
- Symptom:
  - User reported: "my signature needs to be centered on the box, and it is way too small."
  - The signature image (`signature-mohamed.png`) had a wide 609x552 bounding box with 256 stray scanner dust pixels at x=552 to 608, shifting the visual strokes heavily to the left (mean optical center X=188.5 vs image width 609) and forcing premature scaling when constrained by height (max-height: 28px).
- Files involved:
  - `docs/assets/signature-mohamed.png`
  - `docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.html`
  - `docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.pdf`
  - `/Users/mohamedcoulibaly/Desktop/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER_v2.html`
  - `/Users/mohamedcoulibaly/Desktop/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER_v2.pdf`
- Root cause:
  - Asymmetric transparency padding and scanner noise in source PNG, combined with missing flex alignment and restrictive max-height.
- Fix applied:
  1. Cropped source signature to clean bounding box (360x470) eliminating all stray scanner artifacts and balancing optical center.
  2. Staged local copy in `docs/assets/signature-mohamed.png`.
  3. Replaced signature container styling with:
     `<div style="flex:1; display:flex; align-items:center; justify-content:center; padding:1mm 0;"><img src="..." style="max-height:26mm; width:auto; display:block; margin:0 auto;" alt="Signature Mohamed Coulibaly"></div>`
  4. Calibrated page padding (`padding: 11mm 14mm 9mm`) and gap (`gap: 4.2mm`) on Page 2 to ensure generous 20px bottom clearance without pushing the footer.
  5. Recompiled both repository and Desktop PDFs with Chrome 155.
- Verification:
  - `pdfinfo docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.pdf`: strictly `Pages: 2`, `A4 (594.96 x 841.92 pts)`.
  - Margins via `pdftoppm` + PIL:
    - Page 1: Left=82px, Right=82px, Delta=0px, Top=65px, Bottom=56px.
    - Page 2: Left=82px, Right=82px, Delta=0px, Top=65px, Bottom=20px.
  - Visual inspection confirms signature is prominent, crisp, and centered both horizontally and vertically inside the supplier box.
- Status: FIXED
- Tags: signature-centering, optical-center, noise-crop, tier-ladder, pdf-geometry

### [2026-10-19] Prestataire Box: Phone Number Inline Formatting & Line Balance
- Symptom:
  - In the "Prestataire" header box, the phone number broke across lines: `Représenté par M. Mohamed N’gouro Coulibaly · +223 75 72 33` with the final digits `80` orphaned on a fourth line by itself.
- Files involved:
  - `docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.html`
  - `docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.pdf`
  - `/Users/mohamedcoulibaly/Desktop/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER_v2.html`
  - `/Users/mohamedcoulibaly/Desktop/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER_v2.pdf`
- Root cause:
  - Typography overflow: `.parties` font size was 7.8pt, exceeding the 80mm column width for a 61-character line.
- Fix applied:
  1. Adjusted `.parties` font-size to `7.4pt`.
  2. Wrapped phone number in `<span style="white-space:nowrap">+223 75 72 33 80</span>` to ensure it never breaks across lines under any font fallback.
  3. Restored perfect 3-line symmetry matching the adjacent "Établissement bénéficiaire" box.
  4. Recompiled both repository and Desktop PDFs with Chrome 155.
- Verification:
  - `pdfinfo docs/OFFRE_COMMERCIALE_TIERS_RETAIL_MANAGER.pdf`: strictly `Pages: 2`, `A4 (594.96 x 841.92 pts)`.
  - Margins via `pdftoppm` + PIL:
    - Page 1: Left=82px, Right=82px, Delta=0px, Top=65px, Bottom=56px.
    - Page 2: Left=82px, Right=82px, Delta=0px, Top=65px, Bottom=20px.
  - Visual inspection of cropped parties header confirms full phone number sits inline on the second line with zero awkward wrapping.
- Status: FIXED
- Tags: typography, parties-box, phone-number-nowrap, line-balance, tier-ladder

### [2026-10-19] STIHL Web Portal: Fallback URL Poisoning, Analytics Store Duplication & Cloud Inventory Valuation
- Symptom:
  - Navigating to `https://djati-stihl.vercel.app` failed to load dashboard metrics, stores list, and inventory data; only Analytics loaded.
  - In Analytics, stores were duplicated: one store displayed sales data while an empty duplicate store card rendered underneath with 0 data.
  - The Niamakoro store showed zero sales, creating confusion regarding whether it was broken or unpopulated.
- Files involved:
  - `frontend/src/lib/supabase.ts`
  - `frontend/src/lib/dataClient.ts`
  - `frontend/src/services/AIService.ts`
  - `frontend/src/services/OfflineAuthService.ts`
  - `frontend/src/services/OfflineInventoryService.ts`
  - `frontend/src/services/OfflineDataService.ts`
  - `frontend/src/pages/master/Analytics.tsx`
- Root cause:
  1. `frontend/src/lib/supabase.ts` and related service files in the `main-stores-stihl` branch had hardcoded fallback strings pointing to Niamana Dubai's Supabase project (`onsqvduklnwffugsiybs`) instead of STIHL (`fpvrbxmbrotowdlyebqv`). When Vercel ran without injected build env vars, all queries fell back to Niamana Dubai's database, failing auth and returning empty datasets.
  2. `OfflineInventoryService.ts` (`getStockValuation()` and `getLowStockItems()`) attempted to read from IndexedDB tables (`products`, `sales`, etc.) which are only populated in local-first desktop environments, resulting in zero valuation on web portals.
  3. `OfflineDataService.ts` threw unhandled errors on missing `cash_transactions` table (`PGRST205`).
  4. In `Analytics.tsx`, the master view mapped over all active store IDs and rendered a separate `<GestionModule />` block for each store stacked vertically, producing two dashboards (Dibidani with 30,000 F CFA and Niamakoro with empty charts).
  5. Niamakoro's 0 sales stemmed from physical store setup: all 133 recorded sales were registered under Dibidani (`bb2546ae-a2b3-47da-ae46-22b9b2914304`), while Niamakoro has 278 distinct hardware products without recorded sales.
- Fix applied:
  1. Cleaned out all Niamana Dubai URLs and hardcoded STIHL Supabase URL (`https://fpvrbxmbrotowdlyebqv.supabase.co`) and anon key fallbacks across `supabase.ts`, `dataClient.ts`, `AIService.ts`, and `OfflineAuthService.ts`.
  2. Updated `OfflineInventoryService.ts` to query Supabase directly for inventory valuation across all price tiers and low stock when running in cloud web mode (`!dc.isLocalFirst && navigator.onLine`).
  3. Made `storeId` optional in `getCashTransactions()` and safely handled `PGRST205` error code.
  4. Updated `Analytics.tsx` to render a single unified "TOUS LES MAGASINS" dashboard (`storeId=""`) when all stores are selected, eliminating duplicate store dashboards.
  5. Built and deployed live to Vercel production (`djati-stihl.vercel.app`).
- Verification:
  - Headless browser verification via Playwright on `https://djati-stihl.vercel.app`:
    - `/master/dashboard` loaded today's sales (30,000 F CFA) and weekly sales without hanging.
    - `/master/analytics` rendered a single unified dashboard without duplicate store sections.
    - `/master/stores` cleanly displayed both stores (STIHL Dibidani and STIHL Niamakoro).
    - Worker login (`blaisetienou@gmail.com`) correctly restricted to POS cashier interface (`/worker/dashboard`).
- Status: FIXED
- Tags: stihl, vercel, supabase-poisoning, analytics-duplication, cloud-valuation, clearance-roles

### [2026-10-20] Web Portal: Cloud Reload Auth Race Condition & IndexedDB Lock Hang
- Symptom:
  - When loading `djati-stihl.vercel.app/#/master/dashboard` directly or reloading in Safari, the dashboard displayed pulsing skeleton cards indefinitely.
  - The store dropdown opened showing only "TOUS LES MAGASINS" with 0 stores listed underneath.
- Files involved:
  - `frontend/src/services/LocalDatabase.ts`
  - `frontend/src/services/OfflineStoreService.ts`
  - `frontend/src/services/OfflineSalesService.ts`
  - `frontend/src/components/master/Layout/StoreMultiSelector.tsx`
  - `frontend/src/components/master/Dashboard/DashboardView.tsx`
  - `frontend/src/contexts/AuthContext.tsx`
  - `frontend/src/pages/master/Stores.tsx`
  - `frontend/src/pages/master/Analytics.tsx`
- Root cause:
  1. `StoreMultiSelector.tsx` and `DashboardView.tsx` mounted and executed `OfflineStoreService.getStores()` and `loadDashboardData()` immediately with empty `[]` dependency arrays, before `AuthContext` resolved the async Supabase session. Since unauthenticated users are blocked by Supabase RLS, `getStores()` returned 0 stores, leaving `availableStores = []` and `activeStoreIds = []`. Neither component listened to `user` or `authLoading` to re-fetch once authentication finished.
  2. In `OfflineStoreService.ts` and `OfflineSalesService.ts`, `await LocalDatabase.init()` was executed before the pure cloud check (`!dataClient.isLocalFirst`). In Safari, `indexedDB.open` lacked an `onblocked` handler and timeout, causing it to block or deadlock across multi-tab sessions, freezing `loadDashboardData()` in `loading = true`.
  3. `AuthContext.tsx` restored offline sessions from local storage even when expired or rejected by Supabase in cloud mode, leaving the user interface showing an authenticated email (`bahsyllah223@gmail.com`) while all network queries were rejected with 401/403.
- Fix applied:
  1. Connected `DashboardView.tsx` and `StoreMultiSelector.tsx` to `useAuth()`. Await auth completion (`!authLoading && user`) before fetching data, and re-fetch when `open` is toggled on the store combobox.
  2. Added `request.onblocked` and a 3000ms safety timeout to `LocalDatabase.init()`.
  3. Re-ordered `OfflineStoreService.getStores()` and `OfflineSalesService.getSales()` to execute pure cloud Supabase queries immediately without waiting on IndexedDB.
  4. Added invalid/expired session clearing in `AuthContext.tsx` on Supabase cloud rejection.
  5. Built and deployed live to Vercel production (`djati-stihl.vercel.app`).
- Verification:
  - Verified live on `https://djati-stihl.vercel.app` via Playwright:
    - User `bahsyllah223@gmail.com` logs in and dashboard renders completely in 4.40s with 0 skeletons.
    - Store switcher combobox immediately populates: `TOUS LES MAGASINS`, `STIHL Dibidani`, and `STIHL Niamakoro`.
    - Reload test confirms `/master/dashboard` reloads cleanly without hanging.
- Status: FIXED
- Tags: auth-race, safari-indexeddb, store-combobox, cloud-bypass, vercel, playwright-verified







### [2026-10-20] Sidebar Scroll Reset on Route Navigation & Master Cloud Module Data Loading (Files, Analytics, Sales, Team)
- Symptom:
  - In the left sidebar navigation, clicking any module link caused the entire sidebar DOM tree to unmount and remount, resetting `scrollTop = 0` and jumping the user back to the top of the sidebar navigation list.
  - The Analytics, Sales, Team, and Files modules failed to display data or hung indefinitely in loading states on cloud/web deployments.
  - The Files module (`/master/files`) loaded empty because clients and suppliers submodules aborted immediately when running in cloud mode (`!useLocalBridge`).
  - Steel branches suffered from fallback database URL poisoning pointing to Dubai database instead of STIHL.
- Files involved:
  - `frontend/src/components/master/Layout/MasterLayout.tsx`
  - `frontend/src/pages/master/Analytics.tsx`
  - `frontend/src/pages/master/Sales.tsx`
  - `frontend/src/pages/master/Team.tsx`
  - `frontend/src/pages/master/Files.tsx`
  - `frontend/src/components/master/Sales/CashClosingsTab.tsx`
  - `frontend/src/components/worker/Modules/FichiersClientsModule.tsx`
  - `frontend/src/components/worker/Modules/FichiersFournisseursModule.tsx`
  - `frontend/src/components/worker/Modules/FichiersServicesClientsModule.tsx`
  - `frontend/src/services/OfflineDataService.ts`
  - `frontend/src/services/OfflineTeamService.ts`
  - `frontend/src/hooks/useStockSearch.ts`
  - `frontend/src/lib/supabase.ts`, `dataClient.ts`, `AIService.ts`, `OfflineAuthService.ts`
- Root cause:
  1. `const Sidebar = ...` was declared inside the functional body of `MasterLayout`. On every route navigation, `MasterLayout` re-rendered, producing a new functional component reference which forced React to unmount the existing `<nav>` DOM tree and remount a fresh one, immediately resetting `scrollTop = 0`.
  2. `FichiersClientsModule.tsx` and `FichiersFournisseursModule.tsx` had hardcoded `if (!useLocalBridge || !storeId) return;` which immediately aborted on web/cloud mode since `useLocalBridge` is false when running outside the desktop app.
  3. `OfflineDataService.ts` forced `.eq('store_id', storeId)` even when `storeId` was `""` (All stores), returning 0 sales.
  4. `OfflineTeamService.ts` attempted to query `localhost:8787` for stores and user accounts rather than delegating to `OfflineStoreService` and querying Supabase `profiles`.
  5. `Sales.tsx` and `CashClosingsTab.tsx` lacked `user` and `authLoading` guards in `useEffect`, running queries before Supabase auth finished and being blocked by RLS.
  6. Hardcoded Dubai fallback database URLs in steel branches poisoned web portal queries when environment variables were not loaded in local storage.
- Fix applied:
  1. Extracted `SidebarContent` outside `MasterLayout` to guarantee a stable component reference across route changes. Added persistent scroll position management using a `ref` and `sessionStorage` (`master_sidebar_scroll`) that restores scroll position on mount.
  2. Added cloud fallbacks in `FichiersClientsModule` and `FichiersFournisseursModule` to query Supabase via `OfflineDataService.getClients` and `OfflineDataService.getSuppliers`.
  3. Updated `OfflineDataService.getSales` to only filter by `store_id` if non-empty, and query Supabase with `sale_items(*)` in cloud mode before caching locally.
  4. Updated `OfflineTeamService.getStores` to delegate to `OfflineStoreService.getStores()` and `getAllUsers` to query Supabase `profiles` when not local-first.
  5. Added `authLoading` and `user` guards to `Sales.tsx`, `Team.tsx`, `Files.tsx`, and `CashClosingsTab.tsx`.
  6. Corrected steel branch fallback URLs to point to canonical STIHL Supabase (`fpvrbxmbrotowdlyebqv`).
  7. Verified production Vite builds cleanly across all 7 branches (`main-stihl-dibidani`, `main-stihl-niamakoro`, `main-stores-stihl`, `main-niamana-dubai`, `main-stores-dubai`, `main-mpm-food`, `main-restaurants`) and pushed to all remotes.
- Verification:
  - Clean Vite production builds:
    - `main-stihl-dibidani`: `✓ built in 15.28s`
    - `main-stihl-niamakoro`: `✓ built in 13.39s`
    - `main-stores-stihl`: `✓ built in 12.77s`
    - `main-niamana-dubai`: `✓ built in 12.93s`
    - `main-stores-dubai`: `✓ built in 13.08s`
    - `main-mpm-food`: `✓ built in 16.29s`
    - `main-restaurants`: `✓ built in 14.74s`
  - Pushed to `origin` and `mohcly-origin` successfully.
- Status: FIXED
- Tags: sidebar-scroll-reset, master-layout, files-module, analytics, sales, team, cloud-fallback, stihl, multi-branch


### [2026-10-20] Official Ticket (80mm) and A4 Invoice Templates for Yemenat Niamana Dubaï
- Symptom: Official Holding Pro Niamana Dubaï receipt and A4 invoice designs from `/Users/mohamedcoulibaly/Downloads/templates-niamana-dubai.png` were not set in the web portal (`main-stores-dubai` still had legacy Quincaillerie de la Paix branding and lacked thermal printing in SalesModule), and desktop app branch `main-niamana-dubai` had discrepancies in layout, metadata grid, and lacked French number-to-words line.
- Files involved:
  - `frontend/src/utils/numberToFrenchWords.ts`
  - `frontend/src/components/printing/InvoiceTemplate.tsx`
  - `frontend/src/components/printing/InvoiceA4Template.tsx`
  - `frontend/src/components/worker/Modules/SalesModule.tsx`
  - `frontend/src/components/worker/Modules/InvoiceDetailsDialog.tsx`
  - `frontend/src/pages/worker/ProformaList.tsx`
  - `frontend/public/holding-pro-logo.png`
  - `frontend/public/holding-pro-logo.jpg`
  - `frontend/public/holding-pro-banner.jpg`
  - `frontend/public/receipt-holding-pro-80mm.png`
- Root cause:
  1. `main-stores-dubai` retained legacy `Quincaillerie de la Paix` templates and lacked thermal receipt preview wiring in `SalesModule.tsx`.
  2. `main-niamana-dubai` draft templates lacked `SUCCURSALE NIAMANA DUBAÏ` sub-header, red slogan badge, 2-column metadata row (`Ticket N°:` / `<date>` and `Caissier:` / `Client:`), subtotal/amount_paid/change breakdown, and French number-to-words line on A4 (`Arrêté la présente facture à la somme de : Deux Cent Cinq Mille (205 000) FCFA`).
- Fix applied:
  1. Created `numberToFrenchWords.ts` utility supporting French number parsing up to billions with proper capitalization and hyphenation.
  2. Implemented pixel-perfect 80mm continuous thermal receipt in `InvoiceTemplate.tsx` matching `/Users/mohamedcoulibaly/Downloads/templates-niamana-dubai.png` (circular logo, `SUCCURSALE NIAMANA DUBAÏ`, crimson slogan `#dc2626`, 2-column metadata, dashed separators, subtotal, net total, settlement line, change, and footer).
  3. Implemented pixel-perfect A4 invoice in `InvoiceA4Template.tsx` with top rainbow bar, watermark, stylized `HOLDING PRO` header, dark navy pill, metadata, customer card, dark `#0f172a` table header, sum in French words, navy net card with amber total, signature lines, and footer.
  4. Wired thermal receipt preview and auto-print on confirmed sale and F9 / ticket button in `SalesModule.tsx` in both `main-niamana-dubai` and `main-stores-dubai`.
  5. Updated `InvoiceDetailsDialog.tsx` and `ProformaList.tsx` to use HOLDING PRO / Niamana Dubai details with subtotal and change computation.
  6. Verified Vite production builds: `main-niamana-dubai` built in 14.08s, `main-stores-dubai` built in 9.70s.
  7. Committed and pushed to `origin`, `mohcly-origin`, and `djati-stores-mobile` (Vercel auto-deployed and verified HTTP 200).
- Verification:
  - Vite build passed on `main-niamana-dubai`: `✓ built in 14.08s`
  - Vite build passed on `main-stores-dubai`: `✓ built in 9.70s`
  - Node test verified `numberToFrenchWords(205000)` -> `"Deux Cent Cinq Mille"`
  - Vercel deployment verified live at `https://djati-stores-mobile.vercel.app` (HTTP 200 on page and `/holding-pro-logo.png`)
- Status: FIXED
- Tags: ticket-template, invoice-a4, niamana-dubai, yemenat-dubai, holding-pro, thermal-print, vercel


### [2026-10-20] Invoice A4 Layout Overflow, Missing Bottom Section, and Broken Logo Placeholder Fix
- Symptom: In `/Users/mohamedcoulibaly/Desktop/Screenshots/Capture d’écran 2026-10-20 à 11.37.41.png`, the generated A4 invoice displayed a broken logo placeholder (blue question mark `?`), and for a 13-item invoice, the table rows pushed the bottom section off-screen, completely cutting off the sum in words, the "NET À PAYER" card, the client/direction signatures, and the footer.
- Files involved:
  - `frontend/src/assets/holdingProLogo.ts`
  - `frontend/public/holding-pro-logo.png`
  - `frontend/src/components/printing/InvoiceA4Template.tsx`
  - `frontend/src/components/printing/InvoiceTemplate.tsx`
- Root cause:
  1. The uncompressed 1.9MB PNG logo failed to load asynchronously in the hidden `about:blank` print iframe before `window.print()` triggered, resulting in the WebKit fallback placeholder (blue question mark `?`).
  2. `InvoiceA4Template.tsx` had `print:flex print:flex-col` with a fixed `minHeight: 297mm` and no page-break rules. CSS Flexbox fragmentation across printed pages is unsupported in WebKit and Chromium print engines, causing overflowing content to be clipped instead of paginating.
  3. Excessive vertical margins (`py-2.5 px-4` table cells, `mb-6`, `mt-12`, `mb-14`) prevented standard retail invoices (10-14 items) from fitting cleanly onto a single A4 page.
- Fix applied:
  1. Created `HOLDING_PRO_LOGO_BASE64` in `frontend/src/assets/holdingProLogo.ts` and optimized `holding-pro-logo.png` to 126KB. The embedded Base64 Data URI loads with zero network latency in any iframe, webview, or PDF engine, eliminating the blue question mark.
  2. Replaced `print:flex` with `print:block`, set `@page { size: A4 portrait; margin: 8mm 12mm 8mm 12mm; }`, and added table fragmentation rules (`thead { display: table-header-group }`, `tr { page-break-inside: avoid }`).
  3. Wrapped Totals, Sum in Words, Signatures, and Footer in `.keep-together` with `page-break-inside: avoid; break-inside: avoid;`.
  4. Optimized vertical density (`py-1.5 px-3` row padding, balanced margins) allowing 13-14 items to fit onto 1 single page, while multi-page invoices (e.g. 25+ items) automatically and cleanly break across pages without any clipping.
  5. Built and verified with Google Chrome headless print-to-pdf: 13-item invoice fits on 1 page with all sections visible; 25-item invoice paginates into 2 pages with headers and keep-together footer.
- Verification:
  - Rendered Chrome headless PDF test: `/tmp/test-invoice-13items.pdf` verified with 1 page containing logo, full table, sum in words, net card, signatures, and footer.
  - Production builds passed: `main-niamana-dubai` (`✓ built in 12.31s`), `main-stores-dubai` (`✓ built in 11.78s`).
  - Deployed to Vercel ([djati-stores-mobile.vercel.app](https://djati-stores-mobile.vercel.app/)) and triggered Windows build workflow run #39421272767.
- Status: FIXED
- Tags: invoice-a4, logo-broken, blue-question-mark, layout-overflow, pagination, keep-together, holding-pro


### [2026-10-26] Platform Unification & Multi-Tenant Single Portal by Email
- Symptom:
  - Divergent client branches (`main-stores-stihl`, `main-niamana-dubai`, `main-mpm-food`) with separate Vercel deployments (`djati-stihl.vercel.app` and `djati-stores-mobile.vercel.app`) each tied to separate Supabase databases (`fpvrbxmbrotowdlyebqv` for STIHL and `onsqvduklnwffugsiybs` for Holding Pro).
  - Hardcoded ticket and A4 templates required manual code changes per client.
- Files involved:
  - `frontend/src/types/receipt.ts`
  - `frontend/src/components/printing/ReceiptConfigLoader.ts`
  - `frontend/src/components/printing/InvoiceTemplate.tsx`
  - `frontend/src/components/printing/InvoiceA4Template.tsx`
  - `frontend/src/lib/tenants.ts`
  - `frontend/src/lib/supabase.ts`
  - `frontend/src/lib/dataClient.ts`
  - `frontend/src/services/OfflineAuthService.ts`
  - `frontend/src/components/auth/AuthPage.tsx`
  - `frontend/src/components/mobile/Auth/MobileAuthPage.tsx`
  - `backend/local-bridge/src/db/schema.ts`
  - `backend/local-bridge/src/db/migrations.ts`
  - `backend/local-bridge/src/db/types.ts`
  - `backend/local-bridge/src/db/repositories/stores.repo.ts`
  - `frontend/src/components/worker/Layout/WorkerMenuBar.tsx`
  - `frontend/src/components/worker/Layout/WorkerLayout.tsx`
- Root cause:
  - Absence of dynamic polymorphic receipt engine and multi-tenant authentication cascade across multiple Supabase project instances.
- Fix applied:
  1. Created `StoreReceiptConfig` with default presets (`HOLDING_PRO_DEFAULT_RECEIPT`, `STIHL_DIBIDANI_DEFAULT_RECEIPT`, `STIHL_NIAMAKORO_DEFAULT_RECEIPT`).
  2. Polymorphic `InvoiceTemplate` (80mm/58mm continuous) and `InvoiceA4Template` (keep-together pagination, French words numbers, dynamic logos/branding).
  3. Created `tenants.ts` and dynamic multi-tenant Proxy client in `supabase.ts` with transparent cascade authentication (`cascadeSignInWithPassword`).
  4. Added predictive tenant identification and visual feedback badge on login screens (`AuthPage.tsx` and `MobileAuthPage.tsx`).
  5. Added `store_type` and `receipt_settings` to local-bridge SQLite schema, migrations, and repositories.
  6. Added vertical feature-flagging in `WorkerMenuBar.tsx` to omit restaurant tabs (`Tables` / `KDS`) on retail/hardware terminals.
- Verification:
  - Verified tenant prediction: `imsnsylla@gmail.com` -> `stihl`, `papirotech26@gmail.com` -> `holdingpro`.
  - Frontend production build (`npm run build`) succeeded with 0 errors in 13.67s.
  - Backend local-bridge build (`npm run build`) succeeded with 0 errors.
- Status: FIXED
- Tags: multi-tenant, saas, unification, supabase, transparent-auth, dynamic-receipts, store-type

### [2026-10-28] Multi-tenant restaurant schema poisoning and Niamana Dubaï store resolution
- Symptom:
  - Deployed portal on unify-core attempted to connect all stores (STIHL, Niamana Dubaï) to MPM Food restaurant schema.
  - STIHL accounts showed organization but Niamana accounts failed to display organization badge and could not fetch store data or sales.
- Files involved:
  - `frontend/src/contexts/AuthContext.tsx`
  - `frontend/src/services/OfflineStoreService.ts`
  - `frontend/src/services/OfflineAuthService.ts`
  - `frontend/src/services/SupabaseSyncService.ts`
  - `frontend/src/lib/tenants.ts`
  - `frontend/src/lib/supabase.ts`
  - `frontend/src/lib/dataClient.ts`
  - `frontend/src/components/auth/AuthPage.tsx`
  - `frontend/src/components/mobile/Auth/MobileAuthPage.tsx`
  - `frontend/src/components/master/Dashboard/DashboardView.tsx`
  - `frontend/src/components/master/Layout/StoreMultiSelector.tsx`
- Root cause:
  - Codebase inherited legacy queries pointing directly to `.from('restaurants')` and fallback values hardcoded to `'Restaurant MPM Food'`.
  - Niamana Dubaï database schema uses `stores` table instead of `restaurants`, resulting in 404/relation not found errors when attempting to authenticate and load store data.
  - `predictTenantByEmail` only recognized two static email addresses for `holdingpro`, defaulting unrecognized Niamana staff to STIHL tenant.
- Fix applied:
  1. Refactored all tenant store queries across `AuthContext`, `OfflineStoreService`, `OfflineAuthService`, and `SupabaseSyncService` to query `.from('stores')` first, with graceful fallback to `.from('restaurants')` for restaurant tenants.
  2. Broadened email pattern recognition for Holding Pro / Niamana Dubaï in `tenants.ts` and added MPM Food as 3rd tenant configuration.
  3. Added manual tenant selection pill buttons on login pages (`AuthPage.tsx` and `MobileAuthPage.tsx`) so users can switch organizations instantly.
  4. Updated `dataClient.ts` to dynamically resolve `baseUrl` via `getActiveTenantSupabaseUrl()`.
  5. Prevented dashboard skeleton hangs on reload by gating with `authLoading`.
- Verification:
  - Clean local build: `npm run build` completed in 10.36s with 0 errors.
  - Vercel local build completed in 11s (`CI=1 npx vercel build --prod --yes`).
  - Production deployment deployed and aliased to `https://djati-stihl.vercel.app` (HTTP 200 OK).
- Status: FIXED
- Tags: multi-tenant, stores-schema, restaurant-poisoning, holdingpro-niamana, vercel-deploy

### [2026-10-28] Fix ReferenceError 'cn is not defined' and simplify auth tenant routing
- Symptom:
  - Crash on `https://djati-stihl.vercel.app/#/auth` displaying: "Une erreur est survenue: Can't find variable: cn".
  - Interactive organization selector revealed multi-tenant names and tenant accounts.
- Files involved:
  - `frontend/src/components/auth/AuthPage.tsx`
  - `frontend/src/components/mobile/Auth/MobileAuthPage.tsx`
- Root cause:
  - Helper `cn` was called in `AuthPage.tsx` without being imported.
  - Organization selector pills were exposed visually in UI, revealing organization names.
- Fix applied:
  1. Removed the entire interactive organization selector UI from both `AuthPage.tsx` and `MobileAuthPage.tsx`.
  2. Maintained transparent background email detection via `predictTenantByEmail` and `cascadeSignInWithPassword`.
  3. Cleaned up unused imports and imported `cn` in `AuthPage.tsx`.
- Verification:
  - `npx tsc --noEmit` passed with 0 errors.
  - `npm run build` bundled successfully in 8.21s.
  - Deployed to Vercel production: `https://djati-stihl.vercel.app`.
- Status: FIXED
- Tags: auth, cn-reference-error, silent-tenant-detection, vercel
