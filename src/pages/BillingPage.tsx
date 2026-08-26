import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { initiateFlutterwaveCheckout, verifyFlutterwaveTransaction } from '../lib/flutterwave';
import { useAuth } from '../context/AuthContext';
import { exportPaymentsToCsv } from '../lib/csvExport';
import { PRO_MONTHLY, ENTERPRISE_MONTHLY, TRIAL_DAYS } from '../types';
import {
  isTrialActive as checkTrialActive,
  getTrialDaysRemaining,
  getEffectivePlan,
  PLAN_CONFIGS,
} from '../lib/planLimits';
import { trackViewContent } from '../lib/tiktokPixel';
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
  Crown,
  Check,
} from 'lucide-react';

export const BillingPage: React.FC = () => {
  const {
    subscription,
    usage,
    clients,
    recurringInvoices,
    products,
    payments,
    business,
    upgradeSubscription,
    startTrial,
    cancelSubscription,
    showToast,
    openUpgradeModal,
  } = useApp();
  const { user, isDemoUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePlanAction, setActivePlanAction] = useState<'pro' | 'enterprise' | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [checkoutError, setCheckoutError] = useState<{
    message: string;
    details?: any;
  } | null>(null);

  const isTrial = checkTrialActive(subscription);
  const trialDaysRemaining = getTrialDaysRemaining(subscription);
  const effectivePlan = getEffectivePlan(subscription);
  const trialAlreadyUsed = Boolean(subscription.trial_started_at || subscription.trial_used);

  const isTrialExpired =
    subscription.status === 'trial_expired' ||
    (Boolean(subscription.trial_ends_at) &&
      new Date(subscription.trial_ends_at!).getTime() <= Date.now() &&
      subscription.status !== 'active');

  useEffect(() => {
    trackViewContent({
      content_id: 'billing_pricing_plans',
      content_name: 'InvoiceFlow Pro & Enterprise Pricing Plans',
      content_type: 'product_group',
      value: PRO_MONTHLY,
      currency: 'USD',
    });

    // Check if user just returned from Flutterwave callback
    const urlParams = new URLSearchParams(window.location.search);
    const flwCallback = urlParams.get('flw_callback');
    const txRef = urlParams.get('tx_ref') || urlParams.get('transaction_id');
    const planParam = (urlParams.get('plan') || 'pro') as 'pro' | 'enterprise';
    const modeParam = urlParams.get('mode') || (txRef && txRef.includes('-TRL') ? 'trial' : 'subscription');

    if (flwCallback && txRef) {
      console.log('🔄 Verifying Flutterwave callback on Billing Page return:', txRef, 'Mode:', modeParam);
      setIsProcessing(true);
      verifyFlutterwaveTransaction({
        tx_ref: txRef,
        plan: planParam,
        mode: modeParam as 'trial' | 'subscription',
      }).then(async (res) => {
        setIsProcessing(false);
        if (res.success) {
          if (modeParam === 'trial') {
            showToast(`🎉 Card authorized successfully! 7-Day ${planParam.toUpperCase()} trial is active.`, 'success');
            await startTrial(planParam, txRef);
          } else {
            showToast(`🎉 Flutterwave payment verified successfully! Ref: ${txRef}`, 'success');
            await upgradeSubscription(planParam, txRef, 'flutterwave');
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          showToast(res.message || 'Payment verification could not be completed.', 'error');
        }
      });
    }
  }, []);

  const handleStartTrial = async (plan: 'pro' | 'enterprise') => {
    if (!user || isDemoUser) {
      openUpgradeModal(plan);
      return;
    }

    if (trialAlreadyUsed) {
      showToast('A 7-day free trial has already been used on this account. Please select a plan to subscribe.', 'info');
      return;
    }

    setIsProcessing(true);
    setActivePlanAction(plan);
    setCheckoutError(null);

    // Require valid payment method authorization through Flutterwave before trial starts
    await initiateFlutterwaveCheckout({
      plan,
      mode: 'trial',
      email: user.email || business.email || 'billing@business.com',
      name: business.name || user.email?.split('@')[0] || 'Subscriber',
      businessId: business.id,
      onSuccess: async (res) => {
        showToast(`🎉 Card authorized! 7-day free trial of ${plan.toUpperCase()} activated.`, 'success');
        await startTrial(plan, res.reference);
        setIsProcessing(false);
        setActivePlanAction(null);
      },
      onError: (err) => {
        console.warn('⚠️ Flutterwave Trial Authorization Notice:', err?.message || err);
        setCheckoutError({ message: err.message || 'Payment card authorization could not be started.' });
        setIsProcessing(false);
        setActivePlanAction(null);
        showToast(err.message || 'Payment card authorization error', 'error');
      },
      onCancel: () => {
        showToast('Card authorization window closed', 'info');
        setIsProcessing(false);
        setActivePlanAction(null);
      },
    });
  };

  const handleSubscribe = async (planName: 'pro' | 'enterprise') => {
    // If user is unauthenticated or in Demo Mode, prompt for account creation/signin
    if (!user || isDemoUser) {
      openUpgradeModal(planName);
      return;
    }

    setIsProcessing(true);
    setActivePlanAction(planName);
    setCheckoutError(null);

    await initiateFlutterwaveCheckout({
      plan: planName,
      mode: 'subscription',
      email: user.email || business.email || 'billing@business.com',
      name: business.name || user.email?.split('@')[0] || 'Subscriber',
      businessId: business.id,
      onSuccess: async (res) => {
        showToast(`🎉 Subscription payment verified via Flutterwave! Ref: ${res.reference}`, 'success');
        await upgradeSubscription(planName, res.reference, 'flutterwave');
        setIsProcessing(false);
        setActivePlanAction(null);
      },
      onError: (err) => {
        console.warn('⚠️ Flutterwave Checkout Notice:', err?.message || err);
        setCheckoutError({ message: err.message || 'Payment checkout could not be started.' });
        setIsProcessing(false);
        setActivePlanAction(null);
        showToast(err.message || 'Payment checkout error', 'error');
      },
      onCancel: () => {
        showToast('Payment checkout window closed', 'info');
        setIsProcessing(false);
        setActivePlanAction(null);
      },
    });
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription / trial? You will not be billed automatically.')) {
      return;
    }
    setIsCancelling(true);
    try {
      await cancelSubscription();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Billing & Subscriptions</h1>
          <p className="text-xs text-slate-500">Manage plan tier, Flutterwave subscription status, and usage quotas</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-600 font-mono text-[11px]">
            Provider: <strong className="text-emerald-700">FLUTTERWAVE SECURE</strong>
          </span>
        </div>
      </div>

      {/* Checkout Error Alert */}
      {checkoutError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm animate-shake flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900">Checkout Notice</h3>
              <p className="text-xs text-rose-700 font-medium">{checkoutError.message}</p>
            </div>
          </div>
          <button
            onClick={() => setCheckoutError(null)}
            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl shrink-0 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Trial Banner if user is on Free Trial or Expired */}
      {isTrial && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">
                  7-Day {subscription.plan.toUpperCase()} Free Trial Active
                </h3>
                <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} remaining
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Enjoy full access to {subscription.plan === 'enterprise' ? 'Enterprise' : 'Pro'} features. Upgrade anytime to keep uninterrupted access.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSubscribe(subscription.plan === 'enterprise' ? 'enterprise' : 'pro')}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-2"
          >
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crown className="w-3.5 h-3.5 text-amber-300" />}
            <span>Subscribe to {subscription.plan.toUpperCase()} (${subscription.plan === 'enterprise' ? ENTERPRISE_MONTHLY : PRO_MONTHLY}/mo)</span>
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
                Your 7-day free trial has expired. Subscribe to Pro or Enterprise to continue accessing advanced tools and higher quotas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            >
              Pro (${PRO_MONTHLY}/mo)
            </button>
            <button
              onClick={() => handleSubscribe('enterprise')}
              disabled={isProcessing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            >
              Enterprise (${ENTERPRISE_MONTHLY}/mo)
            </button>
          </div>
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
                {isTrial ? `${subscription.plan.toUpperCase()} (7-Day Trial)` : `${subscription.plan} Plan`}
              </h2>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                isTrial
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : subscription.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {isTrial ? `${trialDaysRemaining} DAYS TRIAL REMAINING` : subscription.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isTrial
                ? `7-day trial ends on ${new Date(subscription.trial_ends_at!).toLocaleDateString()}. Automatic billing starts thereafter.`
                : subscription.next_billing_date
                ? `Next automatic billing date: ${new Date(subscription.next_billing_date).toLocaleDateString()}`
                : subscription.current_period_end
                ? `Current billing period ends: ${new Date(subscription.current_period_end).toLocaleDateString()}`
                : 'Free tier without recurring charge'}
            </p>
            {subscription.card_last4 && (
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl w-fit">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Authorized Card: <strong>{subscription.card_brand || 'Card'} •••• {subscription.card_last4}</strong></span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {effectivePlan === 'free' ? (
              <>
                {!trialAlreadyUsed && (
                  <button
                    onClick={() => handleStartTrial('pro')}
                    disabled={isProcessing}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Start Pro Trial</span>
                  </button>
                )}
                <button
                  onClick={() => handleSubscribe('pro')}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2 hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-300" />
                  )}
                  <span>Upgrade to Pro (${PRO_MONTHLY}/mo)</span>
                </button>
              </>
            ) : (
              (isTrial || subscription.status === 'active') && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Cancel {isTrial ? 'Trial' : 'Subscription'}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Quota Progress Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-2 p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-2xl">
            <div className="flex justify-between text-xs text-slate-600 font-bold">
              <span>Monthly Invoices</span>
              <span className="text-slate-900 font-mono">
                {effectivePlan === 'enterprise'
                  ? 'Unlimited'
                  : effectivePlan === 'pro'
                  ? `${usage.invoice_count_month} / 100`
                  : `${usage.invoice_count_month} / 5`}
              </span>
            </div>
            <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{
                  width: `${
                    effectivePlan === 'enterprise'
                      ? 20
                      : effectivePlan === 'pro'
                      ? Math.min((usage.invoice_count_month / 100) * 100, 100)
                      : Math.min((usage.invoice_count_month / 5) * 100, 100)
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2 p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-2xl">
            <div className="flex justify-between text-xs text-slate-600 font-bold">
              <span>AI Invoice Generations</span>
              <span className="text-slate-900 font-mono">
                {effectivePlan === 'enterprise'
                  ? 'Unlimited'
                  : effectivePlan === 'pro'
                  ? `${usage.ai_generations_month} / 50`
                  : `${usage.ai_generations_month} / 5`}
              </span>
            </div>
            <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all"
                style={{
                  width: `${
                    effectivePlan === 'enterprise'
                      ? 20
                      : effectivePlan === 'pro'
                      ? Math.min((usage.ai_generations_month / 50) * 100, 100)
                      : Math.min((usage.ai_generations_month / 5) * 100, 100)
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2 p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-2xl">
            <div className="flex justify-between text-xs text-slate-600 font-bold">
              <span>Clients Directory</span>
              <span className="text-slate-900 font-mono">
                {effectivePlan === 'enterprise'
                  ? 'Unlimited'
                  : effectivePlan === 'pro'
                  ? `${clients.length} / 100`
                  : `${clients.length} / 3`}
              </span>
            </div>
            <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{
                  width: `${
                    effectivePlan === 'enterprise'
                      ? 20
                      : effectivePlan === 'pro'
                      ? Math.min((clients.length / 100) * 100, 100)
                      : Math.min((clients.length / 3) * 100, 100)
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2 p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-2xl">
            <div className="flex justify-between text-xs text-slate-600 font-bold">
              <span>Recurring Invoices</span>
              <span className="text-slate-900 font-mono">
                {effectivePlan === 'enterprise'
                  ? 'Unlimited'
                  : effectivePlan === 'pro'
                  ? `${recurringInvoices.length} / 50`
                  : `${recurringInvoices.length} / 1`}
              </span>
            </div>
            <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full transition-all"
                style={{
                  width: `${
                    effectivePlan === 'enterprise'
                      ? 20
                      : effectivePlan === 'pro'
                      ? Math.min((recurringInvoices.length / 50) * 100, 100)
                      : Math.min((recurringInvoices.length / 1) * 100, 100)
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
            effectivePlan === 'free' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200/80'
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
                <span>5 AI prompt invoice generations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Standard PDF downloads</span>
              </li>
            </ul>
          </div>

          <button
            disabled
            className="w-full py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold disabled:opacity-80"
          >
            {effectivePlan === 'free' ? 'Current Active Plan' : 'Free Tier'}
          </button>
        </div>

        {/* Pro Plan */}
        <div
          className={`p-6 bg-white border rounded-3xl space-y-4 flex flex-col justify-between relative shadow-2xs ${
            effectivePlan === 'pro' ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200/80'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-blue-600 text-base">PRO</h3>
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
                <span className="font-semibold text-slate-900">100 invoices per month</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>100 clients in client directory</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>50 AI invoice generations / month</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>50 recurring invoices</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Custom business logo & branding</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Automated payment reminders</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            {!trialAlreadyUsed && effectivePlan === 'free' && (
              <button
                onClick={() => handleStartTrial('pro')}
                disabled={isProcessing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isProcessing && activePlanAction === 'pro' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Start 7-Day Free Trial</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => handleSubscribe('pro')}
              disabled={(effectivePlan === 'pro' && !isTrial) || isProcessing}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing && activePlanAction === 'pro' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : effectivePlan === 'pro' && !isTrial ? (
                'Current Active Plan'
              ) : (
                `Subscribe Pro ($${PRO_MONTHLY}/mo)`
              )}
            </button>
          </div>
        </div>

        {/* Enterprise Plan */}
        <div
          className={`p-6 bg-white border-2 rounded-3xl space-y-4 flex flex-col justify-between relative shadow-md ${
            effectivePlan === 'enterprise' ? 'border-purple-600 ring-2 ring-purple-600/30' : 'border-purple-200'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-purple-700 text-base">ENTERPRISE</h3>
              <span className="text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
                Full Power
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900">
              ${ENTERPRISE_MONTHLY} <span className="text-xs text-slate-400 font-normal">/month</span>
            </p>
            <p className="text-[11px] text-purple-700 font-semibold bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg">
              ✨ 7 days free trial, then ${ENTERPRISE_MONTHLY}/month
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-semibold text-slate-900">Unlimited invoices</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-semibold text-slate-900">Unlimited clients & products</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Unlimited recurring invoices</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Unlimited AI invoice generations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Custom business logo & branding</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Automated payment reminders</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-semibold text-purple-900">Full financial analysis & P&L</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            {!trialAlreadyUsed && effectivePlan === 'free' && (
              <button
                onClick={() => handleStartTrial('enterprise')}
                disabled={isProcessing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isProcessing && activePlanAction === 'enterprise' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Start 7-Day Free Trial</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => handleSubscribe('enterprise')}
              disabled={(effectivePlan === 'enterprise' && !isTrial) || isProcessing}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-500/20 disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing && activePlanAction === 'enterprise' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : effectivePlan === 'enterprise' && !isTrial ? (
                'Current Active Plan'
              ) : (
                `Subscribe Enterprise ($${ENTERPRISE_MONTHLY}/mo)`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Payment History Log */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Payment & Subscription Records</h3>
            <p className="text-xs text-slate-400">Verified transaction history</p>
          </div>
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
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-800 font-semibold">{p.reference || p.flutterwave_ref || p.paystack_reference}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 capitalize">{p.payment_provider || 'card'}</td>
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
          <p className="text-xs text-slate-400 py-4 text-center font-medium">No payment records yet.</p>
        )}
      </div>
    </div>
  );
};
