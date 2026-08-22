import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InvoiceStatus, Invoice, Receipt } from '../types';
import { exportInvoicesToCsv } from '../lib/csvExport';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatCurrencyAmount } from '../lib/exchangeRates';
import { ReceiptViewModal } from '../components/receipts/ReceiptViewModal';
import { SendReminderModal } from '../components/reminders/SendReminderModal';
import { ReminderSettingsModal } from '../components/reminders/ReminderSettingsModal';
import {
  FileText,
  Search,
  Plus,
  Sparkles,
  Download,
  Trash2,
  CheckCircle2,
  Filter,
  Eye,
  Edit3,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  ChevronDown,
  Bell,
  Receipt as ReceiptIcon,
} from 'lucide-react';

interface InvoicesPageProps {
  onOpenNewInvoice: () => void;
  onOpenAiModal: () => void;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({
  onOpenNewInvoice,
  onOpenAiModal,
}) => {
  const {
    invoices,
    receipts,
    createReceipt,
    updateInvoiceStatus,
    deleteInvoice,
    setSelectedInvoiceId,
    setEditingInvoice,
    setActivePage,
    logActivity,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<Invoice | null>(null);
  const [isReminderSettingsOpen, setIsReminderSettingsOpen] = useState(false);
  const [reminderTargetInvoice, setReminderTargetInvoice] = useState<Invoice | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const handleOpenReceiptForInvoice = async (inv: Invoice) => {
    const matchingReceipt = receipts.find((r) => r.invoice_id === inv.id);
    if (matchingReceipt) {
      setActiveReceipt(matchingReceipt);
      setIsReceiptModalOpen(true);
    } else {
      showToast('Generating official receipt...', 'info');
      const res = await createReceipt({
        invoice_id: inv.id,
        amount: inv.total,
        currency: inv.currency,
        payment_method: 'Card / Electronic',
        payment_date: inv.paid_at || new Date().toISOString(),
        notes: `Settlement for invoice ${inv.number}`,
      });
      if (res.success && res.receipt) {
        setActiveReceipt(res.receipt);
        setIsReceiptModalOpen(true);
      }
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesTab = activeTab === 'all' || inv.status === activeTab;
    const matchesSearch =
      inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleExportCsv = () => {
    if (invoices.length === 0) {
      showToast('No invoices to export', 'info');
      return;
    }
    exportInvoicesToCsv(filteredInvoices.length > 0 ? filteredInvoices : invoices);
    logActivity('csv_exported', `Exported ${invoices.length} invoices to CSV`);
    showToast(`Exported ${filteredInvoices.length > 0 ? filteredInvoices.length : invoices.length} invoices to CSV`, 'success');
  };

  const tabs = [
    { id: 'all', label: 'All Invoices', count: invoices.length },
    { id: 'paid', label: 'Paid', count: invoices.filter((i) => i.status === 'paid').length },
    { id: 'sent', label: 'Pending / Sent', count: invoices.filter((i) => i.status === 'sent' || i.status === 'draft').length },
    { id: 'overdue', label: 'Overdue', count: invoices.filter((i) => i.status === 'overdue').length },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoices Directory</h1>
          <p className="text-xs text-slate-500">Manage, issue, track, and download customer invoices</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsReminderSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Configure Automatic Reminder Rules"
          >
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Reminders</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-2xs"
            title="Export invoices list to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Prompt Invoice</span>
          </button>

          <button
            onClick={onOpenNewInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-slate-50 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice # or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs">
        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 pl-6">Invoice #</th>
                  <th className="py-3.5">Client & Company</th>
                  <th className="py-3.5">Dates</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5 text-right">Amount</th>
                  <th className="py-3.5 text-center pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    {/* Invoice Number */}
                    <td
                      onClick={() => {
                        setSelectedInvoiceId(inv.id);
                        setActivePage('invoice_detail');
                      }}
                      className="py-4 pl-6"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {inv.number}
                          </p>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            {inv.template || 'Modern'} Template
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Client Name */}
                    <td
                      onClick={() => {
                        setSelectedInvoiceId(inv.id);
                        setActivePage('invoice_detail');
                      }}
                      className="py-4 font-semibold text-slate-700"
                    >
                      <p className="text-slate-900 font-bold">{inv.client?.name || 'No Client'}</p>
                      <p className="text-[11px] text-slate-400">{inv.client?.company || inv.client?.email || '—'}</p>
                    </td>

                    {/* Dates */}
                    <td
                      onClick={() => {
                        setSelectedInvoiceId(inv.id);
                        setActivePage('invoice_detail');
                      }}
                      className="py-4 text-slate-500 font-medium"
                    >
                      <p className="text-slate-700">Issued: {inv.issue_date || 'Today'}</p>
                      <p className="text-[11px] text-slate-400">Due: {inv.due_date || 'Upon Receipt'}</p>
                    </td>

                    {/* Status Badge */}
                    <td
                      onClick={() => {
                        setSelectedInvoiceId(inv.id);
                        setActivePage('invoice_detail');
                      }}
                      className="py-4"
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'overdue'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : inv.status === 'sent'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {inv.status === 'paid' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : inv.status === 'overdue' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>{inv.status}</span>
                      </span>
                    </td>

                    {/* Amount */}
                    <td
                      onClick={() => {
                        setSelectedInvoiceId(inv.id);
                        setActivePage('invoice_detail');
                      }}
                      className="py-4 text-right font-black text-slate-900 text-sm"
                    >
                      {formatCurrencyAmount(inv.total, inv.currency || 'USD')}
                    </td>

                    {/* Actions */}
                    <td className="py-4 pr-6 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoiceId(inv.id);
                            setActivePage('invoice_detail');
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingInvoice(inv);
                            setActivePage('new_invoice');
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoiceId(inv.id);
                            setActivePage('invoice_detail');
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View / Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {inv.status === 'paid' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReceiptForInvoice(inv);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View / Generate Official Receipt"
                          >
                            <ReceiptIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReminderTargetInvoice(inv);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Send Payment Reminder"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMarkPaidTarget(inv);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(inv.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Invoice"
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
        ) : (
          <div className="p-16 text-center space-y-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">No invoices matching your criteria</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Create a new invoice manually or use our Gemini AI prompt tool to generate one in seconds.
              </p>
            </div>
            <button
              onClick={onOpenNewInvoice}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Invoice</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <ConfirmModal
          title="Delete Invoice"
          message="Are you sure you want to delete this invoice? This will permanently remove it from your records."
          confirmText="Delete Invoice"
          confirmVariant="danger"
          onConfirm={async () => {
            await deleteInvoice(deleteTargetId);
            setDeleteTargetId(null);
            showToast('Invoice deleted successfully', 'success');
          }}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}

      {/* Mark Paid Modal */}
      {markPaidTarget && (
        <ConfirmModal
          title="Mark Invoice as Paid"
          message={`Confirm settlement of ${formatCurrencyAmount(markPaidTarget.total, markPaidTarget.currency || 'USD')} for invoice ${markPaidTarget.number}?`}
          confirmText="Mark as Paid"
          confirmVariant="primary"
          onConfirm={async () => {
            await updateInvoiceStatus(markPaidTarget.id, 'paid');
            setMarkPaidTarget(null);
            showToast(`Invoice ${markPaidTarget.number} marked as Paid!`, 'success');
          }}
          onCancel={() => setMarkPaidTarget(null)}
        />
      )}

      {/* Reminder Automation Rules Settings Modal */}
      <ReminderSettingsModal
        isOpen={isReminderSettingsOpen}
        onClose={() => setIsReminderSettingsOpen(false)}
      />

      {/* Overdue Payment Reminder Modal */}
      {reminderTargetInvoice && (
        <SendReminderModal
          invoice={reminderTargetInvoice}
          isOpen={Boolean(reminderTargetInvoice)}
          onClose={() => setReminderTargetInvoice(null)}
        />
      )}

      {/* Official Receipt View Modal */}
      <ReceiptViewModal
        receipt={activeReceipt}
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setActiveReceipt(null);
        }}
      />
    </div>
  );
};
