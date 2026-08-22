import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateInvoiceWithAi, AiErrorInfo, normalizeAiError } from '../../services/aiService';
import {
  Sparkles,
  X,
  ArrowRight,
  Loader2,
  Wand2,
  Users,
  Plus,
  UserCheck,
  RotateCcw,
  KeyRound,
  WifiOff,
  Clock,
  AlertTriangle,
  ServerCrash,
  ShieldAlert,
  Settings,
} from 'lucide-react';

interface AiInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceGenerated: (invoiceId: string) => void;
}

export const AiInvoiceModal: React.FC<AiInvoiceModalProps> = ({
  isOpen,
  onClose,
  onInvoiceGenerated,
}) => {
  const { clients, business, createInvoice, incrementAiUsage, showToast, setActivePage } = useApp();
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<AiErrorInfo | null>(null);

  if (!isOpen) return null;

  const handleAddClientClick = () => {
    onClose();
    setActivePage('clients');
  };

  const samplePrompts = [
    'Bill for 20 hours of UI design at $95/hr plus $500 design system setup.',
    'Invoice $4,500 for API Server Performance Optimization due in 30 days.',
    'Create an invoice for 8 hours of Paystack gateway integration consulting at $125/hr.',
  ];

  const handleGenerate = async (promptToUse?: string) => {
    const activePrompt = (promptToUse || prompt).trim();
    if (!activePrompt) return;

    if (clients.length === 0) {
      showToast('No clients yet. Add your first client before creating an AI invoice.', 'error');
      return;
    }

    // Check AI plan limit
    const allowed = await incrementAiUsage();
    if (!allowed) return;

    setIsLoading(true);
    setErrorInfo(null);

    try {
      const generated = await generateInvoiceWithAi({
        prompt: activePrompt,
        defaultCurrency: business.default_currency || 'USD',
        clients: clients.map((c) => ({ id: c.id, name: c.name, company: c.company })),
      });

      // Prefer user's explicitly selected client; fallback to matched client or first client
      let targetClient = clients.find((c) => c.id === selectedClientId);

      if (!targetClient && generated.clientName) {
        targetClient = clients.find(
          (c) =>
            c.name.toLowerCase().includes(generated.clientName.toLowerCase()) ||
            (c.company && c.company.toLowerCase().includes(generated.clientName.toLowerCase()))
        );
      }

      if (!targetClient && clients.length > 0) {
        targetClient = clients[0];
      }

      if (!targetClient) {
        showToast('No clients yet. Add your first client before creating an AI invoice.', 'error');
        setIsLoading(false);
        return;
      }

      const subtotal = generated.items.reduce((acc, it) => acc + (it.amount || 0), 0);
      const taxAmount = (subtotal - (generated.discount || 0)) * ((generated.taxRate || 0) / 100);
      const total = Math.max(0, subtotal - (generated.discount || 0) + taxAmount);

      const res = await createInvoice({
        client_id: targetClient.id,
        number: `${business.invoice_prefix || 'INV-'}${business.next_invoice_number || 1001}`,
        status: 'sent',
        issue_date: generated.issueDate || new Date().toISOString().split('T')[0],
        due_date: generated.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        currency: generated.currency || business.default_currency || 'USD',
        subtotal,
        tax_rate: generated.taxRate || 0,
        tax_amount: taxAmount,
        discount: generated.discount || 0,
        total,
        notes: generated.notes || 'Generated with Gemini AI Assistant.',
        terms: generated.terms || business.payment_terms || 'Payment due on receipt.',
        items: generated.items.map((it, idx) => ({
          id: `ai_item_${idx}`,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          amount: it.amount,
        })),
      });

      setIsLoading(false);

      if (res.success && res.invoice) {
        showToast('✨ Invoice generated with Gemini AI!', 'success');
        onInvoiceGenerated(res.invoice.id);
        onClose();
      }
    } catch (rawErr: any) {
      const errInfo: AiErrorInfo = normalizeAiError(rawErr);
      console.error('AI Invoice Generation Error:', errInfo);
      setErrorInfo(errInfo);
      showToast(`${errInfo.title}: ${errInfo.message}`, 'error');
      setIsLoading(false);
    }
  };

  const getErrorIcon = (type?: string) => {
    switch (type) {
      case 'missing_api_key':
      case 'invalid_api_key':
        return <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'rate_limit_exceeded':
        return <Clock className="w-4 h-4 text-orange-600 shrink-0" />;
      case 'network_error':
        return <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'service_unavailable':
        return <ServerCrash className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'safety_blocked':
        return <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-slide-up">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shadow-2xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">AI Invoice Generator</h3>
              <p className="text-xs text-slate-400">Describe what you want to bill in plain English</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="p-8 text-center space-y-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">No Clients Found</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                No clients yet. Add your first client before creating an AI invoice.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClientClick}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Client</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Structured Error Banner if generation fails */}
            {errorInfo && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getErrorIcon(errorInfo.errorType)}
                    <span className="font-extrabold text-slate-900">{errorInfo.title}</span>
                  </div>
                  {errorInfo.statusCode && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                      HTTP {errorInfo.statusCode}
                    </span>
                  )}
                </div>

                <p className="text-slate-700 leading-relaxed font-medium">{errorInfo.message}</p>

                {errorInfo.suggestion && (
                  <p className="text-[11px] text-slate-600 bg-white/70 rounded-xl p-2 border border-slate-200/60">
                    <span className="font-bold text-slate-700">Tip: </span>
                    {errorInfo.suggestion}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {errorInfo.retryable && (
                    <button
                      onClick={() => handleGenerate()}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}
                  {(errorInfo.errorType === 'missing_api_key' || errorInfo.errorType === 'invalid_api_key') && (
                    <button
                      onClick={() => {
                        onClose();
                        setActivePage('settings');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Go to Settings</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Client selection header */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Bill To Client</span>
              </label>
              <select
                value={selectedClientId || clients[0]?.id}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''} - {c.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (errorInfo) setErrorInfo(null);
                }}
                placeholder="e.g., Invoice 25 hours of React UI development at $100/hr, add 5% VAT..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
              />

              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Or try a sample prompt:
                </span>
                <div className="space-y-1.5">
                  {samplePrompts.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPrompt(sample);
                        handleGenerate(sample);
                      }}
                      className="w-full text-left p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl text-xs text-slate-600 hover:text-blue-700 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="truncate pr-2">{sample}</span>
                      <Wand2 className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGenerate()}
                disabled={isLoading || !prompt.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Gemini Thinking...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Invoice</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
