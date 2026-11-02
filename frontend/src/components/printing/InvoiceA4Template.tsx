import React, { forwardRef } from 'react';
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';
import { InvoiceData } from './InvoiceTemplate';
import { numberToFrenchWords } from '@/utils/numberToFrenchWords';
import { HOLDING_PRO_LOGO_BASE64 } from '@/assets/holdingProLogo';

export type StoreBrandVariant = 'holdingpro' | 'stihl_niamakoro' | 'stihl_dibidani' | 'generic';

export function resolveStoreBrandVariant(data: InvoiceData): StoreBrandVariant {
    const name = (data.storeName || '').toLowerCase();
    const address = (data.storeAddress || '').toLowerCase();

    // 1. Holding Pro / Yemenat Niamana Dubaï
    if (
        name.includes('holding') ||
        name.includes('niamana') ||
        address.includes('niamana') ||
        address.includes('dubaï') ||
        address.includes('dubai')
    ) {
        return 'holdingpro';
    }

    // 2. STIHL Niamakoro
    if (
        name.includes('niamakoro') ||
        address.includes('niamakoro') ||
        address.includes('sonef')
    ) {
        return 'stihl_niamakoro';
    }

    // 3. STIHL Dibidani
    if (
        name.includes('dibidani') ||
        address.includes('dibidani') ||
        address.includes('djoliba') ||
        name.includes('madjou') ||
        name.includes('quincaillerie') ||
        name.includes('stihl')
    ) {
        return 'stihl_dibidani';
    }

    // Check active tenant from localStorage if running in browser
    if (typeof window !== 'undefined') {
        const tenant = localStorage.getItem('djati_active_tenant');
        if (tenant === 'holdingpro') return 'holdingpro';
        if (tenant === 'stihl') return 'stihl_dibidani';
    }

    return 'generic';
}

const QuincaillerieLogo = () => (
    <div className="w-[100px] shrink-0">
        <img src="/quincaillerie-logo.jpg" alt="Logo ETS" className="w-full h-auto object-contain rounded" />
    </div>
);

const StihlLogo = () => (
    <div className="w-[110px] shrink-0 text-right flex justify-end">
        <img src="/stihl-logo.jpg" alt="STIHL" className="w-full h-auto object-contain" />
    </div>
);

const EtsBanner = () => (
    <div className="relative z-10 keep-together mb-6">
        <img
            src="/ets-banner.jpg"
            alt="Quincaillerie de la Paix - ETS Madjou Sylla"
            width={2400}
            height={658}
            loading="eager"
            decoding="sync"
            className="block w-full h-auto rounded-[3px]"
        />
    </div>
);

export const InvoiceA4Template = forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
    const { t } = useTranslation();
    const isProforma = data.type === 'proforma';
    const isCredit = data.paymentMethod === 'credit';
    const variant = resolveStoreBrandVariant(data);

    const formattedDate = (() => {
        try {
            return format(new Date(data.created_at || Date.now()), 'dd/MM/yyyy HH:mm');
        } catch {
            return new Date().toLocaleString('fr-FR');
        }
    })();

    const netTotal = Number(data.total_price || 0);

    const paymentLabel = (() => {
        if (!data.paymentMethod) return 'ESPÈCES (CASH)';
        const m = data.paymentMethod.toLowerCase();
        if (m === 'cash' || m === 'especes' || m === 'espèces') return 'ESPÈCES (CASH)';
        if (m === 'credit' || m === 'crédit') return 'CRÉDIT';
        if (m === 'orange_money' || m === 'om') return 'ORANGE MONEY';
        if (m === 'wave') return 'WAVE';
        if (m === 'cheque' || m === 'chèque') return 'CHÈQUE';
        if (m === 'virement') return 'VIREMENT';
        return data.paymentMethod.toUpperCase();
    })();

    const frenchWords = numberToFrenchWords(netTotal);
    const sumInWords = `${frenchWords} (${netTotal.toLocaleString('fr-FR')}) FCFA`;

    // STIHL product detection for watermark / orange accent
    const hasStihlProduct = data.items?.some(item =>
        item.product?.name?.toLowerCase().includes('stihl') ||
        item.product?.name?.toLowerCase().includes('steel')
    ) || false;

    const hasNonStihlProduct = data.items?.some(item =>
        !(item.product?.name?.toLowerCase().includes('stihl') ||
          item.product?.name?.toLowerCase().includes('steel'))
    ) || false;

    const onlyStihl = hasStihlProduct && !hasNonStihlProduct;
    const both = hasStihlProduct && hasNonStihlProduct;
    const onlyQuincaillerie = hasNonStihlProduct && !hasStihlProduct;

    return (
        <div
            ref={ref}
            className="bg-white text-black font-sans hidden print:block mx-auto relative box-border"
            style={{ width: '100%', maxWidth: '210mm' }}
        >
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 8mm 12mm 8mm 12mm;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    table {
                        page-break-inside: auto;
                        break-inside: auto;
                    }
                    tr {
                        page-break-inside: avoid;
                        break-inside: avoid;
                        page-break-after: auto;
                    }
                    thead {
                        display: table-header-group;
                    }
                    .keep-together {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
            `}</style>

            {/* WATERMARK SECTION */}
            {variant === 'holdingpro' && (
                <div className="absolute inset-0 z-0 pointer-events-none flex flex-col justify-center items-center opacity-[0.035]">
                    <img src={HOLDING_PRO_LOGO_BASE64} alt="Watermark Holding Pro" className="w-[50%] h-auto object-contain" />
                </div>
            )}

            {(variant === 'stihl_dibidani' || variant === 'stihl_niamakoro') && (
                <div className="absolute inset-0 z-0 pointer-events-none flex flex-col justify-center items-center opacity-[0.08]">
                    {onlyStihl && (
                        <img src="/stihl-logo.jpg" alt="Watermark STIHL" className="w-[50%] h-auto object-contain grayscale contrast-200" />
                    )}
                    {both && (
                        <>
                            <img src="/quincaillerie-logo.jpg" alt="Watermark Quincaillerie" className="w-[45%] h-auto object-contain grayscale contrast-200" />
                            <img src="/stihl-logo.jpg" alt="Watermark STIHL" className="w-[35%] h-auto object-contain grayscale contrast-200 -mt-2" />
                        </>
                    )}
                    {(!hasStihlProduct || onlyQuincaillerie) && !both && !onlyStihl && (
                        <img src="/quincaillerie-logo.jpg" alt="Watermark Quincaillerie" className="w-[55%] h-auto object-contain grayscale contrast-200" />
                    )}
                </div>
            )}

            {/* HEADER VARIANT 1: HOLDING PRO (NIAMANA DUBAÏ) */}
            {variant === 'holdingpro' && (
                <>
                    <div
                        className="mb-4 z-10 relative"
                        style={{
                            background: 'linear-gradient(90deg, #f97316 0%, #ec4899 20%, #a855f7 40%, #3b82f6 60%, #22c55e 80%, #eab308 100%)',
                            height: '5px',
                            borderRadius: '2px',
                        }}
                    />
                    <div className="flex justify-between items-start mb-4 pb-3 border-b-2 border-black relative z-10">
                        <div className="w-[100px] shrink-0 mr-4">
                            <img src={HOLDING_PRO_LOGO_BASE64} alt="Logo Holding Pro" className="w-full h-auto object-contain rounded" />
                        </div>
                        <div className="flex-1 text-center px-2">
                            <h1 className="text-2xl font-black tracking-tight mb-0.5 leading-none uppercase text-[#0f172a]">
                                HOLDING PRO (SARL)
                            </h1>
                            <p className="text-xs font-bold text-red-600 tracking-wider uppercase mb-1">
                                SUCCURSALE DE NIAMANA DUBAÏ • TOUJOURS CLIENT SATISFAIT
                            </p>
                            <p className="text-[11px] font-medium text-gray-700 leading-tight">
                                Vente de Pièces Détachées, Filtres, Huiles & Lubrifiants
                            </p>
                            <p className="text-[11px] font-semibold text-gray-800 leading-tight mt-0.5">
                                Tél: <span className="text-green-700 font-bold">79 38 61 74 / 66 74 13 89 / 76 43 00 90</span>
                            </p>
                            <p className="text-[10px] text-gray-600 leading-tight">
                                {data.storeAddress || 'Niamana ATTbougou 1008 Logements en face du terrain de Football'}
                            </p>
                        </div>
                        <div className="w-[100px] shrink-0 text-right">
                            <span className="inline-block text-[10px] font-bold text-gray-500 uppercase border border-gray-400 px-2 py-1 rounded">
                                BAMAKO - MALI
                            </span>
                        </div>
                    </div>
                </>
            )}

            {/* HEADER VARIANT 2: STIHL NIAMAKORO */}
            {variant === 'stihl_niamakoro' && (
                <div className={`relative z-10 flex justify-between items-center mb-6 pb-4 border-b-4 ${hasStihlProduct ? 'border-[#f04e23]' : 'border-[#2c3e50]'}`}>
                    <QuincaillerieLogo />
                    <div className="flex-1 text-center px-4">
                        <div className="inline-block bg-red-600 text-white text-xs font-bold px-2 py-1 rounded mb-1">
                            ETS Madjou Sylla
                        </div>
                        <h1 className={`text-3xl font-black tracking-tight mb-1 leading-none uppercase ${hasStihlProduct ? 'text-[#f04e23]' : 'text-[#2c3e50]'}`}>
                            Quincaillerie De La Paix
                        </h1>
                        <p className="text-[13px] font-bold text-red-600 tracking-wide uppercase mb-2">
                            Vente de machine tronçonneuse, disque, meule, etc.
                        </p>
                        <div className="text-sm font-semibold text-gray-800 leading-snug">
                            <p>TEL: <span className="text-green-700">+223 77 77 90 60 / 20 22 26 45 / 79 45 49 46</span></p>
                            <p className="text-blue-800">madjoulalasylla@gmail.com &nbsp;|&nbsp; <span className="text-gray-600">{data.storeAddress || 'Niamakoro près de SONEF, Bamako'}</span></p>
                        </div>
                    </div>
                    <div className="w-[110px] shrink-0 text-right flex justify-end">
                        {hasStihlProduct ? <StihlLogo /> : <div className="w-full"></div>}
                    </div>
                </div>
            )}

            {/* HEADER VARIANT 3: STIHL DIBIDANI - full-width ETS banner */}
            {variant === 'stihl_dibidani' && <EtsBanner />}

            {/* HEADER VARIANT 4: GENERIC / OTHER STORE */}
            {variant === 'generic' && (
                <div className="relative z-10 flex justify-between items-center mb-6 pb-4 border-b-4 border-primary">
                    <div className="w-[90px] shrink-0">
                        <img src="/logo.png" alt="Logo" className="w-full h-auto object-contain rounded" />
                    </div>
                    <div className="flex-1 text-center px-4">
                        <h1 className="text-3xl font-black tracking-tight mb-1 leading-none uppercase text-gray-900">
                            {data.storeName || 'Mon Magasin'}
                        </h1>
                        <div className="text-sm font-semibold text-gray-800 leading-snug mt-2">
                            {data.storePhone && <p>TÉL: <span className="text-green-700 font-bold">{data.storePhone}</span></p>}
                            {data.storeAddress && <p className="text-gray-600">{data.storeAddress}</p>}
                        </div>
                    </div>
                    <div className="w-[90px] shrink-0"></div>
                </div>
            )}

            {/* METADATA BAR (INVOICE NUMBER, DATE, CLIENT, PAYMENT) */}
            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className="w-[50%]">
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wider mb-2">
                        {isProforma
                            ? t('invoice.proforma', 'DEVIS / PROFORMA')
                            : (isCredit ? 'FACTURE À CRÉDIT' : t('invoice.title', 'FACTURE DE VENTE'))}
                    </h2>
                    <div className="grid grid-cols-[110px_1fr] gap-y-1 text-xs">
                        <span className="font-bold text-gray-600">N° Facture :</span>
                        <span className="font-mono font-bold text-black">{data.invoice_number || data.id.slice(0, 8)}</span>

                        {data.order_ref && (
                            <>
                                <span className="font-bold text-gray-600">Réf. Cmd :</span>
                                <span className="font-mono font-medium text-black">{data.order_ref}</span>
                            </>
                        )}

                        <span className="font-bold text-gray-600">Date & Heure :</span>
                        <span className="font-medium text-black">{formattedDate}</span>

                        {data.workerName && (
                            <>
                                <span className="font-bold text-gray-600">Vendeur :</span>
                                <span className="font-medium text-black">{data.workerName}</span>
                            </>
                        )}

                        {!isProforma && (
                            <>
                                <span className="font-bold text-gray-600">Règlement :</span>
                                <span className="font-bold text-black uppercase">{paymentLabel}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Client Box */}
                {(data.customerName || data.customerPhone || data.customerAddress) ? (
                    <div className="w-[45%] border-2 border-gray-300 rounded p-3 bg-gray-50/80">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Client Facturé :</p>
                        {data.customerName && <h3 className="text-sm font-black text-black uppercase">{data.customerName}</h3>}
                        {data.customerAddress && <p className="text-xs text-gray-700">{data.customerAddress}</p>}
                        {data.customerPhone && <p className="text-xs font-semibold text-gray-800">Tél: {data.customerPhone}</p>}
                    </div>
                ) : (
                    <div className="w-[45%] border border-dashed border-gray-300 rounded p-3 text-center">
                        <p className="text-xs font-semibold text-gray-500 uppercase">{t('customer.counterClient', 'Client Comptoir')}</p>
                    </div>
                )}
            </div>

            {/* ITEMS TABLE */}
            <div className="relative z-10 flex-grow mb-6">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="bg-[#1e293b] text-white">
                            <th className="py-2 px-2 text-center border border-[#1e293b] font-bold w-10">N°</th>
                            <th className="py-2 px-3 text-left border border-[#1e293b] font-bold">Désignation</th>
                            <th className="py-2 px-2 text-center border border-[#1e293b] font-bold w-16">Qté</th>
                            <th className="py-2 px-3 text-right border border-[#1e293b] font-bold w-24">Prix U.</th>
                            <th className="py-2 px-3 text-right border border-[#1e293b] font-bold w-28">Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items?.map((item, index) => {
                            const name = item.product?.name || item.name || 'Article';
                            const qty = Number(item.quantity ?? item.qty ?? 1);
                            const price = Number(item.unit_price ?? item.price ?? item.product?.unit_price ?? 0);
                            const packSize = Number(item.product?.quantity_per_box ?? item.conditionnement ?? 1);
                            const isBox = Boolean(item.isBox);
                            const multiplier = isBox ? packSize : 1;
                            const lineTotal = Number(item.lineTotal ?? item.total ?? (qty * price * multiplier));

                            return (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="py-1.5 px-2 border border-gray-300 text-center font-mono text-gray-600">
                                        {index + 1}
                                    </td>
                                    <td className="py-1.5 px-3 border border-gray-300 font-semibold text-black">
                                        {name}
                                        {item.discount > 0 && (
                                            <span className="ml-2 text-[9px] text-red-600 font-bold bg-red-50 px-1 rounded">
                                                -{item.discount}%
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-1.5 px-2 border border-gray-300 text-center font-bold text-black">
                                        {qty}
                                        {isBox && (
                                            <span className="ml-1 text-[9px] text-blue-600 font-bold">
                                                (ctn ×{packSize})
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-1.5 px-3 border border-gray-300 text-right font-mono text-gray-800">
                                        {price.toLocaleString('fr-FR')}
                                    </td>
                                    <td className="py-1.5 px-3 border border-gray-300 text-right font-mono font-bold text-black">
                                        {lineTotal.toLocaleString('fr-FR')}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* TOTALS & WORDS */}
            <div className="relative z-10 keep-together mb-8">
                <div className="flex justify-between items-start">
                    <div className="w-[55%] pr-4">
                        <div className="bg-gray-50 border border-gray-200 rounded p-3">
                            <p className="text-[11px] font-bold text-gray-700 uppercase mb-1">
                                Arrêté la présente facture à la somme de :
                            </p>
                            <p className="text-xs font-black text-black italic leading-snug">
                                {sumInWords}
                            </p>
                        </div>
                    </div>

                    <div className="w-[42%]">
                        <div className="bg-gray-900 text-white rounded p-3 flex justify-between items-center shadow-sm">
                            <span className="text-xs font-bold uppercase tracking-wider">NET À PAYER :</span>
                            <span className="text-base font-black font-mono tracking-tight">
                                {netTotal.toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SIGNATURES */}
            <div className="relative z-10 keep-together flex justify-between px-10 mb-8">
                <div className="text-center w-48">
                    <p className="text-xs font-bold text-gray-800 uppercase mb-14">Le Client</p>
                    <div className="border-b border-gray-400"></div>
                </div>
                <div className="text-center w-48">
                    <p className="text-xs font-bold text-gray-800 uppercase mb-14">La Direction</p>
                    <div className="border-b border-gray-400"></div>
                </div>
            </div>

            {/* FOOTER: ATTRIBUTION & JATE WATERMARK */}
            <div className="relative z-10 mt-auto pt-3 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-500 font-semibold uppercase">
                <div>
                    {variant === 'holdingpro' && 'NIAMANA DUBAÏ • BAMAKO • MALI'}
                    {variant === 'stihl_niamakoro' && 'NIAMAKORO • PRÈS DE SONEF • BAMAKO'}
                    {variant === 'stihl_dibidani' && 'DIBIDANI • FACE À DJOLIBA • BAMAKO'}
                    {variant === 'generic' && (data.storeAddress || data.storeName || '')}
                </div>
                <div className="flex items-center gap-1.5 opacity-60">
                    <span className="tracking-widest">Propulsé par JATE</span>
                    <img src="/jati-icon.png" alt="JATE" className="h-4 object-contain grayscale" />
                </div>
            </div>
        </div>
    );
});

InvoiceA4Template.displayName = 'InvoiceA4Template';
