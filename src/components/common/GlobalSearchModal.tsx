import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  FileText,
  Users,
  CreditCard,
  Activity as ActivityIcon,
  ArrowRight,
  X,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = 'all' | 'invoices' | 'clients' | 'payments' | 'activities';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const {
    invoices,
    clients,
    payments,
    activities,
    setActivePage,
    setSelectedInvoiceId,
  } = useApp();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setCategory('all');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const q = query.trim().toLowerCase();

  // Search Invoices
  const invoiceResults = useMemo(() => {
    if (!q) return [];
    return invoices.filter((inv) => {
      const matchNumber = inv.number?.toLowerCase().includes(q);
      const matchClient = inv.client?.name?.toLowerCase().includes(q) || inv.client?.company?.toLowerCase().includes(q);
      const matchStatus = inv.status?.toLowerCase().includes(q);
      const matchNotes = inv.notes?.toLowerCase().includes(q) || inv.terms?.toLowerCase().includes(q);
      const matchAmount = inv.total?.toString().includes(q) || `${inv.currency} ${inv.total}`.toLowerCase().includes(q);
      const matchItems = inv.items?.some((it) => it.description?.toLowerCase().includes(q));
      return matchNumber || matchClient || matchStatus || matchNotes || matchAmount || matchItems;
    });
  }, [invoices, q]);

  // Search Clients
  const clientResults = useMemo(() => {
    if (!q) return [];
    return clients.filter((c) => {
      const matchName = c.name?.toLowerCase().includes(q);
      const matchCompany = c.company?.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      const matchCity = c.city?.toLowerCase().includes(q) || c.country?.toLowerCase().includes(q);
      const matchTaxId = c.tax_id?.toLowerCase().includes(q);
      return matchName || matchCompany || matchEmail || matchPhone || matchCity || matchTaxId;
    });
  }, [clients, q]);

  // Search Payments
  const paymentResults = useMemo(() => {
    if (!q) return [];
    return payments.filter((p) => {
      const matchRef = p.paystack_reference?.toLowerCase().includes(q);
      const matchStatus = p.status?.toLowerCase().includes(q);
      const matchChannel = p.channel?.toLowerCase().includes(q);
      const matchAmount = p.amount?.toString().includes(q) || `${p.currency} ${p.amount}`.toLowerCase().includes(q);
      return matchRef || matchStatus || matchChannel || matchAmount;
    });
  }, [payments, q]);

  // Search Activities
  const activityResults = useMemo(() => {
    if (!q) return [];
    return activities.filter((a) => {
      const matchDesc = a.description?.toLowerCase().includes(q);
      const matchType = a.type?.toLowerCase().includes(q);
      return matchDesc || matchType;
    });
  }, [activities, q]);

  const totalResultsCount =
    (category === 'all' || category === 'invoices' ? invoiceResults.length : 0) +
    (category === 'all' || category === 'clients' ? clientResults.length : 0) +
    (category === 'all' || category === 'payments' ? paymentResults.length : 0) +
    (category === 'all' || category === 'activities' ? activityResults.length : 0);

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setActivePage('invoice_detail');
    onClose();
  };

  const handleSelectClient = () => {
    setActivePage('clients');
    onClose();
  };

  const handleSelectPayment = () => {
    setActivePage('billing');
    onClose();
  };

  const handleSelectActivity = () => {
    setActivePage('activities');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, invoices, payments, line items, activities..."
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-lg hover:text-slate-800"
          >
            ESC
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border-b border-slate-100 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              category === 'all'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All ({invoiceResults.length + clientResults.length + paymentResults.length + activityResults.length})
          </button>
          <button
            type="button"
            onClick={() => setCategory('invoices')}
            className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              category === 'invoices'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Invoices ({invoiceResults.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCategory('clients')}
            className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              category === 'clients'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clients ({clientResults.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCategory('payments')}
            className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              category === 'payments'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payments ({paymentResults.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCategory('activities')}
            className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              category === 'activities'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ActivityIcon className="w-3.5 h-3.5" />
            <span>Activity ({activityResults.length})</span>
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {!q ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Type anything to search</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Search invoice numbers (e.g. INV-1001), client names, emails, services, or references.
              </p>
            </div>
          ) : totalResultsCount === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No results found for "{query}"</p>
              <p className="text-[11px] text-slate-400">Check for typos or try searching a different keyword.</p>
            </div>
          ) : (
            <>
              {/* Invoices Group */}
              {(category === 'all' || category === 'invoices') && invoiceResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Invoices ({invoiceResults.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {invoiceResults.map((inv) => (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => handleSelectInvoice(inv.id)}
                        className="w-full p-3 rounded-2xl text-left bg-slate-50 hover:bg-blue-50/50 transition-colors flex items-center justify-between group border border-slate-100 hover:border-blue-200"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 font-mono">{inv.number}</span>
                            <span className="text-xs text-slate-600 font-bold">• {inv.client?.name || 'Client'}</span>
                            <span
                              className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : inv.status === 'overdue'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Total: {inv.currency} {(Number(inv.total) || 0).toFixed(2)} • Due: {inv.due_date}
                            {inv.items && inv.items.length > 0 && ` • ${inv.items.map((i) => i.description).join(', ')}`}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clients Group */}
              {(category === 'all' || category === 'clients') && clientResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Clients ({clientResults.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {clientResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={handleSelectClient}
                        className="w-full p-3 rounded-2xl text-left bg-slate-50 hover:bg-emerald-50/50 transition-colors flex items-center justify-between group border border-slate-100 hover:border-emerald-200"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{c.name}</span>
                            {c.company && (
                              <span className="text-xs text-slate-500 font-medium">({c.company})</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {c.email} {c.phone ? `• ${c.phone}` : ''} {c.city ? `• ${c.city}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments Group */}
              {(category === 'all' || category === 'payments') && paymentResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" /> Payments ({paymentResults.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {paymentResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={handleSelectPayment}
                        className="w-full p-3 rounded-2xl text-left bg-slate-50 hover:bg-amber-50/50 transition-colors flex items-center justify-between group border border-slate-100 hover:border-amber-200"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              {p.paystack_reference || p.id}
                            </span>
                            <span className="text-xs text-emerald-600 font-bold">
                              {p.currency} {(Number(p.amount) || 0).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Status: {p.status} • Paid at: {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : 'Pending'}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Activities Group */}
              {(category === 'all' || category === 'activities') && activityResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                      <ActivityIcon className="w-3.5 h-3.5" /> Activities ({activityResults.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {activityResults.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={handleSelectActivity}
                        className="w-full p-3 rounded-2xl text-left bg-slate-50 hover:bg-purple-50/50 transition-colors flex items-center justify-between group border border-slate-100 hover:border-purple-200"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{a.description}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(a.created_at).toLocaleString()} • {a.type}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono shadow-2xs">
              ESC
            </kbd>
            to close
          </span>
          <span className="font-semibold">
            {totalResultsCount} result{totalResultsCount === 1 ? '' : 's'} found
          </span>
        </div>
      </div>
    </div>
  );
};
