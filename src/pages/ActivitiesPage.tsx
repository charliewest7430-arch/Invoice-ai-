import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportActivitiesToCsv } from '../lib/csvExport';
import {
  Activity as ActivityIcon,
  Search,
  FileSpreadsheet,
  FileText,
  Users,
  CreditCard,
  Mail,
  Download,
  Settings,
  Sparkles,
  CheckCircle2,
  Trash2,
  Clock,
} from 'lucide-react';

export const ActivitiesPage: React.FC = () => {
  const { activities, setActivePage, setSelectedInvoiceId, logActivity, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'invoice_created':
      case 'invoice_updated':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'invoice_paid':
      case 'payment_received':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'invoice_deleted':
      case 'client_deleted':
        return <Trash2 className="w-4 h-4 text-rose-600" />;
      case 'client_added':
      case 'client_updated':
        return <Users className="w-4 h-4 text-sky-600" />;
      case 'email_sent':
        return <Mail className="w-4 h-4 text-purple-600" />;
      case 'pdf_downloaded':
        return <Download className="w-4 h-4 text-indigo-600" />;
      case 'csv_exported':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'ai_generated':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'profile_updated':
        return <Settings className="w-4 h-4 text-amber-600" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-blue-600" />;
    }
  };

  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case 'invoice_created':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'invoice_paid':
      case 'payment_received':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'invoice_deleted':
      case 'client_deleted':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'client_added':
      case 'client_updated':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'email_sent':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'pdf_downloaded':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'csv_exported':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ai_generated':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      act.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === 'all'
        ? true
        : filterType === 'invoices'
        ? act.type.startsWith('invoice')
        : filterType === 'clients'
        ? act.type.startsWith('client')
        : filterType === 'emails'
        ? act.type.includes('email')
        : filterType === 'exports'
        ? act.type.includes('pdf') || act.type.includes('csv')
        : act.type === filterType;

    return matchesSearch && matchesFilter;
  });

  const handleExportCsv = () => {
    if (activities.length === 0) {
      showToast('No activity logs to export', 'info');
      return;
    }
    const toExport = filteredActivities.length > 0 ? filteredActivities : activities;
    exportActivitiesToCsv(toExport);
    logActivity('csv_exported', `Exported ${toExport.length} activity records to CSV`);
    showToast(`Exported ${toExport.length} activity records to CSV`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Page Title & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Activity Log</span>
          </h1>
          <p className="text-xs text-slate-500">
            Real-time audit trail of invoice creation, client updates, email deliveries, and payments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-2xs"
            title="Export activity trail to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Activity CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-50 rounded-xl">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'invoices', label: 'Invoices' },
            { id: 'clients', label: 'Clients' },
            { id: 'emails', label: 'Emails' },
            { id: 'exports', label: 'Exports' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search activity records..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
        {filteredActivities.length > 0 ? (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-100">
            {filteredActivities.map((act) => {
              const formattedDate = new Date(act.created_at).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={act.id} className="relative flex items-start gap-4 group">
                  {/* Dot icon */}
                  <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center group-hover:border-blue-600 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  </div>

                  <div className="flex-1 bg-slate-50/60 hover:bg-slate-50 border border-slate-100 p-4 rounded-2xl transition-all space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                          {getActionIcon(act.type)}
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getActionBadgeColor(
                            act.type
                          )}`}
                        >
                          {act.type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 leading-relaxed pt-1">
                      {act.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <ActivityIcon className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-800">No activity logged yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When you create invoices, add clients, or send emails, chronological events will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
