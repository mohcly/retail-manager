import {
  StoreReceiptConfig,
  HOLDING_PRO_DEFAULT_RECEIPT,
  STIHL_DIBIDANI_DEFAULT_RECEIPT,
  STIHL_NIAMAKORO_DEFAULT_RECEIPT,
  DEFAULT_RECEIPT_CONFIG
} from '@/types/receipt';

export interface MinimalStore {
  id?: string;
  name?: string;
  address?: string;
  phone?: string;
  receipt_settings?: any;
}

/**
 * Resolves the active StoreReceiptConfig for printing tickets and A4 invoices.
 * 1. Parses `receipt_settings` from the store if available (JSON string or object).
 * 2. Matches known store presets (Holding Pro Niamana Dubai, STIHL Dibidani, STIHL Niamakoro).
 * 3. Falls back to generic default with dynamic store name/address.
 */
export function resolveStoreReceiptConfig(store?: MinimalStore | null): StoreReceiptConfig {
  if (!store) {
    return DEFAULT_RECEIPT_CONFIG;
  }

  // 1. Check if store has explicit receipt_settings
  let explicitSettings: Partial<StoreReceiptConfig> | null = null;
  if (store.receipt_settings) {
    try {
      explicitSettings = typeof store.receipt_settings === 'string'
        ? JSON.parse(store.receipt_settings)
        : store.receipt_settings;
    } catch {
      explicitSettings = null;
    }
  }

  // 2. Determine base preset from name / id
  const nameLower = (store.name || '').toLowerCase();
  let baseConfig = DEFAULT_RECEIPT_CONFIG;

  if (nameLower.includes('dubai') || nameLower.includes('holding') || nameLower.includes('niamana')) {
    baseConfig = HOLDING_PRO_DEFAULT_RECEIPT;
  } else if (nameLower.includes('dibidani') || (nameLower.includes('stihl') && !nameLower.includes('niamakoro'))) {
    baseConfig = STIHL_DIBIDANI_DEFAULT_RECEIPT;
  } else if (nameLower.includes('niamakoro')) {
    baseConfig = STIHL_NIAMAKORO_DEFAULT_RECEIPT;
  } else {
    baseConfig = {
      ...DEFAULT_RECEIPT_CONFIG,
      businessName: store.name || DEFAULT_RECEIPT_CONFIG.businessName,
      address: store.address || DEFAULT_RECEIPT_CONFIG.address,
      phones: store.phone ? [store.phone] : DEFAULT_RECEIPT_CONFIG.phones,
    };
  }

  if (explicitSettings && Object.keys(explicitSettings).length > 0) {
    return {
      ...baseConfig,
      ...explicitSettings,
    };
  }

  return baseConfig;
}
