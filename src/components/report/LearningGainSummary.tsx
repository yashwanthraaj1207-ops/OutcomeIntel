import React from 'react';
import { CohortOutcomeSummary } from '../../types/dataTypes';
import { Award, TrendingUp, CheckCircle2, Minus, TrendingDown, Info } from 'lucide-react';

interface LearningGainSummaryProps {
  summary: CohortOutcomeSummary | null;
}

export const LearningGainSummary: React.FC<LearningGainSummaryProps> = ({ summary }) => {
  if (!summary || summary.totalEvaluated === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Cohort-Level Learning Gain & Closed-Loop Effectiveness
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 7
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Aggregated post-intervention learning gains evaluated across approved remediation cohorts.
            </p>
          </div>
        </div>

        <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
          <Info className="h-5 w-5 text-slate-400 mx-auto mb-1" />
          <p className="font-semibold text-slate-700">No Post-Intervention Reassessment Data Evaluated</p>
          <p className="text-slate-500 mt-1">
            Load reassessment data in Module 7 or approve interventions to evaluate cohort learning gain distributions.
          </p>
        </div>
      </div>
    );
  }

  const isMeanPositive = summary.meanAbsoluteLearningGain !== null && summary.meanAbsoluteLearningGain > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Cohort-Level Learning Gain & Closed-Loop Effectiveness
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 7
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Aggregated post-intervention learning gains evaluated across approved remediation cohorts.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>{summary.totalWithReassessment} Reassessed Students of {summary.totalEvaluated}</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Target Achieved */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
            <span>Target Achieved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-950 font-mono">
              {summary.targetAchievedCount}
            </span>
            <span className="text-xs font-semibold text-emerald-700 font-mono">
              ({summary.targetAchievedPct.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] text-emerald-700">Attained institutional benchmark</p>
        </div>

        {/* Positive Gain */}
        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-1">
          <div className="flex items-center justify-between text-xs text-indigo-800 font-bold">
            <span>Positive Gain</span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-indigo-950 font-mono">
              {summary.positiveGainCount}
            </span>
            <span className="text-xs font-semibold text-indigo-700 font-mono">
              ({summary.positiveGainPct.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] text-indigo-700">Attainment increased post-intervention</p>
        </div>

        {/* No Gain */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
            <span>No Measurable Gain</span>
            <Minus className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {summary.noMeasurableGainCount}
            </span>
            <span className="text-xs font-semibold text-slate-600 font-mono">
              ({summary.noMeasurableGainPct.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-600">Zero change in score</p>
        </div>

        {/* Negative Change */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1">
          <div className="flex items-center justify-between text-xs text-rose-800 font-bold">
            <span>Negative Change</span>
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-950 font-mono">
              {summary.negativeChangeCount}
            </span>
            <span className="text-xs font-semibold text-rose-700 font-mono">
              ({summary.negativeChangePct.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] text-rose-700">Attainment declined post-test</p>
        </div>

        {/* Mean Gain */}
        <div className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 space-y-1">
          <div className="flex items-center justify-between text-xs text-indigo-900 font-bold">
            <span>Mean Absolute Gain</span>
            <Award className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className={`text-2xl font-black font-mono ${isMeanPositive ? 'text-emerald-700' : 'text-slate-900'}`}>
              {summary.meanAbsoluteLearningGain !== null
                ? `${summary.meanAbsoluteLearningGain >= 0 ? '+' : ''}${summary.meanAbsoluteLearningGain.toFixed(1)}`
                : 'Pending'}
            </span>
            <span className="text-xs font-bold text-slate-600">pp</span>
          </div>
          <p className="text-[11px] text-indigo-800">Average percentage points gained</p>
        </div>
      </div>

      {/* Pedagogical Disclaimer Note */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start space-x-2 text-xs text-slate-600">
        <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Pedagogical Measurement Note:</strong> Learning gains represent the observed difference in attainment percentage points (pp) between baseline pre-intervention assessments and post-reassessment items. In accordance with institutional reporting standards, gains reflect observed score recovery and do not make causal assertions regarding external variables.
        </div>
      </div>
    </div>
  );
};
