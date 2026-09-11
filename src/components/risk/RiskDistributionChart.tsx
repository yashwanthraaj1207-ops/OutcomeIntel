import React from 'react';
import { PieChart, HelpCircle } from 'lucide-react';
import { RiskOverviewSummary } from '../../types/dataTypes';

interface RiskDistributionChartProps {
  summary: RiskOverviewSummary;
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({ summary }) => {
  const total = summary.totalStudents;

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No Risk Assessments Available</h3>
        <p className="text-xs text-slate-400 mt-1">Select an active course scope with valid prediction outputs.</p>
      </div>
    );
  }

  const highPct = (summary.highRiskCount / total) * 100;
  const medPct = (summary.mediumRiskCount / total) * 100;
  const lowPct = (summary.lowRiskCount / total) * 100;
  const insuffPct = (summary.insufficientDataCount / total) * 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Risk Proportion & Cohort Distribution
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 3
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Visual proportion of students across triage risk categories (N = {total.toLocaleString()} students)
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Evaluated from empirical Module 3 predictions
        </div>
      </div>

      {/* Proportional Stacked Progress Bar */}
      <div className="space-y-2">
        <div className="h-6 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner border border-slate-200/60">
          {highPct > 0 && (
            <div
              style={{ width: `${highPct}%` }}
              className="bg-rose-500 h-full transition-all flex items-center justify-center text-[10px] font-bold text-white tracking-wider"
              title={`High Risk: ${summary.highRiskCount} (${highPct.toFixed(1)}%)`}
            >
              {highPct >= 8 && `${highPct.toFixed(0)}%`}
            </div>
          )}

          {medPct > 0 && (
            <div
              style={{ width: `${medPct}%` }}
              className="bg-amber-500 h-full transition-all flex items-center justify-center text-[10px] font-bold text-white tracking-wider"
              title={`Medium Risk: ${summary.mediumRiskCount} (${medPct.toFixed(1)}%)`}
            >
              {medPct >= 8 && `${medPct.toFixed(0)}%`}
            </div>
          )}

          {lowPct > 0 && (
            <div
              style={{ width: `${lowPct}%` }}
              className="bg-emerald-500 h-full transition-all flex items-center justify-center text-[10px] font-bold text-white tracking-wider"
              title={`Low Risk: ${summary.lowRiskCount} (${lowPct.toFixed(1)}%)`}
            >
              {lowPct >= 8 && `${lowPct.toFixed(0)}%`}
            </div>
          )}

          {insuffPct > 0 && (
            <div
              style={{ width: `${insuffPct}%` }}
              className="bg-slate-400 h-full transition-all flex items-center justify-center text-[10px] font-bold text-white tracking-wider"
              title={`Insufficient Data: ${summary.insufficientDataCount} (${insuffPct.toFixed(1)}%)`}
            >
              {insuffPct >= 8 && `${insuffPct.toFixed(0)}%`}
            </div>
          )}
        </div>

        {/* Legend with exact metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0" />
            <div>
              <div className="font-semibold text-slate-800">
                High Risk: <span className="font-mono">{summary.highRiskCount}</span>
              </div>
              <div className="text-[11px] text-slate-500">{highPct.toFixed(1)}% of cohort</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
            <div>
              <div className="font-semibold text-slate-800">
                Medium Risk: <span className="font-mono">{summary.mediumRiskCount}</span>
              </div>
              <div className="text-[11px] text-slate-500">{medPct.toFixed(1)}% of cohort</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
            <div>
              <div className="font-semibold text-slate-800">
                Low Risk: <span className="font-mono">{summary.lowRiskCount}</span>
              </div>
              <div className="text-[11px] text-slate-500">{lowPct.toFixed(1)}% of cohort</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-slate-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-slate-800">
                Insufficient: <span className="font-mono">{summary.insufficientDataCount}</span>
              </div>
              <div className="text-[11px] text-slate-500">{insuffPct.toFixed(1)}% of cohort</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

