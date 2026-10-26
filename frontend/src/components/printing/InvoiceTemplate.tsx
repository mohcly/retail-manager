import React, { forwardRef } from 'react';
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';
import { StoreReceiptConfig } from '@/types/receipt';
import { resolveStoreReceiptConfig } from './ReceiptConfigLoader';

export interface InvoiceData {
    id: string;
    invoice_number?: string;
    order_ref?: string;
    storeName: string;
    storeAddress?: string;
    storePhone?: string;
    workerName?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    created_at: string;
    items: any[];
    total_price: number;
    subtotal?: number;
    amount_paid?: number;
    change?: number;
    type: 'detail' | 'gros' | 'proforma';
    paymentMethod?: string;
}

export interface InvoiceTemplateProps {
    data: InvoiceData;
    config?: StoreReceiptConfig;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ data, config: propConfig }, ref) => {
    const isProforma = data.type === 'proforma';
    const isCredit = data.paymentMethod === 'credit';
    const { t } = useTranslation();

    const config = propConfig || resolveStoreReceiptConfig({
        name: data.storeName,
        address: data.storeAddress,
        phone: data.storePhone
    });

    const is58mm = config.defaultFormat === 'thermal-58mm';
    const containerWidth = is58mm ? '54mm' : '74mm';
    const pageSize = is58mm ? '58mm auto' : '80mm auto';

    const formattedDate = (() => {
        try {
            return format(new Date(data.created_at || Date.now()), 'dd/MM/yyyy HH:mm');
        } catch {
            return new Date().toLocaleString('fr-FR');
        }
    })();

    // Calculate subtotal if not provided
    const calculatedSubtotal = data.subtotal ?? data.items?.reduce((sum: number, item: any) => {
        const qty = Number(item.quantity ?? item.qty ?? 1);
        const price = Number(item.unit_price ?? item.price ?? item.product?.unit_price ?? 0);
        const packSize = Number(item.product?.quantity_per_box ?? item.conditionnement ?? 1);
        const isBox = Boolean(item.isBox);
        const multiplier = isBox ? packSize : 1;
        return sum + (qty * price * multiplier);
    }, 0) ?? data.total_price;

    const netTotal = Number(data.total_price || 0);
    const amountPaid = data.amount_paid !== undefined ? Number(data.amount_paid) : netTotal;
    const changeAmount = data.change !== undefined ? Number(data.change) : Math.max(0, amountPaid - netTotal);

    const paymentLabel = (() => {
        if (!data.paymentMethod) return 'ESPÈCES';
        const m = data.paymentMethod.toLowerCase();
        if (m === 'cash' || m === 'especes' || m === 'espèces') return 'ESPÈCES';
        if (m === 'credit' || m === 'crédit') return 'CRÉDIT';
        if (m === 'orange_money' || m === 'om') return 'ORANGE MONEY';
        if (m === 'wave') return 'WAVE';
        if (m === 'cheque' || m === 'chèque') return 'CHÈQUE';
        if (m === 'virement') return 'VIREMENT';
        return data.paymentMethod.toUpperCase();
    })();

    const displayPhones = config.phones && config.phones.length > 0
        ? config.phones.join(' / ')
        : (data.storePhone || '');

    return (
        <div
            ref={ref}
            className="bg-white text-black font-sans hidden print:block mx-auto text-left"
            style={{
                width: containerWidth,
                maxWidth: containerWidth,
                margin: '0 auto',
                padding: '3mm 2mm 8mm 2mm',
                boxSizing: 'border-box',
                fontSize: is58mm ? '10px' : '11px',
                lineHeight: 1.25,
                color: '#000',
                backgroundColor: '#fff',
            }}
        >
            <style>{`
                @media print {
                    @page {
                        size: ${pageSize};
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
            <div className="text-center mb-1">
                {/* Logo(s) */}
                {(config.logoUrl || config.secondaryLogoUrl) && (
                    <div className="flex justify-center items-center gap-2 mb-1">
                        {config.logoUrl && (
                            <img
                                src={config.logoUrl}
                                alt={config.businessName}
                                className="h-12 w-auto max-w-[120px] object-contain mx-auto"
                            />
                        )}
                        {config.secondaryLogoUrl && (
                            <img
                                src={config.secondaryLogoUrl}
                                alt="Second Logo"
                                className="h-10 w-auto max-w-[90px] object-contain mx-auto"
                            />
                        )}
                    </div>
                )}

                {config.subHeader && (
                    <h2 className="text-xs font-black tracking-wider uppercase text-black leading-tight">
                        {config.subHeader}
                    </h2>
                )}

                <h1 className="text-sm font-black tracking-wide uppercase text-black leading-tight">
                    {config.businessName || data.storeName}
                </h1>

                {config.tagline && (
                    <p
                        className="text-[9px] font-black uppercase tracking-wider my-0.5"
                        style={{ color: config.accentColor || '#dc2626' }}
                    >
                        {config.tagline}
                    </p>
                )}

                {displayPhones && (
                    <p className="text-[10px] font-bold text-black mt-0.5">
                        Tél: {displayPhones}
                    </p>
                )}

                {(data.storeAddress || config.address) && (
                    <p className="text-[9px] text-gray-700">
                        {data.storeAddress || config.address}
                    </p>
                )}

                {(config.rccm || config.nif) && (
                    <p className="text-[8px] text-gray-600">
                        {config.rccm ? `RCCM: ${config.rccm}` : ''}
                        {config.rccm && config.nif ? ' — ' : ''}
                        {config.nif ? `NIF: ${config.nif}` : ''}
                    </p>
                )}

                {config.socialHandles && (
                    <p className="text-[9px] text-blue-600 font-mono">
                        {config.socialHandles}
                    </p>
                )}
            </div>

            {/* Dashed Separator */}
            <div className="border-b border-dashed border-black my-1.5" />

            {/* Centered Document Badge */}
            <div className="text-center mb-1.5">
                <span className="inline-block font-black text-[11px] uppercase tracking-wider border border-black px-3 py-0.5 rounded">
                    {isProforma
                        ? t('invoice.proforma', 'DEVIS / PROFORMA')
                        : (isCredit
                            ? 'FACTURE À CRÉDIT'
                            : t('invoice.cashReceipt', 'TICKET DE CAISSE'))}
                </span>
            </div>

            {/* 2-Column Metadata Grid */}
            <div className="text-[10px] space-y-0.5 mb-1.5">
                <div className="flex justify-between items-center">
                    <div>
                        <span className="font-semibold">Ticket N°: </span>
                        <span className="font-mono font-bold">{data.invoice_number || data.id?.slice(0, 8)}</span>
                    </div>
                    <div className="text-right">
                        <span>{formattedDate}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    {config.showCashierName !== false && (
                        <div>
                            <span className="font-semibold">Caissier: </span>
                            <span className="font-medium">{data.workerName || 'Caisse'}</span>
                        </div>
                    )}
                    <div className="text-right">
                        <span className="font-semibold">Client: </span>
                        <span className="font-medium">{data.customerName || t('customer.counterClient', 'Comptoir')}</span>
                    </div>
                </div>
                {data.order_ref && (
                    <div className="flex justify-between items-center text-[9px] text-gray-700">
                        <span>Réf Cmd: {data.order_ref}</span>
                        {data.customerPhone && <span>Tél: {data.customerPhone}</span>}
                    </div>
                )}
            </div>

            {/* Dashed Separator */}
            <div className="border-b border-dashed border-black my-1.5" />

            {/* Items Table */}
            <table className="w-full text-[10px] border-collapse mb-1.5">
                <thead>
                    <tr className="border-b border-dashed border-black text-[9px] uppercase font-black">
                        <th className="text-left pb-1">ARTICLE</th>
                        <th className="text-center pb-1 w-6">QTÉ</th>
                        <th className="text-right pb-1 w-12">P.U</th>
                        <th className="text-right pb-1 w-14">TOTAL</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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
                                    <div className="font-bold leading-tight break-words">{name}</div>
                                    {config.showBoxUnits && isBox && packSize > 1 && (
                                        <div className="text-[8px] text-gray-600">Boîte de {packSize}</div>
                                    )}
                                    {config.showDiscounts && discount > 0 && (
                                        <div className="text-[8px] text-gray-600">Remise: -{discount}%</div>
                                    )}
                                </td>
                                <td className="py-1 text-center font-bold">{qty}</td>
                                <td className="py-1 text-right whitespace-nowrap">{price.toLocaleString('fr-FR')}</td>
                                <td className="py-1 text-right font-black whitespace-nowrap">{total.toLocaleString('fr-FR')}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Solid Separator */}
            <div className="border-b border-black my-1.5" />

            {/* Totals Section */}
            <div className="space-y-1 mb-1.5 text-[10px]">
                <div className="flex justify-between items-center text-gray-800">
                    <span>Sous-total:</span>
                    <span className="font-semibold whitespace-nowrap">
                        {calculatedSubtotal.toLocaleString('fr-FR')} FCFA
                    </span>
                </div>
                <div className="flex justify-between items-center text-xs font-black pt-0.5">
                    <span className="uppercase">TOTAL NET:</span>
                    <span className="text-sm font-black whitespace-nowrap">
                        {netTotal.toLocaleString('fr-FR')} FCFA
                    </span>
                </div>

                {!isProforma && (
                    <>
                        <div className="flex justify-between items-center pt-0.5 text-[10px]">
                            <span>Règlement: <strong className="uppercase">{paymentLabel}</strong></span>
                            {paymentLabel !== 'CRÉDIT' && (
                                <span>Reçu: {amountPaid.toLocaleString('fr-FR')} FCFA</span>
                            )}
                        </div>
                        {paymentLabel !== 'CRÉDIT' && changeAmount > 0 && (
                            <div className="flex justify-between items-center text-[10px]">
                                <span>Rendu: {changeAmount.toLocaleString('fr-FR')} FCFA</span>
                                <span />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Dashed Separator */}
            <div className="border-b border-dashed border-black my-1.5" />

            {/* Footer */}
            <div className="text-center text-[9px] text-black space-y-0.5 pt-1">
                {isProforma ? (
                    <p className="italic font-medium text-gray-700">
                        {config.proformaValidity || t('invoice.proformaNote', 'Ce devis est valable 15 jours.')}
                    </p>
                ) : (
                    <>
                        <p className="font-black uppercase tracking-wide">
                            {config.footerNote || 'MERCI POUR VOTRE CONFIANCE !'}
                        </p>
                        {config.returnPolicy && (
                            <p className="text-[8px] text-gray-700 leading-tight">
                                {config.returnPolicy}
                            </p>
                        )}
                        <p className="text-[9px] font-black uppercase text-black pt-1 tracking-wider">
                            {config.businessName || data.storeName}
                        </p>
                    </>
                )}
                <div className="flex items-center justify-center gap-1 opacity-60 grayscale pt-1.5">
                    <span className="text-[8px] font-semibold tracking-wide text-gray-500 uppercase">Propulsé par Djati POS</span>
                    <img src="/jati-icon.png" alt="Djati POS" className="h-2.5 object-contain" />
                </div>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = "InvoiceTemplate";
