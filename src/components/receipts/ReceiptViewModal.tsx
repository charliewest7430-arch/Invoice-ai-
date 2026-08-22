import React, { useState } from 'react';
import { Receipt } from '../../types';
import { useApp } from '../../context/AppContext';
import { defaultEmailService } from '../../services/emailService';
import { downloadReceiptPdf } from '../../lib/pdfGenerator';
import {
  X,
  Download,
  Mail,
  Printer,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  FileText,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface ReceiptViewModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({ receipt, isOpen, onClose }) => {
  const { business, showToast } = useApp();
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen || !receipt) return null;

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadReceiptPdf(receipt, business);
      showToast(`Receipt ${receipt.receipt_number} downloaded successfully`, 'success');
    } catch (e: any) {
      console.warn('PDF download error:', e);
      showToast('Failed to download receipt PDF', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    const clientEmail = receipt.client?.email;
    if (!clientEmail) {
      showToast('Client email is missing.', 'error');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await defaultEmailService.sendReceiptEmail({
        to: { name: receipt.client?.name || 'Client', email: clientEmail },
        clientName: receipt.client?.name || 'Valued Client',
        receiptNumber: receipt.receipt_number,
        invoiceNumber: receipt.invoice_number || 'INV',
        amount: receipt.amount,
        currency: receipt.currency,
        paymentDate: receipt.payment_date,
        paymentMethod: receipt.payment_method || 'Card',
        businessName: business.name,
      });

      if (res.success) {
        showToast(`Receipt sent to ${clientEmail}`, 'success');
      } else {
        showToast(res.message || 'Failed to send receipt email', 'error');
      }
    } catch (e: any) {
      showToast('Failed to send receipt email', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const formattedDate = new Date(receipt.payment_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Official Payment Receipt
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {receipt.receipt_number}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print Receipt"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              title="Download PDF"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Download className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail || !receipt.client?.email}
              title={receipt.client?.email ? `Email to ${receipt.client.email}` : 'No client email'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              <span>Send Email</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id={`receipt-printable-${receipt.id}`} className="p-8 space-y-6 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          {/* Top Brand & Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {business.name || 'InvoiceFlow Business'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {business.email} {business.phone ? `• ${business.phone}` : ''}
              </p>
              {business.address && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {business.address}, {business.city} {business.country}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-full uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Payment Complete</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Receipt #{receipt.receipt_number}
              </p>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Received From</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {receipt.client?.name || 'Valued Client'}
              </p>
              {receipt.client?.company && (
                <p className="text-slate-600 dark:text-slate-300">{receipt.client.company}</p>
              )}
              {receipt.client?.email && (
                <p className="text-slate-500 dark:text-slate-400">{receipt.client.email}</p>
              )}
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Payment Summary</span>
              <p className="text-slate-700 dark:text-slate-200">
                <span className="text-slate-500 dark:text-slate-400">Date:</span> {formattedDate}
              </p>
              <p className="text-slate-700 dark:text-slate-200">
                <span className="text-slate-500 dark:text-slate-400">Method:</span> {receipt.payment_method || 'Credit Card / Electronic'}
              </p>
              {receipt.invoice_number && (
                <p className="text-slate-700 dark:text-slate-200">
                  <span className="text-slate-500 dark:text-slate-400">Invoice Ref:</span> #{receipt.invoice_number}
                </p>
              )}
            </div>
          </div>

          {/* Items breakdown if available */}
          {receipt.items && receipt.items.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Services & Items Included
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Item Description</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Price</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {receipt.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                          {item.description}
                        </td>
                        <td className="px-4 py-2.5 text-center text-slate-500 dark:text-slate-400">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-300">
                          {receipt.currency} {(Number(item.unit_price) || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800 dark:text-slate-100">
                          {receipt.currency} {(Number(item.amount) || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Amount Paid Big Total Box */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                Total Amount Paid
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Payment verified & cleared in full
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {receipt.currency} {receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Notes or Terms */}
          {receipt.notes && (
            <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Notes: </span>
              {receipt.notes}
            </div>
          )}

          {/* Footer guarantee */}
          <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 pt-4">
            Thank you for your prompt payment and continued partnership!
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Download Official PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
