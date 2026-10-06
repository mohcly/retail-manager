
### [2026-10-06] HOLDING PRO Niamana Dubai Receipt Branding and Thermal Print Pipeline
- Symptom: Thermal printing failed to produce output on physical POS receipt printers (stubbed command in Rust backend); receipt template used legacy Quincaillerie 800px A4 layout instead of 80mm continuous thermal receipt format, causing paper feeding and scaling issues; Niamana Dubai branch still retained Quincaillerie de la Paix header and contact details.
- Files involved:
  - frontend/src/components/printing/InvoiceTemplate.tsx
  - frontend/src/components/printing/InvoiceA4Template.tsx
  - frontend/src/components/worker/Modules/SalesModule.tsx
  - frontend/src/components/worker/Modules/InvoiceDetailsDialog.tsx
  - frontend/public/holding-pro-logo.jpg
  - frontend/public/holding-pro-banner.jpg
- Root cause:
  1. Print button (F9) called Tauri command `print_receipt` which was an empty stub returning Ok(true) without routing to winspool.
  2. `InvoiceTemplate` lacked `@page { size: 80mm auto; margin: 0; }` CSS and 74mm continuous column layout, triggering Windows driver letter/A4 defaults.
  3. Template files retained Quincaillerie de la Paix hardcoded fallbacks and logo instead of HOLDING PRO Niamana Dubai branding.
- Fix applied:
  1. Designed 80mm continuous thermal POS receipt in `InvoiceTemplate.tsx` with HOLDING PRO NIAMANA DUBAI branding, logo, contacts (+223 79 34 60 73 / 70 68 21 00 / 71 06 65 75), and slogan ("TOUJOURS CLIENT SATISFAIT").
  2. Updated `InvoiceA4Template.tsx` with HOLDING PRO NIAMANA DUBAI branding.
  3. Connected `handlePrint` and payment confirmation in `SalesModule.tsx` to `useReactToPrint({ contentRef: thermalPrintRef })` rendering `<InvoiceTemplate />` directly through Windows Print Spooler.
  4. Updated all fallback store names and addresses to HOLDING PRO / Niamana Dubai across all templates and dialogs.
- Verification: Local frontend build passed in 11.02s (`npm run build`), local-bridge compiled with 0 errors (`tsc -p tsconfig.json`), committed (2dbcd80) and pushed to `origin/main-niamana-dubai`, and GitHub Actions build workflow dispatched (run 37517298561).
- Status: FIXED
- Tags: printing, thermal-receipt, niamana-dubai, holding-pro, react-to-print, tauri
