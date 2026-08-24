import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { openPaystackModal, getPaystackPublicKey } from '../lib/paystack';
import { useAuth } from '../context/AuthContext';
import { exportPaymentsToCsv } from '../lib/csvExport';
import { PRO_MONTHLY, ENTERPRISE_MONTHLY, TRIAL_DAYS } from '../types';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Loader2,
  Clock,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

export const BillingPage: React.FC = () => {
  const {
    subscription,
    usage,
    payments,
    business,
    upgradeSubscription,
    showToast,
    openUpgradeModal,
  } = useApp();
  const { user, isDemoUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const [paystackError, setPaystackError] = useState<{
    message: string;
    paystackResponse?: any;
  } | null>(null);

  const publicKey = getPaystackPublicKey();
  const isTestMode = publicKey.startsWith('pk_test_');

  const isTrialActive =
    subscription.status === 'trialing' &&
    Boolean(subscription.trial_ends_at && new Date(subscription.trial_ends_at).getTime() > Date.now());

  const trialDaysRemaining =
    subscription.trial_ends_at && new Date(subscription.trial_ends_at).getTime() > Date.now()
      ? Math.max(1, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

  const isTrialExpired =
    subscription.status === 'trial_expired' ||
    (Boolean(subscription.trial_ends_at) && new Date(subscription.trial_ends_at!).getTime() <= Date.now() && subscription.plan === 'free');

  const handleUpgrade = (planName: 'pro' | 'enterprise') => {
    // If user is unauthenticated or in Demo Mode, prompt for account creation/signin
    if (!user || isDemoUser) {
      openUpgradeModal(planName);
      return;
    }

    // Authenticated user: proceed directly with payment
    const amount = planName === 'pro' ? PRO_MONTHLY : ENTERPRISE_MONTHLY;
    setIsProcessing(true);
    setPaystackError(null);

    const uniqueRef = `SUB-${planName.toUpperCase()}-USD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    openPaystackModal({
      email: user.email || business.email || 'billing@business.com',
      amount,
      currency: 'USD',
      reference: uniqueRef,
      planName,
      metadata: { plan: planName, userId: user.id, businessId: business.id },
      onSuccess: async (res) => {
        showToast(`🎉 Subscription payment verified! Ref: ${res.reference}`, 'success');
        await upgradeSubscription(planName, res.reference);
        setIsProcessing(false);
        setPaystackError(null);
        try {
          sessionStorage.removeItem('invoiceflow_pending_upgrade');
          localStorage.removeItem('invoiceflow_pending_upgrade');
        } catch (e) {
          console.warn('Storage notice:', e);
        }
      },
      onError: (err) => {
        console.warn('⚠️ Paystack Checkout Notice:', err?.message || err);
        setPaystackError(err);
        setIsProcessing(false);
        showToast(`Paystack error: ${err.message}`, 'error');
      },
      onClose: () => {
        showToast('Paystack subscription window closed', 'info');
        setIsProcessing(false);
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Billing & Subscriptions</h1>
          <p className="text-xs text-slate-500">Manage plan tier, Paystack subscription status, and usage quotas</p>
        </div>

        {/* Paystack Public Key Mode Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs shadow-2xs">
          <div className={`w-2 h-2 rounded-full ${isTestMode ? 'bg-amber-500 animate-pulse' : publicKey.startsWith('pk_live_') ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          <span className="text-slate-600 font-mono text-[11px]">
            Mode: <strong className={isTestMode ? 'text-amber-600' : 'text-emerald-600'}>
              {isTestMode ? 'TEST MODE' : publicKey.startsWith('pk_live_') ? 'LIVE PRODUCTION' : 'DEV SIMULATION'}
            </strong>
          </span>
        </div>
      </div>

      {/* Paystack Checkout Error Alert */}
      {paystackError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm animate-shake flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900">Checkout Error</h3>
              <p className="text-xs text-rose-700 font-medium">{paystackError.message}</p>
            </div>
          </div>
          <button
            onClick={() => setPaystackError(null)}
            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl shrink-0 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Trial Banner if user is on Free Trial or Expired */}
      {isTrialActive && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">7-Day Free Trial Active</h3>
                <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} remaining
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Enjoy full access to Pro features. Upgrade anytime for just $9.99/month to keep uninterrupted access.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleUpgrade('pro')}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
          >
            Upgrade to Pro ($9.99/mo)
          </button>
        </div>
      )}

      {isTrialExpired && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-amber-900">7-Day Free Trial Ended</h3>
                <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  Expired
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Your 7-day free trial has expired. Upgrade to Pro for $9.99/month to continue using unlimited invoices and AI generations.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleUpgrade('pro')}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
          >
            Upgrade to Pro ($9.99/mo)
          </button>
        </div>
      )}

      {/* Current Plan Overview Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block mb-1">
              Active Plan Status
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-900 capitalize">
                {isTrialActive ? 'Pro (7-Day Trial)' : `${subscription.plan} Plan`}
              </h2>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                isTrialActive
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : subscription.plan !== 'free'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {isTrialActive ? `${trialDaysRemaining} DAYS TRIAL REMAINING` : subscription.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isTrialActive
                ? `Trial period ends: ${new Date(subscription.trial_ends_at!).toLocaleDateString()}`
                : `Next renewal billing date: ${subscription.next_billing_date || 'N/A'}`}
            </p>
          </div>

          {subscription.plan === 'free' && (
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={isProcessing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2 hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Zap className="w-4 h-4 text-amber-300" />
              )}
              <span>Upgrade to Pro (${PRO_MONTHLY}/mo)</span>
            </button>
          )}
        </div>

        {/* Quota Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600 font-bold">
              <span>Monthly Invoices</span>
              <span className="text-slate-900">
                {usage.invoice_count_month} / {subscription.plan === 'free' && !isTrialActive ? 5 : 'Unlimited'}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{
                  width: `${subscription.plan === 'free' && !isTrialActive ? Math.min((usage.invoice_count_month / 5) * 100, 100) : 15}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600 font-bold">
              <span>Gemini AI Generations</span>
              <span className="text-slate-900">
                {usage.ai_generations_month} / {subscription.plan === 'free' && !isTrialActive ? 5 : 200}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all"
                style={{
                  width: `${
                    subscription.plan === 'free' && !isTrialActive
                      ? Math.min((usage.ai_generations_month / 5) * 100, 100)
                      : Math.min((usage.ai_generations_month / 200) * 100, 100)
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Tier Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div
          className={`p-6 bg-white border rounded-3xl space-y-4 flex flex-col justify-between shadow-2xs ${
            subscription.plan === 'free' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-base">Starter Free</h3>
            <p className="text-3xl font-black text-slate-900">$0 <span className="text-xs text-slate-400 font-normal">/mo</span></p>
            <ul className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>5 Invoices per month</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>3 Client records</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>5 Gemini AI prompt runs</span>
              </li>
            </ul>
          </div>

          <button
            disabled={subscription.plan === 'free'}
            className="w-full py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold disabled:opacity-80"
          >
            {subscription.plan === 'free' ? 'Current Active Plan' : 'Downgrade'}
          </button>
        </div>

        {/* Pro Plan */}
        <div
          className={`p-6 bg-white border rounded-3xl space-y-4 flex flex-col justify-between relative shadow-2xs ${
            subscription.plan === 'pro' ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200/80'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-blue-600 text-base">Pro</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  7-Day Free Trial
                </span>
                <span className="text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  Popular
                </span>
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">
              ${PRO_MONTHLY} <span className="text-xs text-slate-400 font-normal">/month</span>
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
              ✨ 7 days free trial, then ${PRO_MONTHLY}/month
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Unlimited Invoices & Clients</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>200 Gemini AI Generations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Verified Paystack Payments</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Custom PDF Templates & Branding</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleUpgrade('pro')}
            disabled={subscription.plan === 'pro' || isProcessing}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : subscription.plan === 'pro' ? (
              'Current Active Plan'
            ) : (
              `Upgrade to Pro ($${PRO_MONTHLY}/month)`
            )}
          </button>
        </div>

        {/* Enterprise Plan */}
        <div
          className={`p-6 bg-white border rounded-3xl space-y-4 flex flex-col justify-between shadow-2xs ${
            subscription.plan === 'enterprise' ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-slate-200/80'
          }`}
        >
          <div className="space-y-3">
            <h3 className="font-extrabold text-purple-700 text-base">Enterprise</h3>
            <p className="text-3xl font-black text-slate-900">
              ${ENTERPRISE_MONTHLY} <span className="text-xs text-slate-400 font-normal">/month</span>
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Unlimited Invoices, Clients & Products</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Unlimited Gemini AI Generations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Dedicated Priority Support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Custom API & Webhooks</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleUpgrade('enterprise')}
            disabled={subscription.plan === 'enterprise' || isProcessing}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-500/20 disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : subscription.plan === 'enterprise' ? (
              'Current Active Plan'
            ) : (
              `Upgrade to Enterprise ($${ENTERPRISE_MONTHLY}/month)`
            )}
          </button>
        </div>
      </div>

      {/* Payment History Log */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">Paystack Payment Records</h3>
          {payments.length > 0 && (
            <button
              onClick={() => {
                exportPaymentsToCsv(payments);
                showToast(`Exported ${payments.length} payment records to CSV`, 'success');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-800 font-semibold">{p.reference}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {p.currency} {p.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center font-medium">No Paystack payment records yet.</p>
        )}
      </div>
    </div>
  );
};
