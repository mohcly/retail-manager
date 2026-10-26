import { HOLDING_PRO_LOGO_BASE64 } from '@/assets/holdingProLogo';

export type ReceiptFormat = 'thermal-80mm' | 'thermal-58mm' | 'a4-invoice';

export interface StoreReceiptConfig {
  businessName: string;
  tagline?: string;
  subHeader?: string;
  logoUrl?: string;             // Base64 string or public asset URL (e.g. /stihl-logo.jpg)
  secondaryLogoUrl?: string;    // e.g. /quincaillerie-logo.jpg
  rccm?: string;
  nif?: string;
  address: string;
  phones: string[];
  defaultFormat: ReceiptFormat;
  accentColor?: string;         // e.g., '#f04e23' (STIHL Orange), '#0f172a' (Holding Pro Navy)
  showBoxUnits?: boolean;        // e.g., display "Boîte de 12"
  showDiscounts?: boolean;
  showCashierName?: boolean;
  returnPolicy?: string;        // "Les marchandises vendues ne sont ni reprises ni échangées"
  proformaValidity?: string;    // "Ce devis est valable 15 jours"
  socialHandles?: string;       // e.g., "TikTok: @holding.pro | FB: Holding Pro"
  footerNote?: string;          // e.g., "MERCI POUR VOTRE ACHAT ET À BIENTÔT !"
  bankDetails?: {
    bankName: string;
    iban: string;
    swift?: string;
  };
}

export const HOLDING_PRO_DEFAULT_RECEIPT: StoreReceiptConfig = {
  businessName: 'SUCCURSALE NIAMANA DUBAÏ',
  tagline: 'Quincaillerie Générale - Vente en Gros et Détail',
  subHeader: 'HOLDING PRO',
  logoUrl: HOLDING_PRO_LOGO_BASE64,
  rccm: 'MA-BKO-2021-B-1024',
  nif: '085123456T',
  address: 'Niamana en face de la Station Shell, Bamako - Mali',
  phones: ['+223 76 00 00 00', '+223 66 00 00 00'],
  defaultFormat: 'thermal-80mm',
  accentColor: '#0f172a',
  showBoxUnits: true,
  showDiscounts: true,
  showCashierName: true,
  returnPolicy: 'Les marchandises vendues ne sont ni reprises ni échangées.',
  proformaValidity: 'Ce devis est valable 15 jours à compter de sa date d’émission.',
  socialHandles: 'TikTok / Facebook : @HOLDING PRO',
  footerNote: 'MERCI DE VOTRE CONFIANCE ET À TRÈS BIENTÔT !'
};

export const STIHL_DIBIDANI_DEFAULT_RECEIPT: StoreReceiptConfig = {
  businessName: 'ETS MADJOU SYLLA',
  tagline: 'Représentant Officiel STIHL Mali - Quincaillerie de la Paix',
  subHeader: 'STIHL DIBIDANI',
  logoUrl: '/stihl-logo.jpg',
  secondaryLogoUrl: '/quincaillerie-logo.jpg',
  rccm: 'MA-BKO-2015-A-4589',
  nif: '084201948B',
  address: 'Grand Marché Dibida, Rue 22, Bamako - Mali',
  phones: ['+223 20 22 45 80', '+223 76 45 12 00'],
  defaultFormat: 'thermal-80mm',
  accentColor: '#f04e23',
  showBoxUnits: false,
  showDiscounts: true,
  showCashierName: true,
  returnPolicy: 'Garantie constructeur STIHL applicable selon conditions.',
  proformaValidity: 'Ce devis est valable 30 jours.',
  socialHandles: 'Web : www.stihl-mali.com',
  footerNote: 'MERCI DE VOTRE VISITE CHEZ STIHL DIBIDANI !'
};

export const STIHL_NIAMAKORO_DEFAULT_RECEIPT: StoreReceiptConfig = {
  businessName: 'ETS MADJOU SYLLA (NIAMAKORO)',
  tagline: 'Succursale STIHL Niamakoro - Outillage & Motoculture',
  subHeader: 'STIHL NIAMAKORO',
  logoUrl: '/stihl-logo.jpg',
  secondaryLogoUrl: '/quincaillerie-logo.jpg',
  rccm: 'MA-BKO-2015-A-4589',
  nif: '084201948B',
  address: 'Niamakoro Cité Unicef, Route de l’Aéroport, Bamako - Mali',
  phones: ['+223 20 20 88 12', '+223 79 11 22 33'],
  defaultFormat: 'thermal-80mm',
  accentColor: '#f04e23',
  showBoxUnits: false,
  showDiscounts: true,
  showCashierName: true,
  returnPolicy: 'Garantie constructeur STIHL applicable selon conditions.',
  proformaValidity: 'Ce devis est valable 30 jours.',
  footerNote: 'MERCI POUR VOTRE ACHAT CHEZ STIHL NIAMAKORO !'
};

export const DEFAULT_RECEIPT_CONFIG: StoreReceiptConfig = {
  businessName: 'DJATI COMMERCE',
  tagline: 'Vente & Distribution',
  address: 'Bamako, Mali',
  phones: ['+223 00 00 00 00'],
  defaultFormat: 'thermal-80mm',
  accentColor: '#1e293b',
  showBoxUnits: true,
  showDiscounts: true,
  showCashierName: true,
  returnPolicy: 'Les marchandises vendues ne sont ni reprises ni échangées.',
  proformaValidity: 'Ce devis est valable 15 jours.',
  footerNote: 'MERCI DE VOTRE CONFIANCE !'
};
