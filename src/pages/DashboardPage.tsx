import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  getExchangeRates,
  convertCurrency,
  formatCurrencyAmount,
  DEFAULT_EXCHANGE_RATES,
} from '../lib/exchangeRates';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Plus,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  Zap,
  Globe2,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface DashboardPageProps {
  onOpenNewInvoice: () => void;
  onOpenAiModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenNewInvoice,
  onOpenAiModal,
}) => {
  const { user, profile, loading: authLoading } = useAuth();
  const {
    invoices: contextInvoices,
    subscription,
    usage,
    activities,
    setActivePage,
    setSelectedInvoiceId,
    business,
  } = useApp();

  // Multi-Currency & Supabase State
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(DEFAULT_EXCHANGE_RATES);
  const [selectedCurrencyView, setSelectedCurrencyView] = useState<string>('ALL');
  const [isSyncingRates, setIsSyncingRates] = useState<boolean>(false);
  const [baseCurrency, setBaseCurrency] = useState<string>(business?.default_currency || 'USD');
  const [timeframe, setTimeframe] = useState<'1m' | '3m' | '6m' | '1Y' | 'ALL'>('1Y');

  // Supported Currency List
  const AVAILABLE_CURRENCIES = [
    { code: 'USD', label: 'USD ($) - US Dollar' },
    { code: 'GBP', label: 'GBP (£) - British Pound' },
    { code: 'EUR', label: 'EUR (€) - Euro' },
    { code: 'NGN', label: 'NGN (₦) - Nigerian Naira' },
    { code: 'CAD', label: 'CAD (CA$) - Canadian Dollar' },
    { code: 'AUD', label: 'AUD (A$) - Australian Dollar' },
  ];

  // Update base currency from business settings
  useEffect(() => {
    if (business?.default_currency) {
      setBaseCurrency(business.default_currency.toUpperCase());
    }
  }, [business?.default_currency]);

  // Sync exchange rates
  const syncRates = async () => {
    setIsSyncingRates(true);
    try {
      const rates = await getExchangeRates();
      setExchangeRates(rates);
    } catch (e) {
      console.warn('Could not sync exchange rates:', e);
    } finally {
      setIsSyncingRates(false);
    }
  };

  useEffect(() => {
    syncRates();
  }, []);

  // Compute available currency options dynamically
  const availableCurrencyOptions = useMemo(() => {
    const list = [...AVAILABLE_CURRENCIES];
    const existingCodes = new Set(list.map((c) => c.code));

    contextInvoices.forEach((inv) => {
      if (inv.currency) {
        const code = inv.currency.toUpperCase();
        if (!existingCodes.has(code)) {
          existingCodes.add(code);
          list.push({ code, label: `${code} - ${code}` });
        }
      }
    });

    if (baseCurrency && !existingCodes.has(baseCurrency)) {
      list.push({ code: baseCurrency, label: `${baseCurrency} - ${baseCurrency}` });
    }

    return list;
  }, [contextInvoices, baseCurrency]);

  // Filter or convert invoice totals based on active currency view selection
  const calculatedMetrics = useMemo(() => {
    let billed = 0;
    let paid = 0;
    let outstanding = 0;
    let overdue = 0;

    let billedCount = 0;
    let paidCount = 0;
    let outstandingCount = 0;
    let overdueCount = 0;

    contextInvoices.forEach((inv) => {
      const invCurrency = (inv.currency || 'USD').toUpperCase();
      const rawTotal = Number(inv.total) || 0;

      if (selectedCurrencyView === 'ALL') {
        const converted = convertCurrency(rawTotal, invCurrency, baseCurrency, exchangeRates);
        billed += converted;
        billedCount += 1;

        if (inv.status === 'paid') {
          paid += converted;
          paidCount += 1;
        } else if (inv.status === 'overdue') {
          overdue += converted;
          overdueCount += 1;
        } else if (inv.status === 'sent' || inv.status === 'draft') {
          outstanding += converted;
          outstandingCount += 1;
        }
      } else {
        if (invCurrency === selectedCurrencyView) {
          billed += rawTotal;
          billedCount += 1;

          if (inv.status === 'paid') {
            paid += rawTotal;
            paidCount += 1;
          } else if (inv.status === 'overdue') {
            overdue += rawTotal;
            overdueCount += 1;
          } else if (inv.status === 'sent' || inv.status === 'draft') {
            outstanding += rawTotal;
            outstandingCount += 1;
          }
        }
      }
    });

    const activeCurrencyCode = selectedCurrencyView === 'ALL' ? baseCurrency : selectedCurrencyView;
    const collectionRate = billed > 0 ? Math.round((paid / billed) * 100) : 100;

    return {
      totalBilled: billed,
      totalPaid: paid,
      totalOutstanding: outstanding,
      totalOverdue: overdue,
      billedCount,
      paidCount,
      outstandingCount,
      overdueCount,
      activeCurrencyCode,
      collectionRate,
    };
  }, [contextInvoices, selectedCurrencyView, baseCurrency, exchangeRates]);

  // Chart data: Monthly revenue curves
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();

  const monthlyChartData = useMemo(() => {
    return months.map((m, idx) => {
      const monthInvoices = contextInvoices.filter((i) => {
        const d = new Date(i.issue_date || i.created_at);
        return d.getMonth() === idx && d.getFullYear() === currentYear;
      });

      let billedSum = 0;
      let paidSum = 0;

      monthInvoices.forEach((inv) => {
        const invCurrency = (inv.currency || 'USD').toUpperCase();
        const rawTotal = Number(inv.total) || 0;
        const converted =
          selectedCurrencyView === 'ALL'
            ? convertCurrency(rawTotal, invCurrency, baseCurrency, exchangeRates)
            : invCurrency === selectedCurrencyView
            ? rawTotal
            : 0;

        billedSum += converted;
        if (inv.status === 'paid') {
          paidSum += converted;
        }
      });

      return {
        month: m,
        Revenue: billedSum,
        Paid: paidSum,
      };
    });
  }, [contextInvoices, selectedCurrencyView, baseCurrency, exchangeRates, currentYear]);

  // Secondary curve data (Simulated smooth interpolation or weekly view)
  const splineTrendData = useMemo(() => {
    return monthlyChartData.filter((_, idx) => idx % 2 === 0 || idx === 11);
  }, [monthlyChartData]);

  if (authLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-10 w-64 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white rounded-3xl border border-slate-200" />
          <div className="h-72 bg-white rounded-3xl border border-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Top Filter Bar: Quick Stats Info */}
      <div className="flex items-center justify-between gap-3 bg-white p-3.5 sm:px-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Real-time Financial Overview for <strong>{business?.name || 'Your Business'}</strong></span>
        </div>
      </div>

      {/* Row 1: Top Main Cards (Revenue Chart 60% + Pending Payments Gauge 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Main Revenue Chart Card */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Revenue</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {formatCurrencyAmount(calculatedMetrics.totalBilled, calculatedMetrics.activeCurrencyCode)}
                </span>
                <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  +12.4%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-slate-400 font-medium">
                {calculatedMetrics.billedCount} Invoices
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Billed</span>
                <span className="w-2 h-2 rounded-full bg-blue-300 ml-2" />
                <span>Collected</span>
              </div>
            </div>
          </div>

          {/* Smooth Recharts Spline Curve */}
          <div className="h-56 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#f1f5f9' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val > 999 ? `${Math.round(val / 1000)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  formatter={(value: any) => [
                    formatCurrencyAmount(Number(value) || 0, calculatedMetrics.activeCurrencyCode),
                    '',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Total Billed"
                />
                <Area
                  type="monotone"
                  dataKey="Paid"
                  stroke="#93c5fd"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorPaid)"
                  name="Paid Cash"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Pending Payments & Circular Collection Gauge */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Pending Payments</h2>
            <button className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Circular Progress & Breakdown Layout (Matches Reference Photo) */}
          <div className="flex items-center justify-between gap-4 py-2">
            {/* Circular Gauge */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-28 h-28 -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="44"
                  className="text-slate-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="44"
                  className="text-blue-600 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={276}
                  strokeDashoffset={276 - (276 * calculatedMetrics.collectionRate) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-slate-900">{calculatedMetrics.collectionRate}%</span>
                <span className="text-[10px] font-semibold text-slate-400">Settled</span>
              </div>
            </div>

            {/* Price Itemized List */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400 block">Total Price Billed</span>
                <span className="text-base font-black text-slate-900">
                  {formatCurrencyAmount(calculatedMetrics.totalBilled, calculatedMetrics.activeCurrencyCode)}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 block">+62.5% vs avg</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Outstanding:</span>
                <span className="font-bold text-slate-800">
                  {formatCurrencyAmount(calculatedMetrics.totalOutstanding, calculatedMetrics.activeCurrencyCode)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>Collection Goal</span>
              <span className="font-bold text-slate-700">{calculatedMetrics.collectionRate}% / 100%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(calculatedMetrics.collectionRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Prominent "+ Create New Invoice" Button (As in Reference Design) */}
          <button
            onClick={onOpenNewInvoice}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* Row 2: Middle Cards (Revenue Trend Curves with Timeframe + Recent Payments Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 3: Revenue Curves Card */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Revenue Curves</h3>
              <p className="text-xs text-slate-400">Cash collection flow & predictive invoice velocity</p>
            </div>

            {/* Timeframe Switcher (1m, 3m, 6m, 1Y, ALL) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              {(['1m', '3m', '6m', '1Y', 'ALL'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    timeframe === t
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Smooth Dual Curves */}
          <div className="h-48 sm:h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#f1f5f9' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val > 999 ? `${Math.round(val / 1000)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  formatter={(value: any) => [
                    formatCurrencyAmount(Number(value) || 0, calculatedMetrics.activeCurrencyCode),
                    '',
                  ]}
                />
                <Line
                  type="natural"
                  dataKey="Revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563eb' }}
                  name="Gross Billed"
                />
                <Line
                  type="natural"
                  dataKey="Paid"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 2, fill: '#38bdf8' }}
                  name="Settled Cash"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4: Recent Invoice Payments */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">Invoice Payments</h3>
            <button className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 flex-1 divide-y divide-slate-100">
            {contextInvoices.slice(0, 3).map((inv) => (
              <div
                key={inv.id}
                onClick={() => {
                  setSelectedInvoiceId(inv.id);
                  setActivePage('invoice_detail');
                }}
                className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{inv.client?.name || 'Client'}</p>
                  <p className="text-[11px] text-slate-400">{inv.number} • {inv.due_date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-slate-900">
                    {formatCurrencyAmount(inv.total, inv.currency || 'USD')}
                  </p>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-full ${
                      inv.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}
                  >
                    {inv.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}

            {contextInvoices.length === 0 && (
              <p className="text-xs text-slate-400 italic py-4 text-center">No payment records found</p>
            )}
          </div>

          {/* Total Progress Bar at bottom of card (Matches Reference Design) */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Total Payments</span>
              <span className="font-black text-slate-900">
                {formatCurrencyAmount(calculatedMetrics.totalPaid, calculatedMetrics.activeCurrencyCode)}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(calculatedMetrics.collectionRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Bottom Cards (Recent Documents Table & AI / Subscription Quick Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 5: Documents / Invoices Table (Bottom Left) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent Documents & Invoices</h3>
              <p className="text-xs text-slate-400">All issued and pending customer billing records</p>
            </div>

            <button
              onClick={() => setActivePage('invoices')}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              <span>See More</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pl-2">Invoice / Client</th>
                  <th className="pb-3">Issue Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contextInvoices.slice(0, 5).map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvoiceId(inv.id);
                      setActivePage('invoice_detail');
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {inv.number}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {inv.client?.company || inv.client?.name || 'Client'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 text-slate-500 font-medium">
                      {inv.issue_date || 'Today'}
                    </td>

                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'overdue'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {inv.status === 'paid' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {inv.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 pr-2 text-right font-black text-slate-900">
                      {formatCurrencyAmount(inv.total, inv.currency || 'USD')}
                    </td>
                  </tr>
                ))}

                {contextInvoices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No invoices issued yet. Click "+ Create New Invoice" to start!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 6: AI Assistant & Quick Actions (Bottom Right) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Smart Actions
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                Gemini AI 2.0
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Instant AI Invoicing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Describe your project or work hours in natural language, and Gemini will generate itemized invoices in seconds.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={onOpenAiModal}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Generate Invoice with AI</span>
            </button>

            <button
              onClick={() => setActivePage('billing')}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Subscription & Billing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
