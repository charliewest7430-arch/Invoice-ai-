import React, { useState } from 'react';
import { Copy, Check, ExternalLink, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUPABASE_SCHEMA_SQL } from '../../lib/supabaseSchema';

export const FULL_SUPABASE_SCHEMA = SUPABASE_SCHEMA_SQL;

interface DatabaseSetupBannerProps {
  onDismiss?: () => void;
}

export const DatabaseSetupBanner: React.FC<DatabaseSetupBannerProps> = ({ onDismiss }) => {
  const { showToast, isDatabaseMissingTables, refreshData } = useApp();
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isDatabaseMissingTables) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setIsCopied(true);
    showToast('Complete Supabase SQL Schema copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="mb-6 bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl animate-fade-in text-slate-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0 mt-0.5 sm:mt-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">Supabase Tables Not Found (PGRST205)</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
                Setup Required
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Your Supabase project is missing the required database tables. Run the migration script in your Supabase SQL Editor to enable real-time cloud data persistence with Row Level Security.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
          </button>

          <button
            onClick={async () => {
              showToast('Checking Supabase tables...', 'info');
              await refreshData();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <span>Re-check Tables</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <span>{isExpanded ? 'Hide SQL' : 'View SQL'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Quick 1-Click Instructions:</span>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline text-[11px]"
            >
              <span>Open Supabase Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <ol className="text-xs text-slate-300 list-decimal list-inside space-y-1 pl-1">
            <li>Open your Supabase project dashboard and click on the <strong>SQL Editor</strong> tab on the left.</li>
            <li>Click <strong>New Query</strong>, paste the copied SQL schema below, and click <strong>Run</strong>.</li>
            <li>Once executed, PostgREST reloads its schema cache and all data persists directly in Supabase!</li>
          </ol>

          <div className="relative mt-2">
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-56 leading-relaxed">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
