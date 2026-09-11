import React from 'react';
import {
  FileText,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  CheckSquare
} from 'lucide-react';
import { RiskAssessment } from '../../types/dataTypes';

interface RiskDetailPanelProps {
  selectedAssessment: RiskAssessment | null;
}

export const RiskDetailPanel: React.FC<RiskDetailPanelProps> = ({ selectedAssessment }) => {
  if (!selectedAssessment) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <HelpCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No Student Selected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Click on any student record in the table above to inspect multi-signal risk evidence.
        </p>
      </div>
    );
  }

  const { features, riskLevel, priorityScore, priorityRank, reasons, contributingSignals } =
    selectedAssessment;
  const isHigh = riskLevel === 'HIGH RISK';
  const isMed = riskLevel === 'MEDIUM RISK';
  const isLow = riskLevel === 'LOW RISK';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Multi-Signal Risk Evidence & Priority Breakdown
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-mono">
                {selectedAssessment.studentId}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic factor synthesis combining predictive model probability with factual historical attainment
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isHigh && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span>HIGH RISK (Priority #{priorityRank})</span>
            </span>
          )}
          {isMed && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>MEDIUM RISK (Priority #{priorityRank})</span>
            </span>
          )}
          {isLow && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>LOW RISK (Priority #{priorityRank})</span>
            </span>
          )}
          {riskLevel === 'INSUFFICIENT DATA' && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
              <HelpCircle className="h-4 w-4 text-slate-500" />
              <span>INSUFFICIENT DATA</span>
            </span>
          )}
        </div>
      </div>

      {/* Signal Evidence Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Predicted Attainment */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <span className="text-[11px] text-slate-500 block mb-0.5">Predicted P(Meets Target)</span>
          <div className="text-lg font-bold font-mono text-slate-900">
            {features.predictedProbability !== null
              ? `${features.predictedProbability.toFixed(1)}%`
              : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-400">Module 3 output</span>
        </div>

        {/* Historical Mean Attainment */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <span className="text-[11px] text-slate-500 block mb-0.5">Historical Attainment</span>
          <div className="text-lg font-bold font-mono text-slate-900">
            {features.historicalAttainment !== null
              ? `${features.historicalAttainment.toFixed(1)}%`
              : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-400">Pre-cutoff average</span>
        </div>

        {/* Attainment Gap */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <span className="text-[11px] text-slate-500 block mb-0.5">Attainment Gap vs Target</span>
          <div className="text-lg font-bold font-mono">
            {features.attainmentGap !== null ? (
              <span className={features.attainmentGap < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {features.attainmentGap >= 0
                  ? `+${features.attainmentGap.toFixed(1)}%`
                  : `${features.attainmentGap.toFixed(1)}%`}
              </span>
            ) : (
              <span className="text-slate-400">N/A</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400">
            Target: {features.configuredTarget ? `${features.configuredTarget}%` : 'N/A'}
          </span>
        </div>

        {/* Priority Score */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <span className="text-[11px] text-slate-500 block mb-0.5">Prototype Priority Score</span>
          <div className="text-lg font-bold font-mono text-indigo-700">
            {priorityScore !== null ? `${priorityScore} / 100` : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-400">Triage urgency index</span>
        </div>
      </div>

      {/* Trajectory & Consistency Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block">Performance Trajectory</span>
            <strong className="text-xs font-semibold text-slate-800 font-mono">
              {features.performanceTrend}
            </strong>
          </div>
          <span className="text-[11px] text-slate-400">Across prior assessment cycles</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block">Score Consistency (Historical StdDev)</span>
            <strong className="text-xs font-semibold text-slate-800 font-mono">
              {features.consistencyLabel}{' '}
              {features.consistencyScore !== null && `(σ = ${features.consistencyScore})`}
            </strong>
          </div>
          <span className="text-[11px] text-slate-400">Score variance index</span>
        </div>
      </div>

      {/* Deterministic Risk Reasons & Factors */}
      <div className="pt-2">
        <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
          <CheckSquare className="h-3.5 w-3.5 text-rose-600" />
          <span>Contributing Deterministic Risk Factors</span>
        </h4>

        <div className="space-y-1.5">
          {reasons.map((reason, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border text-xs flex items-start space-x-2 ${
                isHigh
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : isMed
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : isLow
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/70 text-slate-700 flex-shrink-0">
                Factor {idx + 1}
              </span>
              <span className="font-medium leading-relaxed">{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contributing Signals Tags */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-slate-500 font-medium mr-1">Activated Signals:</span>
        {contributingSignals.map((sig, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
          >
            {sig}
          </span>
        ))}
      </div>

      {/* Disclosure */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-3 text-[11px] text-slate-500 leading-relaxed">
        <strong className="text-slate-700 block mb-0.5">Faculty Triage Advisory:</strong>
        Risk factors are calculated directly from empirical metrics without natural language AI generation. Deep topic-level diagnosis and instructional intervention planning will be provided in Module 5 and Module 6.
      </div>
    </div>
  );
};
