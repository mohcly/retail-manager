import { test, expect } from '@playwright/test';
import { loginAsWorker } from './helpers';

/**
 * Regression coverage for the "print shows a red screen" bug (fixed in
 * commit 0e7c70e: InvoiceDetailsDialog called date-fns `format()` on
 * `sale.created_at` without a guard, crashing to the global ErrorBoundary).
 *
 * Scope note: steps 5/6 of the original request (deleting a saved
 * proforma from the UI, and confirming a paid sale shows no delete button)
 * are NOT exercised here. EditionModuleMain's "suivi-ventes-factures" tab -
 * where that delete button now lives - is only reachable for a worker
 * account whose `subRole` resolves to 'cook' | 'cashier' | 'waiter'. On
 * local-bridge, that resolution falls through to `user_metadata.sub_role`,
 * which only exists on cloud-provisioned accounts; the offline seed script
 * only creates a 'master' user, and ProformaList isn't wired into
 * App.tsx's router. Exercising the delete-button UI end-to-end needs one
 * of those two gaps closed first - tracked, not fixed, in this change.
 * The backend permission rule itself (worker role may delete only
 * proforma/pending-zero-paid sales) is enforced server-side regardless.
 */
test('cashier can add items, save a proforma, and print without the red error screen', async ({ page }) => {
  await loginAsWorker(page);

  // Land on the retail sales grid (vente-detail), not the restaurant table view.
  await expect(page.locator('#designation-input-0')).toBeVisible({ timeout: 15_000 });

  // handleSaveProforma only accepts lines with a real productId
  // (free-typed designation text alone is filtered out as invalid), so a
  // real seeded product must be picked via the product lookup dialog.
  await page.getByRole('button', { name: 'Rechercher' }).click();
  const searchBox = page.getByPlaceholder('Rechercher');
  await expect(searchBox).toBeVisible();
  await searchBox.fill('Riz');
  await page.waitForTimeout(800);
  await searchBox.press('Enter');

  await expect(page.locator('#designation-input-0')).toHaveValue(/Riz/, { timeout: 10_000 });

  // F10 = save as proforma/draft.
  await page.getByRole('button', { name: /F10/ }).click();
  await expect(page.getByText('Brouillon enregistré avec succès')).toBeVisible({ timeout: 10_000 });

  // F9 = print thermal ticket. This is the exact action the user reported
  // as crashing to a red screen.
  await page.getByRole('button', { name: /F9/ }).click();
  await page.waitForTimeout(1500);

  await expect(page.getByText('Une erreur est survenue')).not.toBeVisible();
});
