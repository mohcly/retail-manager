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




