import React, { forwardRef } from 'react';
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';
import { InvoiceData } from './InvoiceTemplate';

const HoldingProLogo = () => (
    <div className="w-[100px] shrink-0 flex items-center justify-center">
        <img src="/holding-pro-logo.png" alt="Logo Holding Pro" className="w-[90px] h-[90px] object-contain" />
    </div>
);

export const InvoiceA4Template = forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
    const { t } = useTranslation();

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('fr-FR') + ' FCFA';
    };

    return (
        <div
            ref={ref}
            className="bg-white text-black font-sans hidden print:flex print:flex-col mx-auto relative"
            style={{ width: '210mm', minHeight: '297mm', padding: '10mm 15mm' }}
        >
            {/* Watermark Logo */}
            <div className="absolute inset-0 z-0 pointer-events-none flex flex-col justify-center items-center opacity-[0.05]">
                <img src="/holding-pro-logo.png" alt="Watermark Holding Pro" className="w-[60%] h-auto object-contain" />
            </div>

            {/* Rainbow Top Bar */}
            <div className="rainbow-bar mb-4 z-10" style={{ background: 'linear-gradient(90deg, #f97316, #ec4899, #a855f7, #3b82f6, #22c55e, #eab308, #f97316)', height: '5px', width: '100%', borderRadius: '3px' }} />

            {/* HEADER MODULE */}
            <div className="relative z-10 flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <img src="/holding-pro-logo.png" alt="Logo Holding Pro" style={{ width: '70px', height: '70px', objectFit: 'contain', borderRadius: '50%', border: '2px solid #e5e7eb' }} />
                    <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400">Commerce Général &amp; Services</div>
                        <h1 className="text-3xl font-black tracking-tight leading-none" style={{ background: 'linear-gradient(90deg, #f97316, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            HOLDING PRO
                        </h1>
                        <div className="text-xs font-bold text-gray-700 tracking-wider uppercase mt-0.5">Niamana Dubaï — Bamako, Mali</div>
                        <div className="text-[11px] text-blue-600 font-medium">https://holding-pro.vercel.app/</div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="inline-block bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full mb-1.5 tracking-wider uppercase shadow-sm">
                        TOUJOURS CLIENT SATISFAIT
                    </div>
                    <div className="text-xs font-semibold text-gray-800 leading-relaxed">
                        <p>📞 <span className="text-emerald-700 font-bold">+223 79 34 60 73 / 70 68 21 00 / 71 06 65 75</span></p>
                        <p className="text-gray-500 text-[11px]">{data.storeAddress || 'Niamana Dubaï, en face station Shell'}</p>
                    </div>
                </div>
            </div>

            {/* INVOICE METADATA */}
            <div className="relative z-10 flex justify-between items-start mb-8">
                <div className="w-1/2">
                    <h2 className="text-3xl font-black text-gray-800 uppercase tracking-widest mb-4">
                        {data.type === 'proforma' ? 'Proforma' : 'Facture'}
                    </h2>
                    <div className="grid grid-cols-[100px_1fr] gap-y-0.5 text-sm">
                        <span className="font-bold text-gray-600">N° Facture :</span>
                        <span className="font-mono font-medium text-gray-900">{data.invoice_number || data.id.slice(0, 8)}</span>

                        {data.order_ref && (
                            <>
                                <span className="font-bold text-gray-600">Réf. Cmd :</span>
                                <span className="font-mono font-medium text-gray-900">{data.order_ref}</span>
                            </>
                        )}

                        <span className="font-bold text-gray-600">Date :</span>
                        <span className="font-medium text-gray-900">{format(new Date(data.created_at), 'dd/MM/yyyy HH:mm')}</span>

                        {data.workerName && (
                            <>
                                <span className="font-bold text-gray-600">Vendeur :</span>
                                <span className="font-medium text-gray-900">{data.workerName}</span>
                            </>
                        )}
                        {data.paymentMethod && data.type !== 'proforma' && (
                            <>
                                <span className="font-bold text-gray-600">Paiement :</span>
                                <span className="font-medium text-gray-900 uppercase">{data.paymentMethod}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Client Info Box */}
                {(data.customerName || data.customerPhone || data.customerAddress) && (
                    <div className="w-[45%] border-2 border-gray-300 rounded p-4 bg-gray-50">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Facturé à :</p>
                        {data.customerName && <h3 className="text-lg font-bold text-gray-900 mb-1">{data.customerName}</h3>}
                        {data.customerAddress && <p className="text-sm text-gray-700">{data.customerAddress}</p>}
                        {data.customerPhone && <p className="text-sm text-gray-700">Tel: {data.customerPhone}</p>}
                    </div>
                )}
            </div>

            {/* TABLE OF ITEMS */}
            <div className="flex-grow relative z-10">
                <table className="w-full text-sm border-collapse mb-6">
                    <thead>
                        <tr className="bg-[#1a1a2e] text-white">
                            <th className="py-2.5 px-3 text-left border border-[#1a1a2e] font-semibold">Désignation</th>
                            <th className="py-2.5 px-3 text-center border border-[#1a1a2e] font-semibold w-20">Qté</th>
                            <th className="py-2.5 px-3 text-right border border-[#1a1a2e] font-semibold w-28">Prix U.</th>
                            <th className="py-2.5 px-3 text-right border border-[#1a1a2e] font-semibold w-32">Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? '' : 'bg-gray-50'}>
                                <td className="py-2 px-3 border border-gray-300 font-medium text-gray-900">
                                    {item.product.name}
                                    {item.discount > 0 && (
                                        <span className="ml-2 text-[10px] text-red-600 font-bold bg-red-50 px-1 rounded">
                                            -{item.discount}%
                                        </span>
                                    )}
                                </td>
                                <td className="py-2 px-3 border border-gray-300 text-center text-gray-800">
                                    {item.quantity}
                                    {item.isBox && (
                                        <span className="ml-1 text-[10px] text-blue-600 font-semibold">
                                            ×{item.product.quantity_per_box || 1}
                                        </span>
                                    )}
                                </td>
                                <td className="py-2 px-3 border border-gray-300 text-right text-gray-800">
                                    {formatCurrency(item.unit_price)}
                                </td>
                                <td className="py-2 px-3 border border-gray-300 text-right font-medium text-gray-900">
                                    {formatCurrency(item.lineTotal ?? item.total)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* TOTALS & SUM TEXT */}
                <div className="flex justify-between items-start mt-4">
                    <div className="w-[50%]">
                        <p className="text-sm text-gray-600 italic">
                            Arrêté la présente facture à la somme de :<br />
                            <span className="font-bold text-gray-800">{formatCurrency(data.total_price)}</span>
                        </p>
                    </div>

                    <div className="w-[45%]">
                        <div className="flex justify-between items-center py-2.5 px-3 font-black text-sm text-white rounded-lg border border-gray-300 shadow-sm" style={{ background: 'linear-gradient(135deg, #1a1a2e, #2d1b69)' }}>
                            <span className="mr-4">NET À PAYER :</span>
                            <span className="text-lg font-extrabold" style={{ background: 'linear-gradient(90deg, #f97316, #ec4899, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                {formatCurrency(data.total_price)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SIGNATURES */}
            <div className="flex justify-between mt-12 px-8 relative z-10">
                <div className="text-center w-48">
                    <p className="font-bold text-gray-800 mb-12">Le Client</p>
                    <div className="border-b border-gray-400"></div>
                </div>
                <div className="text-center w-48">
                    <p className="font-bold text-gray-800 mb-12">La Direction</p>
                    <div className="border-b border-gray-400"></div>
                </div>
            </div>

            {/* FOOTER: JATE Watermark */}
            <div className="flex justify-end items-end mt-auto pt-4 border-t border-gray-200 relative z-10">
                <div className="flex items-center gap-2 opacity-50 grayscale">
                    <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Propulsé par JATE</span>
                    <img src="/jati-icon.png" alt="Jate" className="h-6 object-contain" />
                </div>
            </div>

        </div>
    );
});

InvoiceA4Template.displayName = 'InvoiceA4Template';
