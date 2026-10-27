import { Page } from '@playwright/test';

export const SEED_MASTER_EMAIL = 'master@offline.local';
export const SEED_MASTER_PASSWORD = 'Password123!';

/**
 * The local-bridge seed script only provisions a master account - there is
 * no "cashier" local role (sub_role is a cloud-only concept, see
 * WorkerLayout's subRole fallback). Every worker-layout screen the master
 * account reaches therefore renders in `subRole: 'waiter'` mode, whose
 * module whitelist is ['tables', 'vente-detail']. We force that module via
 * localStorage before navigation so tests land directly on the sales grid
 * instead of the restaurant table view.
 */
export async function loginAsWorker(page: Page, email: string = SEED_MASTER_EMAIL, password: string = SEED_MASTER_PASSWORD) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('worker_active_module', 'vente-detail');
    } catch {
      // ignore - private mode / blocked storage
    }
  });

  await page.goto('/');

  // First launch shows a license ActivationGate before the login form.
  const trialButton = page.getByRole('button', { name: /Continuer avec la Version d'Essai/i });
  if (await trialButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await trialButton.click();
  }

  // Trial gate, landing page, and a one-time ToS dialog can all interleave
  // in any order on a fresh profile - clear each until the login form shows.
  const emailField = page.getByLabel(/email/i);
  const startButton = page.getByRole('button', { name: /^Commencer$/i });
  const tosCheckbox = page.getByRole('checkbox', { name: /J'accepte les conditions/i });
  for (let i = 0; i < 5 && !(await emailField.isVisible().catch(() => false)); i++) {
    if (await tosCheckbox.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await tosCheckbox.click();
      await page.getByRole('button', { name: /CONFIRMER ET ACCÉDER/i }).click();
    } else if (await startButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await startButton.click();
    } else {
      await page.waitForTimeout(1_000);
    }
  }

  await emailField.fill(email);
  await page.getByLabel(/mot de passe|password/i).fill(password);
  await page.getByRole('button', { name: /se connecter|sign in/i }).click();
  // Login redirects master accounts to /master/dashboard - jump to the
  // unguarded worker test route to reach the actual sales grid instead.
  // The app uses a HashRouter, so the route lives after the '#'.
  await page.waitForURL(/#\/(master|worker)/, { timeout: 15_000 });
  await page.goto('/#/worker/test');
  await page.waitForLoadState('networkidle');
}
