import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  REGISTERED_TENANTS,
  TenantConfig,
  detectInitialTenantId,
  predictTenantByEmail
} from './tenants';

const STORAGE_KEY = 'djati_active_tenant';

// Map of instantiated Supabase clients per tenant
const clientMap = new Map<string, SupabaseClient>();

function getOrCreateClient(config: TenantConfig): SupabaseClient {
  let client = clientMap.get(config.id);
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: `sb-${config.id}-auth-token`,
      },
    });
    clientMap.set(config.id, client);
  }
  return client;
}

// Pre-initialize clients
for (const config of Object.values(REGISTERED_TENANTS)) {
  getOrCreateClient(config);
}

let activeTenantId = detectInitialTenantId();

export function getActiveTenant(): TenantConfig {
  return REGISTERED_TENANTS[activeTenantId] || REGISTERED_TENANTS['stihl'];
}

export function getActiveTenantSupabaseUrl(): string {
  return getActiveTenant().supabaseUrl;
}

export function setActiveTenant(tenantId: string): void {
  if (REGISTERED_TENANTS[tenantId]) {
    activeTenantId = tenantId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, tenantId);
    }
    console.log(`🏢 [MultiTenant] Active tenant switched to: ${REGISTERED_TENANTS[tenantId].name} (${tenantId})`);
  }
}

export function getTenantClient(tenantId: string): SupabaseClient {
  const config = REGISTERED_TENANTS[tenantId] || getActiveTenant();
  return getOrCreateClient(config);
}

/**
 * Executes a cascade sign-in across tenants based on the user's email:
 * 1. Checks if email matches known tenant domains/emails.
 * 2. If not, attempts sign-in on the active tenant.
 * 3. If invalid credentials, cascades to all other registered tenants.
 * 4. On success, permanently switches the active tenant and returns the session.
 */
async function cascadeSignInWithPassword(credentials: { email: string; password: string }) {
  const { email, password } = credentials;
  const cleanEmail = email.trim();

  // 1. Prediction by domain or email
  const predictedId = predictTenantByEmail(cleanEmail);
  const candidates: string[] = [];

  if (predictedId && REGISTERED_TENANTS[predictedId]) {
    candidates.push(predictedId);
  }

  // Add currently active tenant if not already first candidate
  if (!candidates.includes(activeTenantId)) {
    candidates.push(activeTenantId);
  }

  // Add remaining tenants
  for (const id of Object.keys(REGISTERED_TENANTS)) {
    if (!candidates.includes(id)) {
      candidates.push(id);
    }
  }

  let lastError: any = null;

  for (const tenantId of candidates) {
    const config = REGISTERED_TENANTS[tenantId];
    const client = getOrCreateClient(config);

    console.log(`🔑 [MultiTenant Auth] Trying sign-in for "${cleanEmail}" on tenant: ${config.shortName}...`);
    try {
      const result = await client.auth.signInWithPassword({ email: cleanEmail, password });

      if (!result.error && result.data.user) {
        console.log(`✅ [MultiTenant Auth] Authentication successful for tenant: ${config.shortName}! Activating.`);
        setActiveTenant(tenantId);
        return result;
      }

      lastError = result.error;
    } catch (err) {
      lastError = err;
    }
  }

  return {
    data: { user: null, session: null },
    error: lastError || new Error('Identifiants de connexion invalides.'),
  };
}

/**
 * Proxy Supabase client that dynamically delegates to the active tenant's client.
 * Seamlessly intercepts `auth.signInWithPassword` to perform transparent multi-tenant cascade.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    const activeClient = getOrCreateClient(getActiveTenant());

    if (prop === 'auth') {
      const activeAuth = activeClient.auth;
      return new Proxy(activeAuth, {
        get(authTarget, authProp: string | symbol) {
          if (authProp === 'signInWithPassword') {
            return cascadeSignInWithPassword;
          }
          const val = (authTarget as any)[authProp];
          return typeof val === 'function' ? val.bind(authTarget) : val;
        },
      });
    }

    const val = (activeClient as any)[prop];
    return typeof val === 'function' ? val.bind(activeClient) : val;
  },
});
