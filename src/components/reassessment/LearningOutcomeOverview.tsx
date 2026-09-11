import React from 'react';
import { LearningGainMetrics, EffectivenessStatus } from '../../types/dataTypes';
import { Target, TrendingUp, TrendingDown, Minus, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface LearningOutcomeOverviewProps {
  metrics: LearningGainMetrics;
  targetThreshold: number | null;
  effectiveness: EffectivenessStatus;
  isSufficient?: boolean;
}

export const LearningOutcomeOverview: React.FC<LearningOutcomeOverviewProps> = ({
  metrics,
  targetThreshold,
  effectiveness
}) => {
  const getEffectivenessBadge = (status: EffectivenessStatus) => {
    switch (status) {
      case 'TARGET ACHIEVED':
        return (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            TARGET ACHIEVED
          </span>
        );
      case 'POSITIVE GAIN':
        return (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            POSITIVE GAIN (BELOW TARGET)
          </span>
        );
      case 'NO MEASURABLE GAIN':
        return (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5">
            <Minus className="h-4 w-4 text-slate-500" />
            NO MEASURABLE GAIN
          </span>
        );
      case 'NEGATIVE CHANGE':
        return (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4 text-rose-600" />
            NEGATIVE CHANGE
          </span>
        );
      case 'INSUFFICIENT DATA':
      default:
        return (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            INSUFFICIENT DATA / PENDING
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Learning Gain & Intervention Outcome Synthesis
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 4
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic before vs after attainment comparison measured in percentage points
            </p>
          </div>
        </div>

        <div>{getEffectivenessBadge(effectiveness)}</div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Pre-Intervention Attainment */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-600">Baseline Attainment</span>
          <div className="mt-1">
            {metrics.preAttainment !== null ? (
              <div className="text-xl font-bold font-mono text-slate-900">{metrics.preAttainment.toFixed(1)}%</div>
            ) : (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 inline-block">
                Pending
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Pre-intervention score</span>
        </div>

        {/* Post-Reassessment Attainment */}
        <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-indigo-900">Reassessment Attainment</span>
          <div className="mt-1">
            {metrics.postAttainment !== null ? (
              <div className="text-xl font-bold font-mono text-indigo-900">{metrics.postAttainment.toFixed(1)}%</div>
            ) : (
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 inline-block">
                  Pending
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Awaiting reassessment data</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-indigo-600/80 mt-1">Post-intervention score</span>
        </div>

        {/* Institutional Target */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-600">Target Benchmark</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {targetThreshold !== null ? `${targetThreshold}%` : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Institutional criterion</span>
        </div>

        {/* Absolute Learning Gain */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-600">Absolute Learning Gain</span>
          <div className="mt-1">
            {metrics.absoluteGain !== null ? (
              <div className="text-xl font-bold font-mono">
                <span className={metrics.absoluteGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {metrics.absoluteGain >= 0 ? '+' : ''}
                  {metrics.absoluteGain.toFixed(1)} pp
                </span>
              </div>
            ) : (
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 inline-block">
                  Pending
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Awaiting reassessment data</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Percentage points ($Post - Pre$)</span>
        </div>

        {/* Relative Improvement */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-600">Relative Improvement</span>
          <div className="mt-1">
            {metrics.relativeImprovement !== null ? (
              <div className="text-xl font-bold font-mono">
                <span className={metrics.relativeImprovement >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {metrics.relativeImprovement >= 0 ? '+' : ''}
                  {metrics.relativeImprovement.toFixed(1)}%
                </span>
              </div>
            ) : (
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 inline-block">
                  {metrics.preAttainment === 0 ? 'Zero Baseline' : 'Pending'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Awaiting reassessment data</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Proportional baseline gain</span>
        </div>

        {/* Target Gap Closure */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-600">Target Gap Closure</span>
          <div className="mt-1">
            {metrics.targetGapClosure !== null ? (
              <div className="text-xl font-bold font-mono">
                <span className={metrics.targetGapClosure >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {metrics.targetGapClosure >= 0 ? '+' : ''}
                  {metrics.targetGapClosure.toFixed(1)} pp
                </span>
              </div>
            ) : (
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 inline-block">
                  Pending
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Awaiting reassessment data</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Deficit reduction ($pp$)</span>
        </div>
      </div>

      {/* Academic Terminology Note */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
        <Target className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Academic Formulation Standard:</strong> Absolute learning gain measures the raw difference in attainment percentage points ($Post\% - Pre\%$). Relative improvement reflects proportional gain from baseline. All values represent observed empirical measurements without assuming causal proof that the intervention alone produced the change.
        </span>
      </div>
    </div>
  );
};
