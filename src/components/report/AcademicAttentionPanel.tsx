import React, { useState } from 'react';
import { AcademicAttentionItem } from '../../types/dataTypes';
import { AlertCircle, AlertTriangle, TrendingUp, ShieldCheck, ArrowRight, Filter } from 'lucide-react';

interface AcademicAttentionPanelProps {
  items: AcademicAttentionItem[];
}

export const AcademicAttentionPanel: React.FC<AcademicAttentionPanelProps> = ({ items = [] }) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const safeItems = Array.isArray(items) ? items : [];

  const filtered = safeItems.filter(item => {
    if (filterCategory === 'ALL') return true;
    return item.category === filterCategory;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="h-3 w-3 mr-1 text-rose-600" />
            CRITICAL CONCERN
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />
            ATTENTION REQUIRED
          </span>
        );
      case 'OPPORTUNITY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-300">
            <TrendingUp className="h-3 w-3 mr-1 text-indigo-600" />
            POSITIVE GAIN / OPPORTUNITY
          </span>
        );
      case 'COMPLIANCE':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <ShieldCheck className="h-3 w-3 mr-1 text-slate-600" />
            COMPLIANCE / GOVERNANCE
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Actionable Academic Attention Triggers & Departmental Insights
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 9
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic, rule-based alerts highlighting accreditation deficits, high-risk concentrations, and verified pedagogical successes.
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-1 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400 mr-1" />
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              filterCategory === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({safeItems.length})
          </button>
          <button
            onClick={() => setFilterCategory('CRITICAL')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              filterCategory === 'CRITICAL'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilterCategory('WARNING')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              filterCategory === 'WARNING'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Warnings
          </button>
          <button
            onClick={() => setFilterCategory('OPPORTUNITY')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              filterCategory === 'OPPORTUNITY'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            Opportunities
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
          No attention triggers in the selected category.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border space-y-2 transition ${
                item.category === 'CRITICAL'
                  ? 'border-rose-200 bg-rose-50/30'
                  : item.category === 'WARNING'
                  ? 'border-amber-200 bg-amber-50/30'
                  : item.category === 'OPPORTUNITY'
                  ? 'border-indigo-200 bg-indigo-50/30'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  {getCategoryBadge(item.category)}
                  <h3 className="text-xs font-bold text-slate-900">
                    {item.title}
                  </h3>
                </div>

                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                  Target Entity: <strong>{item.relatedEntity}</strong>
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {item.description}
              </p>

              <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div className="text-slate-500 font-mono">
                  Evidence Basis: <span className="text-slate-700">{item.evidenceBasis}</span>
                </div>

                <div className="flex items-center space-x-1.5 text-indigo-700 font-semibold bg-white px-2.5 py-1 rounded border border-indigo-100">
                  <ArrowRight className="h-3 w-3 text-indigo-500" />
                  <span>Action: {item.suggestedAction}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

