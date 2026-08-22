import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Receipt, Invoice } from '../types';
import { ReceiptViewModal } from '../components/receipts/ReceiptViewModal';
import { downloadReceiptPdf } from '../lib/pdfGenerator';
import {
  Receipt as ReceiptIcon,
  Search,
  Download,
  Eye,
  Mail,
  Plus,
  Calendar,
  CreditCard,
  Building2,
  Trash2,
  CheckCircle2,
  DollarSign,
  FileCheck,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export const ReceiptsPage: React.FC = () => {
  const {
    receipts,
    invoices,
    business,
    createReceipt,
    deleteReceipt,
    showToast,
    setActivePage,
    setSelectedInvoiceId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Filtered receipts
  const filteredReceipts = receipts.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.receipt_number.toLowerCase().includes(q) ||
      (r.client?.name || '').toLowerCase().includes(q) ||
      (r.invoice_number || '').toLowerCase().includes(q) ||
      (r.payment_method || '').toLowerCase().includes(q)
    );
  });

  // Calculate stats
  const totalReceiptsCount = receipts.length;
  const totalCollectedAmount = receipts.reduce((acc, r) => acc + (r.amount || 0), 0);
  const paidInvoicesWithoutReceipt = invoices.filter(
    (inv) => inv.status === 'paid' && !receipts.some((r) => r.invoice_id === inv.id)
  );

  const handleOpenReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsViewModalOpen(true);
  };

  const handleDownload = (receipt: Receipt, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReceipt(receipt);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this receipt record?')) {
      await deleteReceipt(id);
    }
  };

  const handleQuickCreate = async (inv: Invoice) => {
    const res = await createReceipt({
      invoice_id: inv.id,
      amount: inv.total,
      currency: inv.currency,
      payment_method: 'Card / Bank Transfer',
      notes: `Receipt for invoice ${inv.number}`,
      payment_date: inv.paid_at || new Date().toISOString(),
    });
    if (res.success && res.receipt) {
      setIsGenerateModalOpen(false);
      setSelectedReceipt(res.receipt);
      setIsViewModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Payment Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Generate, send, and download official payment receipts (REC-XXXX) for settled invoices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Receipt</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Receipts
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalReceiptsCount}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified transactions
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Verified Revenue
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {business.default_currency || 'USD'} {totalCollectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Across all settled receipts
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Receipts
            </span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
              {paidInvoicesWithoutReceipt.length}
            </p>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 block">
              {paidInvoicesWithoutReceipt.length > 0
                ? 'Paid invoices ready for receipt'
                : 'All paid invoices have receipts'}
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/50 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ReceiptIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by receipt #, client name, invoice number, payment method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Receipts Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredReceipts.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-4">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <ReceiptIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No receipts found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                {searchQuery
                  ? 'No receipts matched your search query.'
                  : 'Receipts are generated when invoices are marked as paid or created directly.'}
              </p>
            </div>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate First Receipt</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Receipt #</th>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Invoice Ref</th>
                  <th className="px-5 py-3.5">Payment Date</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5 text-right">Amount Paid</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReceipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    onClick={() => handleOpenReceipt(receipt)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      {receipt.receipt_number}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {receipt.client?.name || 'Client'}
                      </div>
                      {receipt.client?.company && (
                        <div className="text-xs text-slate-400">{receipt.client.company}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {receipt.invoice_number ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs">
                          {receipt.invoice_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Direct Receipt</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {new Date(receipt.payment_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-medium">
                        {receipt.payment_method || 'Card'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {receipt.currency} {receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenReceipt(receipt)}
                          title="View Receipt"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDownload(receipt, e)}
                          title="Download PDF"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(receipt.id, e)}
                          title="Delete Receipt"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Generate Modal from Invoices */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Generate Receipt from Paid Invoice
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            {paidInvoicesWithoutReceipt.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  There are no paid invoices pending receipt generation. You can create receipts for invoices once their status is changed to "PAID".
                </p>
                <button
                  onClick={() => {
                    setIsGenerateModalOpen(false);
                    setActivePage('invoices');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
                >
                  Go to Invoices
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a settled invoice below to generate an official REC-XXXX receipt:
                </p>
                {paidInvoicesWithoutReceipt.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 flex items-center justify-between transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/40"
                    onClick={() => handleQuickCreate(inv)}
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {inv.number} — {inv.client?.name || 'Client'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Paid on {new Date(inv.paid_at || inv.due_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {inv.currency} {(Number(inv.total) || 0).toFixed(2)}
                      </div>
                      <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5 justify-end">
                        Create Receipt <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt View Modal */}
      <ReceiptViewModal
        receipt={selectedReceipt}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedReceipt(null);
        }}
      />
    </div>
  );
};
