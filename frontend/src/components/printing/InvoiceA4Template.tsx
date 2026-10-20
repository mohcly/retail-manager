import React, { forwardRef } from 'react';
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';
import { InvoiceData } from './InvoiceTemplate';
import { numberToFrenchWords } from '@/utils/numberToFrenchWords';

export const InvoiceA4Template = forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
    const { t } = useTranslation();
    const isProforma = data.type === 'proforma';
    const isCredit = data.paymentMethod === 'credit';

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

    return (
        <div
            ref={ref}
            className="bg-white text-black font-sans hidden print:flex print:flex-col mx-auto relative box-border"
            style={{ width: '210mm', minHeight: '297mm', padding: '10mm 15mm' }}
        >
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            {/* Subtle Watermark Logo */}
            <div className="absolute inset-0 z-0 pointer-events-none flex flex-col justify-center items-center opacity-[0.04]">
                <img src="/holding-pro-logo.png" alt="Watermark Holding Pro" className="w-[55%] h-auto object-contain" />
            </div>

            {/* Rainbow Top Bar */}
            <div
                className="mb-5 z-10"
                style={{
                    background: 'linear-gradient(90deg, #f97316 0%, #ec4899 20%, #a855f7 40%, #3b82f6 60%, #22c55e 80%, #eab308 100%)',
                    height: '5px',
                    width: '100%',
                    borderRadius: '3px'
                }}
            />

            {/* HEADER MODULE */}
            <div className="relative z-10 flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <img
                        src="/holding-pro-logo.png"
                        alt="Logo Holding Pro"
                        className="rounded-full border border-gray-200 object-contain"
                        style={{ width: '72px', height: '72px' }}
                    />
                    <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400">
                            Commerce Général &amp; Services
                        </div>
                        <h1 className="text-3xl font-black tracking-tight leading-none">
                            <span style={{ color: '#f97316' }}>HOLDING</span>{' '}
                            <span style={{ color: '#7c3aed' }}>PRO</span>
                        </h1>
                        <div className="text-xs font-bold text-gray-800 tracking-wider uppercase mt-1">
                            Niamana Dubaï — Bamako, Mali
                        </div>
                        <div className="text-[11px] text-blue-600 font-medium">
                            https://holding-pro.vercel.app/
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="inline-block bg-[#0f172a] text-white text-[10px] font-black px-3.5 py-1.5 rounded-full mb-2 tracking-wider uppercase shadow-sm">
                        TOUJOURS CLIENT SATISFAIT
                    </div>
                    <div className="text-xs font-semibold text-gray-800 leading-relaxed">
                        <p className="text-emerald-700 font-bold">
                            📞 +223 79 34 60 73 / 70 68 21 00 / 71 06 65 75
                        </p>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                            {data.storeAddress || 'Niamana Dubaï, en face station Shell'}
                        </p>
                    </div>
                </div>
            </div>

            {/* INVOICE METADATA & CLIENT BOX */}
            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className="w-[50%]">
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-widest mb-3">
                        {isProforma ? 'DEVIS / PROFORMA' : (isCredit ? 'FACTURE À CRÉDIT' : 'FACTURE')}
                    </h2>
                    <div className="grid grid-cols-[105px_1fr] gap-y-1 text-sm">
                        <span className="font-bold text-gray-600">N° Facture :</span>
                        <span className="font-mono font-bold text-gray-900">{data.invoice_number || data.id?.slice(0, 8)}</span>

                        {data.order_ref && (
                            <>
                                <span className="font-bold text-gray-600">Réf. Cmd :</span>
                                <span className="font-mono font-medium text-gray-900">{data.order_ref}</span>
                            </>
                        )}

                        <span className="font-bold text-gray-600">Date :</span>
                        <span className="font-medium text-gray-900">{formattedDate}</span>

                        <span className="font-bold text-gray-600">Vendeur :</span>
                        <span className="font-medium text-gray-900">{data.workerName || 'Caisse Niamana'}</span>

                        {!isProforma && (
                            <>
                                <span className="font-bold text-gray-600">Paiement :</span>
                                <span className="font-bold text-emerald-700 uppercase">{paymentLabel}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Client Info Card */}
                <div className="w-[45%] border border-gray-200 rounded-xl p-4 bg-slate-50/60 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Facturé à :</p>
                    <h3 className="text-lg font-black text-gray-900 leading-tight mb-1">
                        {data.customerName || t('customer.counterClient', 'Client Comptoir')}
                    </h3>
                    <p className="text-xs text-gray-600">
                        {data.customerAddress || 'Niamana Dubaï, Bamako'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                        Tél: {data.customerPhone || '+223 70 00 00 00'}
                    </p>
                </div>
            </div>

            {/* TABLE OF ITEMS */}
            <div className="flex-grow relative z-10">
                <table className="w-full text-sm border-collapse mb-6">
                    <thead>
                        <tr className="bg-[#0f172a] text-white">
                            <th className="py-2.5 px-4 text-left font-bold text-xs uppercase tracking-wider">Désignation</th>
                            <th className="py-2.5 px-3 text-center font-bold text-xs uppercase tracking-wider w-20">Qté</th>
                            <th className="py-2.5 px-4 text-right font-bold text-xs uppercase tracking-wider w-32">Prix U.</th>
                            <th className="py-2.5 px-4 text-right font-bold text-xs uppercase tracking-wider w-36">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items?.map((item: any, index: number) => {
                            const name = item.product?.name || item.name || item.designation || 'Article';
                            const qty = Number(item.quantity ?? item.qty ?? 1);
                            const price = Number(item.unit_price ?? item.price ?? item.product?.unit_price ?? 0);
                            const total = Number(item.lineTotal ?? item.total ?? (qty * price));
                            const discount = Number(item.discount ?? item.discountAmount ?? 0);
                            const packSize = Number(item.product?.quantity_per_box ?? item.conditionnement ?? 1);
                            const isBox = Boolean(item.isBox);

                            return (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white border-b border-gray-200' : 'bg-slate-50/50 border-b border-gray-200'}>
                                    <td className="py-2.5 px-4 font-semibold text-gray-900">
                                        <div>{name}</div>
                                        {isBox && packSize > 1 && (
                                            <div className="text-[10px] text-gray-500 font-normal">Boîte de {packSize} unités</div>
                                        )}
                                        {discount > 0 && (
                                            <div className="text-[10px] text-red-600 font-bold">Remise appliquée: -{discount}%</div>
                                        )}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-bold text-gray-800">
                                        {qty}
                                    </td>
                                    <td className="py-2.5 px-4 text-right text-gray-800 whitespace-nowrap">
                                        {price.toLocaleString('fr-FR')}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-bold text-gray-900 whitespace-nowrap">
                                        {total.toLocaleString('fr-FR')} FCFA
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* TOTALS & SUM TEXT */}
                <div className="flex justify-between items-center mt-4">
                    <div className="w-[52%]">
                        <p className="text-sm text-gray-600 italic mb-1">
                            Arrêté la présente facture à la somme de :
                        </p>
                        <p className="text-base font-black text-gray-900 leading-snug">
                            {sumInWords}
                        </p>
                    </div>

                    <div className="w-[44%]">
                        <div className="flex justify-between items-center py-3 px-5 font-black text-white rounded-xl bg-[#0f172a] shadow-md">
                            <span className="text-sm tracking-wider uppercase">NET À PAYER :</span>
                            <span className="text-2xl font-black text-[#f97316]">
                                {netTotal.toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SIGNATURES */}
            <div className="flex justify-between mt-12 px-12 relative z-10">
                <div className="text-center w-48">
                    <p className="font-bold text-gray-800 mb-14">Le Client</p>
                    <div className="border-b border-gray-400" />
                </div>
                <div className="text-center w-48">
                    <p className="font-bold text-gray-800 mb-14">La Direction</p>
                    <div className="border-b border-gray-400" />
                </div>
            </div>

            {/* FOOTER */}
            <div className="mt-auto pt-6 border-t border-gray-200 relative z-10 flex justify-between items-center">
                <div className="text-center flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        HOLDING PRO — TOUJOURS CLIENT SATISFAIT
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                        Les marchandises vendues ne sont ni reprises ni échangées. Merci de votre confiance !
                    </p>
                </div>
                <div className="flex items-center gap-1.5 opacity-60 grayscale shrink-0 ml-4">
                    <span className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">Propulsé par JATE</span>
                    <img src="/jati-icon.png" alt="JATE" className="h-4 object-contain" />
                </div>
            </div>
        </div>
    );
});

InvoiceA4Template.displayName = 'InvoiceA4Template';
