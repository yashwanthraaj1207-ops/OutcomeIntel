import React from 'react';
import { Flame, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { InterventionPriority } from '../../types/dataTypes';

export interface PriorityCounts {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  total: number;
}

interface PrioritySummaryProps {
  counts: PriorityCounts;
  selectedPriority: 'ALL' | InterventionPriority;
  onSelectPriority: (priority: 'ALL' | InterventionPriority) => void;
}

export const PrioritySummary: React.FC<PrioritySummaryProps> = ({
  counts,
  selectedPriority,
  onSelectPriority
}) => {
  const { critical, high, moderate, low, total } = counts;

  const getPct = (val: number) => (total > 0 ? ((val / total) * 100).toFixed(1) : '0.0');

  const cards = [
    {
      key: 'CRITICAL' as InterventionPriority,
      label: 'Critical Priority',
      sublabel: 'Immediate High-Intensity Remediation Required',
      count: critical,
      pct: getPct(critical),
      icon: Flame,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      activeBorder: 'border-rose-500 ring-2 ring-rose-200',
      hoverBorder: 'hover:border-rose-300',
      bgGradient: 'from-rose-50/50 to-white'
    },
    {
      key: 'HIGH' as InterventionPriority,
      label: 'High Priority',
      sublabel: 'Targeted Remediation & Guided Practice Needed',
      count: high,
      pct: getPct(high),
      icon: AlertTriangle,
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
      activeBorder: 'border-orange-500 ring-2 ring-orange-200',
      hoverBorder: 'hover:border-orange-300',
      bgGradient: 'from-orange-50/50 to-white'
    },
    {
      key: 'MODERATE' as InterventionPriority,
      label: 'Moderate Priority',
      sublabel: 'Formative Recaps & Diagnostic Quizzing',
      count: moderate,
      pct: getPct(moderate),
      icon: Clock,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      activeBorder: 'border-amber-500 ring-2 ring-amber-200',
      hoverBorder: 'hover:border-amber-300',
      bgGradient: 'from-amber-50/50 to-white'
    },
    {
      key: 'LOW' as InterventionPriority,
      label: 'Low Priority',
      sublabel: 'Sustained Alignment & Optional Enrichment',
      count: low,
      pct: getPct(low),
      icon: CheckCircle2,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-200',
      hoverBorder: 'hover:border-emerald-300',
      bgGradient: 'from-emerald-50/50 to-white'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            Cohort Intervention Priority Distribution
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Section 3
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Categorized across {total} student records using strictly ordered diagnostic precedence
          </p>
        </div>

        {selectedPriority !== 'ALL' && (
          <button
            onClick={() => onSelectPriority('ALL')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2.5 py-1 bg-indigo-50 rounded-md border border-indigo-200 self-start sm:self-auto cursor-pointer"
          >
            Clear Priority Filter (Showing {selectedPriority})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((c) => {
          const Icon = c.icon;
          const isSelected = selectedPriority === c.key;

          return (
            <div
              key={c.key}
              onClick={() => onSelectPriority(isSelected ? 'ALL' : c.key)}
              className={`p-4 rounded-xl border transition-all cursor-pointer bg-gradient-to-b ${c.bgGradient} ${
                isSelected ? c.activeBorder : `border-slate-200 ${c.hoverBorder}`
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">{c.label}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.badgeColor}`}>
                  {c.pct}%
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black font-mono text-slate-900">{c.count}</span>
                <span className="text-xs font-medium text-slate-500">students</span>
              </div>
              <div className="flex items-center space-x-1.5 mt-2.5 text-[11px] text-slate-600">
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">{c.sublabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

