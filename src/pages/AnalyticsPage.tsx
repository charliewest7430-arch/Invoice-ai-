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
import { BarChart3, TrendingUp, DollarSign, Clock, CheckCircle2, Award, Zap, Wallet, TrendingDown, ArrowUpRight } from 'lucide-react';
import { formatCurrencyAmount } from '../lib/exchangeRates';

export const AnalyticsPage: React.FC = () => {
  const { invoices, clients, expenses, business, setActivePage } = useApp();

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

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Reports & P&L</h1>
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
