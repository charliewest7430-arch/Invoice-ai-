import React from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  Award,
  Zap,
  Wallet,
  TrendingDown,
  ArrowUpRight,
  Lock,
  Crown,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrencyAmount } from '../lib/exchangeRates';
import { canUseFeature, getEffectivePlan, isTrialActive } from '../lib/planLimits';

export const AnalyticsPage: React.FC = () => {
  const { invoices, clients, expenses, business, subscription, setActivePage, openUpgradeModal, startTrial, showToast } = useApp();

  const isFinancialAnalysisAllowed = canUseFeature(subscription, 'financial_analysis');
  const isPnLAllowed = canUseFeature(subscription, 'profit_and_loss');
  const effectivePlan = getEffectivePlan(subscription);
  const trialActive = isTrialActive(subscription);
  const trialUsed = Boolean(subscription.trial_started_at || subscription.trial_used);

  const totalBilled = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalPaid - totalExpenses;
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100;

  // Monthly Revenue & Expenses Data calculated dynamically from real user invoices & expenses
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const monthlyData = months.map((m, idx) => {
    const monthInvoices = invoices.filter((i) => {
      const d = new Date(i.issue_date || i.created_at);
      return d.getMonth() === idx && d.getFullYear() === currentYear;
    });
    const monthExpenses = expenses.filter((e) => {
      const d = new Date(e.expense_date || e.created_at);
      return d.getMonth() === idx && d.getFullYear() === currentYear;
    });
    const Billed = monthInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const Paid = monthInvoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
    const Expenses = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    return { month: m, Billed, Paid, Expenses };
  });

  // Status Distribution calculated dynamically from real user invoices
  const statusData = [
    { name: 'Paid', value: invoices.filter((i) => i.status === 'paid').length, color: '#10b981' },
    { name: 'Sent (Pending)', value: invoices.filter((i) => i.status === 'sent').length, color: '#3b82f6' },
    { name: 'Overdue', value: invoices.filter((i) => i.status === 'overdue').length, color: '#f43f5e' },
    { name: 'Draft', value: invoices.filter((i) => i.status === 'draft').length, color: '#94a3b8' },
  ];

  // Client Revenue Breakdown calculated dynamically from real user clients
  const clientRevenueData = clients.map((c) => {
    const clientBilled = invoices
      .filter((i) => i.client_id === c.id)
      .reduce((sum, i) => sum + (i.total || 0), 0);
    return {
      name: c.company || c.name,
      Billed: clientBilled,
    };
  });

  // If user is on Pro or Free without Enterprise access, show locked gate with upgrade option
  if (!isFinancialAnalysisAllowed || !isPnLAllowed) {
    return (
      <div className="space-y-6 animate-fade-in text-slate-800 max-w-4xl mx-auto py-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-sm text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600" />
          
          <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto shadow-xs">
            <Crown className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5" /> Enterprise Feature
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Full Financial Analysis & P&L
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Real-time Profit & Loss reports, monthly cashflow metrics, collection rate indicators, and client revenue distribution are available exclusively on the <strong className="text-purple-700">Enterprise Plan</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Net Profit & Loss
              </div>
              <p className="text-[11px] text-slate-500">Live reconciliation of collected revenue against overhead expenses.</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Cashflow Trends
              </div>
              <p className="text-[11px] text-slate-500">Annual month-by-month billed vs paid vs spent bar comparisons.</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Client Breakdown
              </div>
              <p className="text-[11px] text-slate-500">Detailed revenue generated per client account to spot top retainers.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {!trialUsed && effectivePlan === 'free' && (
              <button
                onClick={async () => {
                  const ok = await startTrial('enterprise');
                  if (ok) {
                    showToast('🎉 Enterprise 7-day trial activated! P&L and Financial Analysis unlocked.', 'success');
                  }
                }}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Enterprise 7-Day Free Trial</span>
              </button>
            )}

            <button
              onClick={() => setActivePage('billing')}
              className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Upgrade to Enterprise ($15.99/mo)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Reports & P&L</h1>
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
              Enterprise Unlocked
            </span>
          </div>
          <p className="text-xs text-slate-500">Revenue, expenses, profit/loss, and portfolio analytics</p>
        </div>

        <button
          onClick={() => setActivePage('expenses')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Wallet className="w-4 h-4 text-emerald-600" />
          <span>Manage Expenses</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* KPI Cards: Revenue, Expenses, Net Profit, Collection Rate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200/80 rounded-3xl space-y-1 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Collected</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 tracking-tight">
            {formatCurrencyAmount(totalPaid, business.default_currency || 'USD')}
          </p>
          <span className="text-[11px] text-slate-400">Total settled invoice payments</span>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-3xl space-y-1 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 tracking-tight">
            {formatCurrencyAmount(totalExpenses, business.default_currency || 'USD')}
          </p>
          <span className="text-[11px] text-slate-400">Recorded business spending</span>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-3xl space-y-1 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Net Profit / Loss</span>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${netProfit >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-2xl font-black tracking-tight ${netProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {formatCurrencyAmount(netProfit, business.default_currency || 'USD')}
          </p>
          <span className="text-[11px] text-slate-400">Paid Income minus Expenses</span>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-3xl space-y-1 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Collection Rate</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 tracking-tight">{collectionRate}%</p>
          <span className="text-[11px] text-slate-400">Paid vs total billed amount</span>
        </div>
      </div>

      {/* Recharts Visual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Monthly Revenue vs Expenses</h3>
              <p className="text-xs text-slate-400">{currentYear} Financial Calendar Overview</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Billed
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Paid
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '16px',
                    color: '#0f172a',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="Billed" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Paid" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Invoice Status Distribution</h3>
            <p className="text-xs text-slate-400">Current portfolio breakdown</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={4}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '16px',
                    color: '#0f172a',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-semibold text-[11px]">{item.name}: <b>{item.value}</b></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client Revenue Distribution Bar Chart */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xs">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm">Revenue Generated by Client</h3>
          <p className="text-xs text-slate-400">Total invoice sums per client record</p>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clientRevenueData} layout="vertical">
              <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={120} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '16px',
                  color: '#0f172a',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="Billed" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
