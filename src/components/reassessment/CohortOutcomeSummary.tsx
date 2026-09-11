import React from 'react';
import { CohortOutcomeSummary as CohortSummaryType } from '../../types/dataTypes';
import { Users, CheckCircle2, TrendingUp, Minus, TrendingDown, HelpCircle, Activity } from 'lucide-react';

interface CohortOutcomeSummaryProps {
  summary: CohortSummaryType;
}

export const CohortOutcomeSummary: React.FC<CohortOutcomeSummaryProps> = ({ summary }) => {
  const cards = [
    {
      label: 'Target Achieved',
      count: summary.targetAchievedCount,
      pct: summary.targetAchievedPct,
      icon: CheckCircle2,
      style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      desc: 'Post-intervention attainment ≥ Target'
    },
    {
      label: 'Positive Gain',
      count: summary.positiveGainCount,
      pct: summary.positiveGainPct,
      icon: TrendingUp,
      style: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      desc: 'Attainment improved, below target'
    },
    {
      label: 'No Measurable Gain',
      count: summary.noMeasurableGainCount,
      pct: summary.noMeasurableGainPct,
      icon: Minus,
      style: 'bg-slate-50 text-slate-700 border-slate-200',
      desc: 'Post attainment equals baseline'
    },
    {
      label: 'Negative Change',
      count: summary.negativeChangeCount,
      pct: summary.negativeChangePct,
      icon: TrendingDown,
      style: 'bg-rose-50 text-rose-800 border-rose-200',
      desc: 'Post attainment lower than baseline'
    },
    {
      label: 'Insufficient Data',
      count: summary.insufficientDataCount,
      pct: summary.insufficientDataPct,
      icon: HelpCircle,
      style: 'bg-amber-50 text-amber-800 border-amber-200',
      desc: 'Reassessment records pending'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Cohort-Level Observed Reassessment Distribution
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 10
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Aggregated across {summary.totalEvaluated} approved candidate case(s) ({summary.totalWithReassessment} reassessed)
            </p>
          </div>
        </div>

        {summary.meanAbsoluteLearningGain !== null && (
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800 border border-slate-200">
            <Activity className="h-3.5 w-3.5 text-indigo-600" />
            <span>
              Mean Gain: {summary.meanAbsoluteLearningGain >= 0 ? '+' : ''}
              {summary.meanAbsoluteLearningGain.toFixed(1)} pp
            </span>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 ${card.style}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{card.label}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border">
                  {card.pct}%
                </span>
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black font-mono">{card.count}</span>
                <span className="text-[11px] opacity-75 font-medium">students</span>
              </div>
              <div className="flex items-center space-x-1 text-[10px] opacity-80 pt-1 border-t border-black/5">
                <Icon className="h-3 w-3 shrink-0" />
                <span className="truncate">{card.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

