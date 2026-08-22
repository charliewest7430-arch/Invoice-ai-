import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InvoiceTemplate } from '../components/invoice/InvoiceTemplate';
import { downloadInvoicePdf } from '../lib/pdfGenerator';
import { defaultEmailService } from '../services/emailService';
import { openPaystackModal } from '../lib/paystack';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { ReceiptViewModal } from '../components/receipts/ReceiptViewModal';
import { SendReminderModal } from '../components/reminders/SendReminderModal';
import {
  ArrowLeft,
  Download,
  Mail,
  CreditCard,
  CheckCircle2,
  Trash2,
  Printer,
  Sparkles,
  X,
  Send,
  Loader2,
  Edit3,
  Palette,
  LayoutTemplate,
  Check,
  Receipt as ReceiptIcon,
  Bell,
} from 'lucide-react';
import { InvoiceTemplateId, INVOICE_TEMPLATES, Receipt } from '../types';

export const InvoiceDetailPage: React.FC = () => {
  const {
    selectedInvoiceId,
    invoices,
    receipts,
    createReceipt,
    business,
    setActivePage,
    updateInvoiceStatus,
    updateInvoice,
    deleteInvoice,
    setEditingInvoice,
    logActivity,
    showToast,
  } = useApp();

  const invoice = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateId>(invoice?.template || 'modern');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);
  const [emailNote, setEmailNote] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  if (!invoice) {
    return (
      <div className="p-16 text-center space-y-4 bg-white border border-slate-200/80 rounded-3xl shadow-2xs">
        <p className="text-slate-600 font-bold text-sm">Invoice not found.</p>
        <button
          onClick={() => setActivePage('invoices')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          Return to Invoices
        </button>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    showToast('Rendering professional PDF...', 'info');
    const success = await downloadInvoicePdf('printable-invoice-element', `Invoice-${invoice.number}.pdf`);
    setIsDownloading(false);
    if (success) {
      logActivity('pdf_downloaded', `Downloaded PDF for invoice ${invoice.number} (${invoice.currency} ${(Number(invoice.total) || 0).toFixed(2)})`);
      showToast(`Invoice-${invoice.number}.pdf downloaded!`, 'success');
    } else {
      showToast("We couldn't generate the PDF. Please try again.", 'error');
    }
  };

  const handleSaveTemplateChange = async (newTmpl: InvoiceTemplateId) => {
    setSelectedTemplate(newTmpl);
    await updateInvoice(invoice.id, { template: newTmpl });
    showToast(`Template updated to ${newTmpl.toUpperCase()}`, 'success');
  };

  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoice.client?.email || !invoice.client.email.trim()) {
      showToast('This client does not have an email address. Add an email address before sending the invoice.', 'error');
      return;
    }

    setIsSendingEmail(true);

    const result = await defaultEmailService.sendInvoiceEmail({
      to: { email: invoice.client.email, name: invoice.client.name },
      invoiceNumber: invoice.number,
      invoiceId: invoice.id,
      businessName: business.name || 'My Business',
      clientName: invoice.client?.name || 'Client',
      currency: invoice.currency,
      amount: invoice.total,
      dueDate: invoice.due_date,
      issueDate: invoice.issue_date,
      status: invoice.status,
      paymentLink: `${window.location.protocol}//${window.location.host}/pay/${invoice.id}`,
      customNote: emailNote,
    });

    setIsSendingEmail(false);

    if (result.success) {
      setIsEmailModalOpen(false);
      showToast('Invoice sent successfully', 'success');
      const targetStatus = invoice.status === 'draft' ? 'sent' : invoice.status;
      updateInvoiceStatus(invoice.id, targetStatus, new Date().toISOString());
    } else {
      showToast(result.message || 'Failed to send invoice email.', 'error');
    }
  };

  const handlePaystackPay = () => {
    if (invoice.status === 'paid') {
      showToast('This invoice has already been paid.', 'info');
      return;
    }

    openPaystackModal({
      email: invoice.client?.email || business.email || 'billing@client.com',
      amount: invoice.total,
      currency: invoice.currency,
      reference: `INV-PAY-${invoice.number}-${Date.now()}`,
      metadata: { invoiceId: invoice.id, invoiceNumber: invoice.number },
      onSuccess: (res) => {
        showToast(`Payment verified via Paystack! Ref: ${res.reference}`, 'success');
        updateInvoiceStatus(invoice.id, 'paid');
      },
      onError: (err) => {
        const msg = err.message || 'Payment processing failed.';
        showToast(msg, 'error');
      },
      onClose: () => {
        showToast('Payment window closed', 'info');
      },
    });
  };

  const handleMarkPaidConfirm = () => {
    updateInvoiceStatus(invoice.id, 'paid');
    setIsMarkPaidModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    deleteInvoice(invoice.id);
    setIsDeleteModalOpen(false);
    setActivePage('invoices');
  };

  const matchingReceipt = receipts.find((r) => r.invoice_id === invoice.id);

  const handleOpenReceipt = async () => {
    if (matchingReceipt) {
      setActiveReceipt(matchingReceipt);
      setIsReceiptModalOpen(true);
    } else {
      showToast('Generating official receipt...', 'info');
      const res = await createReceipt({
        invoice_id: invoice.id,
        amount: invoice.total,
        currency: invoice.currency,
        payment_method: 'Card / Electronic',
        payment_date: invoice.paid_at || new Date().toISOString(),
        notes: `Settlement for invoice ${invoice.number}`,
      });
      if (res.success && res.receipt) {
        setActiveReceipt(res.receipt);
        setIsReceiptModalOpen(true);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-slate-800">
      {/* Top Action Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('invoices')}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{invoice.number}</h1>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  invoice.status === 'paid'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : invoice.status === 'overdue'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                }`}
              >
                {invoice.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">Client: {invoice.client?.name || 'Valued Client'}</p>
          </div>
        </div>

        {/* Invoice Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === 'paid' ? (
            <button
              onClick={handleOpenReceipt}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <ReceiptIcon className="w-4 h-4" />
              <span>{matchingReceipt ? 'View Receipt (REC)' : 'Generate Receipt'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={handlePaystackPay}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay via Paystack</span>
              </button>

              <button
                onClick={() => setIsReminderModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Send Payment Reminder"
              >
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Send Reminder</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (!invoice.client?.email || !invoice.client.email.trim()) {
                showToast('This client does not have an email address. Add an email address before sending the invoice.', 'error');
                return;
              }
              setIsEmailModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Send Email</span>
          </button>

          <button
            onClick={() => {
              setEditingInvoice(invoice);
              setActivePage('new_invoice');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
            title="Edit Invoice"
          >
            <Edit3 className="w-4 h-4 text-amber-500" />
            <span>Edit</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download PDF</span>
          </button>

          {invoice.status !== 'paid' && (
            <button
              onClick={() => setIsMarkPaidModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl text-xs font-bold border border-slate-200 transition-all"
              title="Mark as Paid"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mark Paid</span>
            </button>
          )}

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
            title="Delete Invoice"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Template Selector Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800">Invoice Style:</span>
          <span className="text-xs font-extrabold text-blue-600 capitalize">
            ({INVOICE_TEMPLATES.find((t) => t.id === selectedTemplate)?.name})
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
          {INVOICE_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSaveTemplateChange(tmpl.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-slate-300'}`} />
                <span>{tmpl.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-white p-4 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs overflow-x-auto">
        <InvoiceTemplate
          id="printable-invoice-element"
          invoice={invoice}
          business={business}
          forcedTemplate={selectedTemplate}
        />
      </div>

      {/* Send Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span>Send Invoice Email</span>
              </h3>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <p className="text-slate-700">
                <span className="font-bold text-slate-500">Recipient:</span> {invoice.client?.email || 'No email provided'}
              </p>
              <p className="text-slate-700">
                <span className="font-bold text-slate-500">Invoice:</span> {invoice.number} ({invoice.currency} {(Number(invoice.total) || 0).toFixed(2)})
              </p>
            </div>

            <form onSubmit={handleSendEmailSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Message / Note (Optional)</label>
                <textarea
                  rows={3}
                  value={emailNote}
                  onChange={(e) => setEmailNote(e.target.value)}
                  placeholder="e.g. Please review invoice INV-1001. Thank you for your business!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20"
                >
                  {isSendingEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Paid Confirmation Modal */}
      <ConfirmModal
        isOpen={isMarkPaidModalOpen}
        title="Mark as Paid"
        message={`Mark invoice ${invoice.number} as paid?`}
        confirmLabel="Mark as Paid"
        cancelLabel="Cancel"
        isDanger={false}
        onConfirm={handleMarkPaidConfirm}
        onCancel={() => setIsMarkPaidModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${invoice.number}? This action cannot be undone.`}
        confirmLabel="Delete Invoice"
        cancelLabel="Cancel"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Official Receipt View Modal */}
      <ReceiptViewModal
        receipt={activeReceipt}
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setActiveReceipt(null);
        }}
      />

      {/* Overdue Payment Reminder Modal */}
      <SendReminderModal
        invoice={invoice}
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
      />
    </div>
  );
};
