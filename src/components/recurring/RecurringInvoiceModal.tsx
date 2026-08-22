import React, { useState } from 'react';
import { RecurringInvoice, InvoiceItem } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Repeat,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  Package,
  Layers,
  Loader2,
} from 'lucide-react';

interface RecurringInvoiceModalProps {
  recurringInvoice: RecurringInvoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecurringInvoiceModal: React.FC<RecurringInvoiceModalProps> = ({
  recurringInvoice,
  isOpen,
  onClose,
}) => {
  const {
    clients,
    products,
    business,
    addRecurringInvoice,
    updateRecurringInvoice,
    showToast,
  } = useApp();

  const [clientId, setClientId] = useState(
    recurringInvoice?.client_id || (clients[0]?.id || '')
  );
  const [frequency, setFrequency] = useState<RecurringInvoice['frequency']>(
    recurringInvoice?.frequency || 'monthly'
  );
  const [nextIssueDate, setNextIssueDate] = useState(
    recurringInvoice?.next_issue_date
      ? recurringInvoice.next_issue_date.split('T')[0]
      : new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    recurringInvoice?.end_date ? recurringInvoice.end_date.split('T')[0] : ''
  );
  const [autoSend, setAutoSend] = useState(
    recurringInvoice?.auto_send !== undefined ? recurringInvoice.auto_send : true
  );
  const [status, setStatus] = useState<RecurringInvoice['status']>(
    recurringInvoice?.status || 'active'
  );

  const [items, setItems] = useState<Omit<InvoiceItem, 'id' | 'invoice_id'>[]>(
    recurringInvoice?.items && recurringInvoice.items.length > 0
      ? recurringInvoice.items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          amount: it.amount,
        }))
      : [
          {
            description: 'Monthly Maintenance & Support Retainer',
            quantity: 1,
            unit_price: 500,
            amount: 500,
          },
        ]
  );

  const [taxRate, setTaxRate] = useState(recurringInvoice?.tax_rate || 0);
  const [discount, setDiscount] = useState(recurringInvoice?.discount || 0);
  const [notes, setNotes] = useState(
    recurringInvoice?.notes || 'Thank you for your ongoing partnership!'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'unit_price') {
      const q = field === 'quantity' ? Number(val) : item.quantity;
      const p = field === 'unit_price' ? Number(val) : item.unit_price;
      item.amount = q * p;
    }
    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: 'New Service Item',
        quantity: 1,
        unit_price: 100,
        amount: 100,
      },
    ]);
  };

  const handleSelectProduct = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const updated = [...items];
    updated[index] = {
      description: prod.name + (prod.description ? ` - ${prod.description}` : ''),
      quantity: 1,
      unit_price: prod.unit_price,
      amount: prod.unit_price,
    };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, it) => sum + (it.amount || 0), 0);
  const taxAmount = (subtotal * Number(taxRate)) / 100;
  const total = Math.max(0, subtotal + taxAmount - Number(discount));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      showToast('Please select a client for this recurring invoice schedule.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        client_id: clientId,
        frequency,
        status,
        next_issue_date: nextIssueDate,
        end_date: endDate || undefined,
        auto_send: autoSend,
        currency: business.default_currency || 'USD',
        subtotal,
        tax_rate: Number(taxRate),
        tax_amount: taxAmount,
        discount: Number(discount),
        total,
        notes,
        terms: 'Due on receipt',
        items,
      };

      if (recurringInvoice) {
        await updateRecurringInvoice(recurringInvoice.id, payload);
      } else {
        await addRecurringInvoice(payload);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {recurringInvoice ? 'Edit Recurring Invoice Schedule' : 'Create Recurring Invoice Schedule'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automate repeated billing schedules (weekly, monthly, quarterly, yearly)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Client & Frequency Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Client *
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="" disabled>
                  Select a client...
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Billing Frequency *
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="weekly">Weekly (Every 7 days)</option>
                <option value="biweekly">Bi-weekly (Every 14 days)</option>
                <option value="monthly">Monthly (Every month)</option>
                <option value="quarterly">Quarterly (Every 3 months)</option>
                <option value="yearly">Yearly (Every 12 months)</option>
              </select>
            </div>
          </div>

          {/* Dates & Auto Send */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                First / Next Issue Date *
              </label>
              <input
                type="date"
                required
                value={nextIssueDate}
                onChange={(e) => setNextIssueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Schedule Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          {/* Auto Send Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Automatically Email Generated Invoices
              </span>
              <span className="text-[11px] text-slate-500">
                When the schedule triggers, dispatch the new invoice directly to client email
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSend}
                onChange={(e) => setAutoSend(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Recurring Line Items
              </label>
              {products.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  Select from catalog or enter manually
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Item or service description"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                    {products.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleSelectProduct(idx, e.target.value);
                        }}
                        defaultValue=""
                        className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 max-w-[140px]"
                      >
                        <option value="" disabled>
                          + From Catalog
                        </option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.unit_price})
                          </option>
                        ))}
                      </select>
                    )}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Quantity</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Unit Price</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleItemChange(idx, 'unit_price', Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Amount</span>
                      <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/50 text-xs font-bold text-slate-800 dark:text-slate-200 text-right">
                        {(Number(item.amount) || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Line Item</span>
              </button>
            </div>
          </div>

          {/* Totals Preview */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {business.default_currency || 'USD'} {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Tax Rate (%):</span>
              <input
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-20 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-right text-xs"
              />
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Discount ({business.default_currency || 'USD'}):</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-20 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-right text-xs"
              />
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Total Per Cycle:</span>
              <span className="text-blue-600 dark:text-blue-400">
                {business.default_currency || 'USD'} {total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {recurringInvoice ? 'Save Schedule' : 'Start Recurring Schedule'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
