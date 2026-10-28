export interface TenantConfig {
  id: string;
  name: string;
  shortName: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  accentColor: string;
  logoUrl?: string;
  knownDomains?: string[];
  knownEmails?: string[];
}

export const REGISTERED_TENANTS: Record<string, TenantConfig> = {
  stihl: {
    id: 'stihl',
    name: 'ETS MADJOU SYLLA — STIHL MALI',
    shortName: 'STIHL',
    supabaseUrl: 'https://fpvrbxmbrotowdlyebqv.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdnJieG1icm90b3dkbHllYnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNzE1MjMsImV4cCI6MjA5NjY0NzUyM30.8_mjBGr1FpYE20cc22iehEf0Xi9Fix2M0d_SSHIDQuI',
    accentColor: '#f04e23',
    logoUrl: '/stihl-logo.jpg',
    knownDomains: ['stihl-mali.com', 'stihl.com'],
    knownEmails: [
      'imsnsylla@gmail.com',
      'bahsyllah223@gmail.com',
      'blaisetienou@gmail.com'
    ]
  },
  holdingpro: {
    id: 'holdingpro',
    name: 'HOLDING PRO (SUCCURSALE NIAMANA DUBAÏ)',
    shortName: 'HOLDING PRO',
    supabaseUrl: 'https://onsqvduklnwffugsiybs.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uc3F2ZHVrbG53ZmZ1Z3NpeWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzk1MDgsImV4cCI6MjA5NzgxNTUwOH0.39u7eCzwZonAVbxdEYTQBv9cMONWHSCD5SBKeKSmUkE',
    accentColor: '#0f172a',
    logoUrl: '/holding-pro-logo.png',
    knownDomains: ['holding-pro.com', 'holdingpro.com', 'niamana.com'],
    knownEmails: [
      'papirotech26@gmail.com',
      'ursula@master.com',
      'niamana@gmail.com',
      'holdingpro@gmail.com'
    ]
  }
};

export function getAllTenants(): TenantConfig[] {
  return Object.values(REGISTERED_TENANTS);
}

const STORAGE_KEY = 'djati_active_tenant';

/**
 * Detect the initial tenant ID from URL, hostname, or localStorage.
 */
export function detectInitialTenantId(): string {
  if (typeof window === 'undefined') return 'stihl';

  // 1. URL search params: ?org=holdingpro or ?tenant=stihl
  const params = new URLSearchParams(window.location.search);
  const paramTenant = params.get('org') || params.get('tenant');
  if (paramTenant && REGISTERED_TENANTS[paramTenant.toLowerCase()]) {
    localStorage.setItem(STORAGE_KEY, paramTenant.toLowerCase());
    return paramTenant.toLowerCase();
  }

  // 2. Subdomain check (e.g. holdingpro.djati.app, stihl.djati.app)
  const host = window.location.hostname.toLowerCase();
  for (const [id, config] of Object.entries(REGISTERED_TENANTS)) {
    if (host.startsWith(`${id}.`) || (config.knownDomains && config.knownDomains.some(d => host.includes(d)))) {
      localStorage.setItem(STORAGE_KEY, id);
      return id;
    }
  }

  // 3. Persisted in localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && REGISTERED_TENANTS[stored]) {
    return stored;
  }

  // 4. Default fallback
  return 'stihl';
}

/**
 * Predict tenant by email address before attempting login.
 */
export function predictTenantByEmail(email: string): string | null {
  const cleanEmail = email.trim().toLowerCase();
  for (const [id, config] of Object.entries(REGISTERED_TENANTS)) {
    if (config.knownEmails && config.knownEmails.includes(cleanEmail)) {
      return id;
    }
    if (config.knownDomains) {
      for (const domain of config.knownDomains) {
        if (cleanEmail.endsWith(`@${domain}`)) {
          return id;
        }
      }
    }
  }
  return null;
}
