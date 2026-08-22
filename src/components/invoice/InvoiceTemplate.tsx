import React from 'react';
import { Invoice, Business, SUPPORTED_CURRENCIES, InvoiceTemplateId } from '../../types';

export interface TemplateDefinition {
  id: InvoiceTemplateId;
  name: string;
  description: string;
  badgeColor: string;
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary & sleek with indigo accents and clean typography',
    badgeColor: 'bg-indigo-500 text-white',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Executive navy headers, formal structured boxes & remittance layout',
    badgeColor: 'bg-blue-900 text-white',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Pure monochrome elegance, generous whitespace & hairline dividers',
    badgeColor: 'bg-slate-800 text-slate-100',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Structured enterprise format with boxed metadata & zebra tables',
    badgeColor: 'bg-slate-900 text-amber-300',
  },
];

interface InvoiceTemplateProps {
  invoice: Invoice;
  business: Business;
  id?: string;
  forcedTemplate?: InvoiceTemplateId;
}

const formatNum = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null) return '0.00';
  const num = typeof val === 'number' ? val : Number(val);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  business,
  id = 'printable-invoice-element',
  forcedTemplate,
}) => {
  const activeTemplate: InvoiceTemplateId = forcedTemplate || invoice.template || 'modern';

  const currencyObj = SUPPORTED_CURRENCIES.find((c) => c.code === invoice.currency) || {
    symbol: invoice.currency === 'USD' ? '$' : invoice.currency === 'GBP' ? '£' : invoice.currency === 'EUR' ? '€' : '$',
    code: invoice.currency,
  };

  const client = invoice.client;

  // -------------------------------------------------------------
  // 1. MODERN TEMPLATE
  // -------------------------------------------------------------
  if (activeTemplate === 'modern') {
    return (
      <div
        id={id}
        className="bg-white text-slate-900 p-8 sm:p-12 font-sans max-w-[800px] mx-auto shadow-xl border border-slate-200 rounded-2xl print:shadow-none print:border-none print:p-0 print:m-0"
        style={{ minHeight: '1000px' }}
      >
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
          <div className="space-y-3">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="h-12 w-auto max-w-[200px] object-contain" />
            ) : (
              <div className="text-2xl font-black text-indigo-900 tracking-tight">{business.name}</div>
            )}
            <div className="text-xs text-slate-600 space-y-0.5 leading-relaxed">
              <p className="font-semibold text-slate-800">{business.name}</p>
              {business.address && <p>{business.address}</p>}
              {(business.city || business.country) && (
                <p>
                  {business.city}
                  {business.city && business.country ? ', ' : ''}
                  {business.country}
                </p>
              )}
              {business.email && <p>Email: {business.email}</p>}
              {business.phone && <p>Tel: {business.phone}</p>}
              {business.tax_id && <p className="font-medium text-slate-700">Tax ID / VAT: {business.tax_id}</p>}
            </div>
          </div>

          <div className="sm:text-right space-y-2">
            <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider">
              INVOICE
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{invoice.number}</h2>
            <div>
              <span
                className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  invoice.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : invoice.status === 'overdue'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : invoice.status === 'sent'
                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Client & Date Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-200 text-xs">
          <div className="space-y-1.5 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Billed To</span>
            <p className="text-sm font-bold text-slate-900">{client?.name || 'Valued Client'}</p>
            {client?.company && <p className="font-semibold text-slate-700">{client.company}</p>}
            {client?.address && <p className="text-slate-600">{client.address}</p>}
            {(client?.city || client?.country) && (
              <p className="text-slate-600">
                {client.city}
                {client.city && client.country ? ', ' : ''}
                {client.country}
              </p>
            )}
            {client?.email && <p className="text-slate-600">Email: {client.email}</p>}
            {client?.tax_id && <p className="text-slate-600 font-medium">VAT / Tax ID: {client.tax_id}</p>}
          </div>

          <div className="sm:text-right space-y-2 flex flex-col justify-center">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Issue Date</span>
              <span className="font-semibold text-slate-800 text-xs">{invoice.issue_date}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Due Date</span>
              <span className="font-bold text-slate-900 text-xs">{invoice.due_date}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Currency</span>
              <span className="font-semibold text-slate-800 text-xs">{invoice.currency} ({currencyObj.symbol})</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-indigo-100 text-indigo-950 font-bold uppercase text-[10px] tracking-wider bg-indigo-50/50">
                <th className="py-3 px-3 rounded-l-lg">Description</th>
                <th className="py-3 px-2 text-center w-16">Qty</th>
                <th className="py-3 px-2 text-right w-24">Unit Price</th>
                <th className="py-3 px-3 text-right w-28 rounded-r-lg">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-3 font-medium text-slate-800 leading-relaxed">{item.description}</td>
                  <td className="py-3.5 px-2 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-3.5 px-2 text-right text-slate-600">
                    {currencyObj.symbol}
                    {formatNum(item.unit_price)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                    {currencyObj.symbol}
                    {formatNum(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Notes */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-slate-200 pt-6">
          <div className="flex-1 space-y-4 text-xs">
            {business.bank_details && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">Payment Instructions</span>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed font-mono text-[11px]">{business.bank_details}</p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-1">Notes</span>
                <p className="text-slate-600 leading-relaxed">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-1">Terms</span>
                <p className="text-slate-500 text-[11px] leading-relaxed">{invoice.terms}</p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">
                {currencyObj.symbol}
                {formatNum(invoice.subtotal)}
              </span>
            </div>
            {Number(invoice.discount || 0) > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">-{currencyObj.symbol}{formatNum(invoice.discount)}</span>
              </div>
            )}
            {Number(invoice.tax_rate || 0) > 0 && (
              <div className="flex justify-between py-1 text-slate-600">
                <span>Tax ({invoice.tax_rate}%)</span>
                <span className="font-semibold text-slate-800">
                  {currencyObj.symbol}
                  {formatNum(invoice.tax_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-indigo-600 pt-3 text-sm font-extrabold text-slate-900 bg-indigo-50/50 p-2.5 rounded-xl">
              <span>Total Due</span>
              <span className="text-indigo-600">
                {currencyObj.symbol}
                {formatNum(invoice.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
          <p>Thank you for your business. Generated by {business.name} via InvoiceFlow AI.</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. PROFESSIONAL TEMPLATE
  // -------------------------------------------------------------
  if (activeTemplate === 'professional') {
    return (
      <div
        id={id}
        className="bg-white text-slate-900 font-sans max-w-[800px] mx-auto shadow-xl border border-slate-300 rounded-lg overflow-hidden print:shadow-none print:border-none print:p-0 print:m-0"
        style={{ minHeight: '1000px' }}
      >
        {/* Executive Header Banner */}
        <div className="bg-slate-900 text-white p-8 sm:p-10 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="h-10 w-auto max-w-[180px] object-contain mb-2 brightness-200" />
            ) : (
              <h1 className="text-2xl font-black tracking-wide text-white uppercase">{business.name}</h1>
            )}
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed mt-1">
              {[business.address, business.city, business.country].filter(Boolean).join(', ')}
            </p>
            <p className="text-xs text-slate-400">{business.email} {business.phone ? `• ${business.phone}` : ''}</p>
          </div>

          <div className="sm:text-right">
            <h2 className="text-3xl font-black tracking-widest text-slate-100">INVOICE</h2>
            <p className="text-sm font-mono font-bold text-amber-400 mt-1">#{invoice.number}</p>
            <div className="mt-2 inline-block px-3 py-1 bg-slate-800 border border-slate-700 text-[10px] font-extrabold uppercase tracking-widest text-slate-200 rounded">
              Status: {invoice.status}
            </div>
          </div>
        </div>

        {/* 2-Box Metadata Row */}
        <div className="p-8 sm:p-10 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Box 1: Billed To */}
            <div className="border border-slate-300 rounded-lg p-4 bg-slate-50/60">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-2">
                INVOICE TO (CLIENT)
              </h4>
              <p className="text-sm font-black text-slate-900">{client?.name || 'Valued Client'}</p>
              {client?.company && <p className="text-xs font-bold text-slate-700">{client.company}</p>}
              {client?.address && <p className="text-xs text-slate-600 mt-1">{client.address}</p>}
              {(client?.city || client?.country) && (
                <p className="text-xs text-slate-600">{[client.city, client.country].filter(Boolean).join(', ')}</p>
              )}
              {client?.email && <p className="text-xs text-slate-600 mt-1">Email: {client.email}</p>}
              {client?.tax_id && <p className="text-xs text-slate-600">Tax ID: {client.tax_id}</p>}
            </div>

            {/* Box 2: Invoice Details */}
            <div className="border border-slate-300 rounded-lg p-4 bg-slate-50/60">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-2">
                INVOICE METRICS
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Invoice Date</span>
                  <span className="font-bold text-slate-800">{invoice.issue_date}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Due Date</span>
                  <span className="font-bold text-rose-700">{invoice.due_date}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Currency</span>
                  <span className="font-bold text-slate-800">{invoice.currency}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Tax ID / VAT</span>
                  <span className="font-bold text-slate-800">{business.tax_id || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Structured Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-white font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-3 text-center w-16">Qty</th>
                  <th className="py-3 px-3 text-right w-24">Rate</th>
                  <th className="py-3 px-4 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{item.description}</td>
                    <td className="py-3.5 px-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-3.5 px-3 text-right text-slate-600">
                      {currencyObj.symbol}
                      {formatNum(item.unit_price)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {currencyObj.symbol}
                      {formatNum(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Executive Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-slate-300 pt-6">
            <div className="space-y-3 text-xs">
              {business.bank_details && (
                <div className="p-3.5 border border-slate-300 rounded bg-slate-50 space-y-1">
                  <p className="font-bold text-slate-800 uppercase text-[10px]">Wire / Remittance Instructions</p>
                  <p className="font-mono text-[11px] text-slate-700 whitespace-pre-line">{business.bank_details}</p>
                </div>
              )}
              {invoice.notes && (
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-700 text-[10px] uppercase block">Special Notes:</span>
                  <p>{invoice.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">{currencyObj.symbol}{formatNum(invoice.subtotal)}</span>
              </div>
              {Number(invoice.discount || 0) > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700">
                  <span>Discount Applied</span>
                  <span className="font-bold">-{currencyObj.symbol}{formatNum(invoice.discount)}</span>
                </div>
              )}
              {Number(invoice.tax_rate || 0) > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
                  <span>Tax ({invoice.tax_rate}%)</span>
                  <span className="font-bold text-slate-900">{currencyObj.symbol}{formatNum(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 bg-slate-900 text-white px-4 rounded font-black text-sm">
                <span>TOTAL PAYABLE</span>
                <span className="text-amber-400">{currencyObj.symbol}{formatNum(invoice.total)}</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 text-center text-[10px] text-slate-500 font-medium">
            <p>Official Invoice • {business.name} • Registered Business Partner</p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. MINIMAL TEMPLATE
  // -------------------------------------------------------------
  if (activeTemplate === 'minimal') {
    return (
      <div
        id={id}
        className="bg-white text-slate-900 p-8 sm:p-14 font-sans max-w-[800px] mx-auto border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0"
        style={{ minHeight: '1000px' }}
      >
        {/* Minimal Header */}
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 border-b-2 border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-slate-950">{business.name}</h1>
            <p className="text-xs text-slate-500 mt-1">{business.email} {business.phone ? `• ${business.phone}` : ''}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Invoice</p>
            <p className="text-xl font-mono font-normal text-slate-900">{invoice.number}</p>
          </div>
        </div>

        {/* Minimal Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-b border-slate-100 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">To</p>
            <p className="font-semibold text-slate-900 mt-1">{client?.name || 'Client'}</p>
            {client?.company && <p className="text-slate-600">{client.company}</p>}
            {client?.email && <p className="text-slate-500">{client.email}</p>}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Issued</p>
            <p className="font-mono text-slate-800 mt-1">{invoice.issue_date}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mt-3">Due</p>
            <p className="font-mono text-slate-900 font-semibold">{invoice.due_date}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Status</p>
            <p className="uppercase tracking-wider font-bold text-slate-800 mt-1">{invoice.status}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mt-3">Currency</p>
            <p className="text-slate-700">{invoice.currency}</p>
          </div>
        </div>

        {/* Minimal Items Table */}
        <div className="py-8">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="pb-3 pr-4 font-normal">Description</th>
                <th className="pb-3 px-2 text-center w-14 font-normal">Qty</th>
                <th className="pb-3 px-2 text-right w-24 font-normal">Price</th>
                <th className="pb-3 pl-2 text-right w-28 font-normal">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-4 pr-4 font-normal text-slate-800">{item.description}</td>
                  <td className="py-4 px-2 text-center text-slate-500 font-mono">{item.quantity}</td>
                  <td className="py-4 px-2 text-right text-slate-500 font-mono">
                    {currencyObj.symbol}
                    {formatNum(item.unit_price)}
                  </td>
                  <td className="py-4 pl-2 text-right font-mono font-medium text-slate-900">
                    {currencyObj.symbol}
                    {formatNum(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Minimal Totals */}
        <div className="flex flex-col sm:flex-row justify-between gap-8 border-t border-slate-200 pt-6">
          <div className="text-xs text-slate-500 space-y-3 flex-1">
            {business.bank_details && (
              <div>
                <p className="font-medium text-slate-700 text-[10px] uppercase tracking-wider">Payment Instructions</p>
                <p className="font-mono text-[11px] text-slate-600 mt-1 whitespace-pre-line">{business.bank_details}</p>
              </div>
            )}
            {invoice.notes && <p className="italic text-slate-600">{invoice.notes}</p>}
          </div>

          <div className="w-full sm:w-56 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">Subtotal</span>
              <span>{currencyObj.symbol}{formatNum(invoice.subtotal)}</span>
            </div>
            {Number(invoice.tax_rate || 0) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Tax ({invoice.tax_rate}%)</span>
                <span>{currencyObj.symbol}{formatNum(invoice.tax_amount)}</span>
              </div>
            )}
            {Number(invoice.discount || 0) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Discount</span>
                <span>-{currencyObj.symbol}{formatNum(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-900 pt-2 text-base font-bold text-slate-950">
              <span className="font-sans">Total</span>
              <span>{currencyObj.symbol}{formatNum(invoice.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-slate-100 text-center text-[10px] text-slate-400">
          <p>{business.name} • Thank you for your business</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. CORPORATE TEMPLATE (Default fallback)
  // -------------------------------------------------------------
  return (
    <div
      id={id}
      className="bg-white text-slate-900 font-sans max-w-[800px] mx-auto shadow-2xl border border-slate-300 rounded-xl overflow-hidden print:shadow-none print:border-none print:p-0 print:m-0"
      style={{ minHeight: '1000px' }}
    >
      {/* Top Corporate Bar */}
      <div className="bg-slate-900 text-slate-100 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-b-4 border-amber-500">
        <div className="flex items-center gap-4">
          {business.logo_url ? (
            <img src={business.logo_url} alt={business.name} className="h-12 w-auto object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center">
              {business.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">{business.name}</h1>
            <p className="text-xs text-slate-400">Corporate Commercial Invoice</p>
          </div>
        </div>

        <div className="text-center sm:text-right">
          <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Invoice Document Ref</div>
          <div className="text-xl font-mono font-black text-white">{invoice.number}</div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* 3-Column Corporate Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Seller Entity</span>
            <p className="font-bold text-slate-900 mt-1">{business.name}</p>
            <p className="text-slate-600">{business.address}</p>
            <p className="text-slate-600">{[business.city, business.country].filter(Boolean).join(', ')}</p>
            {business.tax_id && <p className="text-slate-600 font-medium">EIN/VAT: {business.tax_id}</p>}
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Client / Buyer</span>
            <p className="font-bold text-slate-900 mt-1">{client?.name || 'Valued Client'}</p>
            {client?.company && <p className="font-semibold text-slate-700">{client.company}</p>}
            <p className="text-slate-600">{client?.email}</p>
            {client?.tax_id && <p className="text-slate-600">Client Tax ID: {client.tax_id}</p>}
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Payment Terms & Dates</span>
            <p className="text-slate-700 mt-1"><span className="font-semibold">Issue:</span> {invoice.issue_date}</p>
            <p className="text-slate-700"><span className="font-semibold">Due:</span> {invoice.due_date}</p>
            <p className="text-slate-700"><span className="font-semibold">Terms:</span> {invoice.terms || business.payment_terms || 'Net 14'}</p>
            <div className="mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-800">
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Corporate Table */}
        <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3">Item #</th>
              <th className="py-3 px-3">Line Description</th>
              <th className="py-3 px-3 text-center w-16">Quantity</th>
              <th className="py-3 px-3 text-right w-24">Unit Rate</th>
              <th className="py-3 px-4 text-right w-28">Net Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => (
              <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{String(idx + 1).padStart(2, '0')}</td>
                <td className="py-3 px-3 font-semibold text-slate-800">{item.description}</td>
                <td className="py-3 px-3 text-center text-slate-600">{item.quantity}</td>
                <td className="py-3 px-3 text-right text-slate-600">
                  {currencyObj.symbol}
                  {formatNum(item.unit_price)}
                </td>
                <td className="py-3 px-4 text-right font-black text-slate-900">
                  {currencyObj.symbol}
                  {formatNum(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Corporate Summary & Authorization Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-300 pt-6">
          <div className="space-y-4 text-xs">
            {business.bank_details && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-900 uppercase text-[10px]">Banking & Settlement Details</span>
                <p className="font-mono text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">{business.bank_details}</p>
              </div>
            )}
            {invoice.notes && (
              <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-lg text-slate-700">
                <span className="font-bold text-amber-900 uppercase text-[10px] block mb-1">Commercial Notes</span>
                <p>{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between text-slate-700 py-1">
              <span>Subtotal (Excl. Tax)</span>
              <span className="font-bold text-slate-900">{currencyObj.symbol}{formatNum(invoice.subtotal)}</span>
            </div>
            {Number(invoice.discount || 0) > 0 && (
              <div className="flex justify-between text-emerald-700 py-1">
                <span>Contract Discount</span>
                <span className="font-bold">-{currencyObj.symbol}{formatNum(invoice.discount)}</span>
              </div>
            )}
            {Number(invoice.tax_rate || 0) > 0 && (
              <div className="flex justify-between text-slate-700 py-1">
                <span>Sales Tax / VAT ({invoice.tax_rate}%)</span>
                <span className="font-bold text-slate-900">{currencyObj.symbol}{formatNum(invoice.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-slate-900 pt-3 text-base font-black text-slate-950">
              <span>Grand Total</span>
              <span className="text-amber-600">{currencyObj.symbol}{formatNum(invoice.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
          <p>Invoice generated by {business.name} • Powered by InvoiceFlow AI Enterprise</p>
        </div>
      </div>
    </div>
  );
};
