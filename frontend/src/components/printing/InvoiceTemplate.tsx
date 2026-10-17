import React, { forwardRef } from 'react';
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';

export interface InvoiceData {
    id: string;
    invoice_number?: string;
    order_ref?: string;
    storeName: string;
    storeAddress?: string;
    workerName?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    created_at: string;
    items: any[];
    total_price: number;
    type: 'detail' | 'gros' | 'proforma';
    paymentMethod?: string;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
    const isProforma = data.type === 'proforma';
    const { t } = useTranslation();

    const formattedDate = (() => {
        try {
            return format(new Date(data.created_at || Date.now()), 'dd/MM/yyyy HH:mm');
        } catch {
            return new Date().toLocaleString('fr-FR');
        }
    })();

    return (
        <div
            ref={ref}
            className="bg-white text-black font-sans hidden print:block mx-auto text-left"
            style={{
                width: '74mm',
                maxWidth: '74mm',
                margin: '0 auto',
                padding: '3mm 2mm 8mm 2mm',
                boxSizing: 'border-box',
                fontSize: '11px',
                lineHeight: 1.25,
                color: '#000',
                backgroundColor: '#fff',
            }}
        >
            <style>{`
                @media print {
                    @page {
                        size: 80mm auto;
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

            {/* Header / Branding */}
            <div className="text-center mb-2">
                <div className="flex justify-center mb-1">
                    <img
                        src="/holding-pro-logo.png"
                        alt="Holding Pro Logo"
                        className="h-14 w-14 object-contain mx-auto"
                    />
                </div>
                <h1 className="text-base font-black tracking-wider uppercase text-black leading-tight">
                    HOLDING PRO
                </h1>
                <p className="text-xs font-bold uppercase text-black">
                    NIAMANA DUBAI
                </p>
                <p className="text-[10px] font-semibold italic text-black my-0.5">
                    &ldquo;TOUJOURS CLIENT SATISFAIT&rdquo;
                </p>
                <p className="text-[9px] font-medium uppercase text-gray-800">
                    Articles Électroniques &amp; Accessoires
                </p>
                <p className="text-[10px] font-bold text-black mt-0.5">
                    Tél: 79 34 60 73 / 70 68 21 00 / 71 06 65 75
                </p>
                <p className="text-[9px] text-gray-700">
                    {data.storeAddress || 'Niamana Dubai, Bamako - Mali'}
                </p>
                <p className="text-[9px] text-gray-700 underline font-mono">
                    https://holding-pro.vercel.app/
                </p>
            </div>

            {/* Dashed Separator */}
            <div className="border-b border-dashed border-black my-1.5" />

            {/* Document Title & Meta */}
            <div className="text-center mb-1.5">
                <span className="inline-block font-black text-xs uppercase tracking-wide border border-black px-2 py-0.5 rounded">
                    {isProforma
                        ? t('invoice.proforma', 'DEVIS / PROFORMA')
                        : (data.paymentMethod === 'credit'
                            ? 'FACTURE À CRÉDIT'
                            : t('invoice.cashReceipt', 'TICKET DE CAISSE'))}
                </span>
            </div>

            <div className="text-[10px] space-y-0.5 mb-1.5">
                <div className="flex justify-between">
                    <span className="font-semibold">N° Ticket:</span>
                    <span className="font-mono font-bold">{data.invoice_number || data.id?.slice(0, 8)}</span>
                </div>
                {data.order_ref && (
                    <div className="flex justify-between">
                        <span className="font-semibold">Réf Cmd:</span>
                        <span className="font-mono">{data.order_ref}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="font-semibold">Date:</span>
                    <span>{formattedDate}</span>
                </div>
                {data.workerName && (
                    <div className="flex justify-between">
                        <span className="font-semibold">Caissier:</span>
                        <span className="font-medium">{data.workerName}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="font-semibold">Client:</span>
                    <span className="font-medium">{data.customerName || t('customer.counterClient', 'Client Comptoir')}</span>
                </div>
                {data.customerPhone && (
                    <div className="flex justify-between">
                        <span className="font-semibold">Tél Client:</span>
                        <span>{data.customerPhone}</span>
                    </div>
                )}
                {data.customerAddress && (
                    <div className="flex justify-between">
                        <span className="font-semibold">Adresse:</span>
                        <span className="truncate max-w-[45mm]">{data.customerAddress}</span>
                    </div>
                )}
            </div>

            {/* Dashed Separator */}
            <div className="border-b border-dashed border-black my-1.5" />

            {/* Items Table */}
            <table className="w-full text-[10px] border-collapse mb-1.5">
                <thead>
                    <tr className="border-b border-dashed border-black text-[9px] uppercase font-bold">
                        <th className="text-left pb-1">Article</th>
                        <th className="text-center pb-1 w-6">Qté</th>
                        <th className="text-right pb-1 w-12">P.U</th>
                        <th className="text-right pb-1 w-14">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.items?.map((item: any, idx: number) => {
                        const name = item.product?.name || item.name || item.designation || 'Article';
                        const qty = Number(item.quantity ?? item.qty ?? 1);
                        const price = Number(item.unit_price ?? item.price ?? item.product?.unit_price ?? 0);
                        const total = Number(item.lineTotal ?? item.total ?? (qty * price));
                        const discount = Number(item.discount ?? item.discountAmount ?? 0);
                        const packSize = Number(item.product?.quantity_per_box ?? item.conditionnement ?? 1);
                        const isBox = Boolean(item.isBox);

                        return (
                            <tr key={idx} className="align-top">
                                <td className="py-1 pr-1">
                                    <div className="font-semibold leading-tight break-words">{name}</div>
                                    {isBox && packSize > 1 && (
                                        <div className="text-[8px] text-gray-600">Boîte de {packSize}</div>
                                    )}
                                    {discount > 0 && (
                                        <div className="text-[8px] text-gray-600">Remise: -{discount}%</div>
                                    )}
                                </td>
                                <td className="py-1 text-center font-bold">{qty}</td>
                                <td className="py-1 text-right whitespace-nowrap">{price.toLocaleString('fr-FR')}</td>
                                <td className="py-1 text-right font-bold whitespace-nowrap">{total.toLocaleString('fr-FR')}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Dashed Separator */}
            <div className="border-b border-dashed border-black my-1.5" />

            {/* Totals */}
            <div className="space-y-1 mb-2 text-[11px]">
                <div className="flex justify-between items-center text-xs font-black border-t-2 border-black pt-1">
                    <span className="uppercase">NET À PAYER:</span>
                    <span className="text-sm font-black whitespace-nowrap">
                        {Number(data.total_price || 0).toLocaleString('fr-FR')} FCFA
                    </span>
                </div>
                {data.paymentMethod && !isProforma && (
                    <div className="flex justify-between text-[10px] pt-0.5">
                        <span className="font-semibold">Règlement:</span>
                        <span className="font-bold uppercase">{data.paymentMethod}</span>
                    </div>
                )}
            </div>

            {/* Dashed Separator */}
            <div className="border-b border-dashed border-black my-1.5" />

            {/* Footer */}
            <div className="text-center text-[9px] text-gray-800 space-y-1 pt-1">
                {isProforma ? (
                    <p className="italic font-medium">
                        {t('invoice.proformaNote', 'Ce devis est valable 15 jours.')}
                    </p>
                ) : (
                    <>
                        <p className="font-bold">Merci pour votre confiance et à bientôt !</p>
                        <p className="text-[8px] text-gray-600">Les marchandises vendues ne sont ni reprises ni échangées.</p>
                        <p className="text-[8px] font-semibold text-black pt-0.5">
                            TikTok • Facebook • Instagram • YouTube
                        </p>
                        <p className="text-[8px] font-black text-black">
                            @HOLDING PRO NIAMANA DUBAI
                        </p>
                    </>
                )}
                <div className="flex items-center justify-center gap-1 opacity-50 grayscale pt-2">
                    <span className="text-[8px] font-semibold tracking-wide text-gray-500 uppercase">Propulsé par JATE</span>
                    <img src="/jati-icon.png" alt="JATE" className="h-3 object-contain" />
                </div>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = "InvoiceTemplate";
