import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, HelpCircle, Activity } from 'lucide-react';
import { RiskOverviewSummary } from '../../types/dataTypes';

interface RiskOverviewProps {
  summary: RiskOverviewSummary;
  targetThreshold: number | null;
  hasHistoricalData: boolean;
}

export const RiskOverview: React.FC<RiskOverviewProps> = ({
  summary,
  targetThreshold,
  hasHistoricalData
}) => {
  const total = summary.totalStudents;
  const highPct = total > 0 ? (summary.highRiskCount / total) * 100 : 0;
  const medPct = total > 0 ? (summary.mediumRiskCount / total) * 100 : 0;
  const lowPct = total > 0 ? (summary.lowRiskCount / total) * 100 : 0;
  const insuffPct = total > 0 ? (summary.insufficientDataCount / total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Cohort Early-Warning Overview
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                Section 2
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Multi-signal risk categorization synthesized from prediction probability, historical deficit, and performance trends
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!hasHistoricalData && (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              No Prior Assessment History
            </span>
          )}
          {targetThreshold !== null && (
            <span className="text-xs text-slate-500">
              Target: <strong className="text-slate-700 font-mono">{targetThreshold}%</strong>
            </span>
          )}
          <span className="text-xs text-slate-500">Mean Priority:</span>
          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
            {summary.averagePriorityScore} / 100
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* High Risk */}
        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200">
          <div className="flex items-center justify-between text-rose-700 text-xs mb-1.5 font-semibold">
            <span>High Risk (Critical)</span>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-900 font-mono">
            {summary.highRiskCount.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-rose-600">
              ({highPct.toFixed(1)}%)
            </span>
          </div>
          <div className="text-[11px] text-rose-600 mt-1">Urgent instructional review</div>
        </div>

        {/* Medium Risk */}
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
          <div className="flex items-center justify-between text-amber-700 text-xs mb-1.5 font-semibold">
            <span>Medium Risk (Moderate)</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900 font-mono">
            {summary.mediumRiskCount.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-amber-600">
              ({medPct.toFixed(1)}%)
            </span>
          </div>
          <div className="text-[11px] text-amber-600 mt-1">Monitored attainment gap</div>
        </div>

        {/* Low Risk */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
          <div className="flex items-center justify-between text-emerald-700 text-xs mb-1.5 font-semibold">
            <span>Low Risk (On Track)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 font-mono">
            {summary.lowRiskCount.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-emerald-600">
              ({lowPct.toFixed(1)}%)
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">Target aligned & stable</div>
        </div>

        {/* Insufficient Data */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 text-xs mb-1.5 font-semibold">
            <span>Insufficient Data</span>
            <HelpCircle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-800 font-mono">
            {summary.insufficientDataCount.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-slate-500">
              ({insuffPct.toFixed(1)}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.insufficientDataCount === 0 ? 'Zero unclassified cases' : 'Requires historical input'}
          </div>
        </div>
      </div>
    </div>
  );
};
