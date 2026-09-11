import React, { useState } from 'react';
import { StudentRiskReportItem, FullCOIntelligenceReport } from '../../types/dataTypes';
import { AlertCircle, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, Users } from 'lucide-react';

interface StudentRiskSummaryProps {
  riskSummary: FullCOIntelligenceReport['studentRiskSummary'];
  selectedRiskFilter: string;
}

export const StudentRiskSummary: React.FC<StudentRiskSummaryProps> = ({
  riskSummary,
  selectedRiskFilter
}) => {
  const [activeTier, setActiveTier] = useState<string>(selectedRiskFilter);

  const filteredStudents = riskSummary.students.filter(s => {
    if (activeTier === 'ALL') return true;
    return s.riskLevel === activeTier;
  });

  const getRiskBadge = (level: StudentRiskReportItem['riskLevel']) => {
    switch (level) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="h-3 w-3 mr-1 text-rose-600" />
            HIGH RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />
            MEDIUM RISK
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
            LOW RISK
          </span>
        );
      case 'INSUFFICIENT':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <HelpCircle className="h-3 w-3 mr-1 text-slate-400" />
            INSUFFICIENT DATA
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
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Early-Warning Risk Classification & Pipeline Integration
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 5
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic cohort risk stratification derived from Bayesian probability forecasts, historical trend analysis, and benchmark deficits.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Users className="h-4 w-4 text-indigo-500" />
          <span>{riskSummary.totalStudents} Anonymized Students</span>
        </div>
      </div>

      {/* Cohort Risk Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* High Risk */}
        <div
          onClick={() => setActiveTier(activeTier === 'HIGH' ? 'ALL' : 'HIGH')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTier === 'HIGH'
              ? 'border-rose-400 bg-rose-50/70 ring-2 ring-rose-300'
              : 'border-rose-200 bg-rose-50/30 hover:bg-rose-50/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-700 font-bold mb-1">
            <span>High Risk Tier</span>
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-900 font-mono">
              {riskSummary.highRiskCount}
            </span>
            <span className="text-xs font-semibold text-rose-600 font-mono">
              ({riskSummary.highRiskPct.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] text-rose-700 mt-1">
            P &lt; 40% or Deficit &gt; 10 pp with Declining Trend
          </p>
        </div>

        {/* Medium Risk */}
        <div
          onClick={() => setActiveTier(activeTier === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTier === 'MEDIUM'
              ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-300'
              : 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-700 font-bold mb-1">
            <span>Medium Risk Tier</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-900 font-mono">
              {riskSummary.mediumRiskCount}
            </span>
            <span className="text-xs font-semibold text-amber-600 font-mono">
              ({riskSummary.mediumRiskPct.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            Moderate probability / intermediate attainment gap
          </p>
        </div>

        {/* Low Risk */}
        <div
          onClick={() => setActiveTier(activeTier === 'LOW' ? 'ALL' : 'LOW')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTier === 'LOW'
              ? 'border-emerald-400 bg-emerald-50/70 ring-2 ring-emerald-300'
              : 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-700 font-bold mb-1">
            <span>Low Risk Tier</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-900 font-mono">
              {riskSummary.lowRiskCount}
            </span>
            <span className="text-xs font-semibold text-emerald-600 font-mono">
              ({riskSummary.lowRiskPct.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            P &ge; 70%, Gap &ge; -5 pp, non-declining trend
          </p>
        </div>

        {/* Insufficient Data */}
        <div
          onClick={() => setActiveTier(activeTier === 'INSUFFICIENT' ? 'ALL' : 'INSUFFICIENT')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTier === 'INSUFFICIENT'
              ? 'border-slate-400 bg-slate-100 ring-2 ring-slate-300'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-700 font-bold mb-1">
            <span>Insufficient Data</span>
            <HelpCircle className="h-4 w-4" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {riskSummary.insufficientDataCount}
            </span>
            <span className="text-xs font-semibold text-slate-600 font-mono">
              ({riskSummary.insufficientDataPct.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Missing historical baseline or target mapping
          </p>
        </div>
      </div>

      {/* Filter indicator */}
      {activeTier !== 'ALL' && (
        <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg text-xs text-slate-600 border border-slate-200">
          <span>Filtering cohort roster by: <strong>{activeTier} RISK</strong></span>
          <button
            onClick={() => setActiveTier('ALL')}
            className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
          >
            Clear Filter (Show All {riskSummary.totalStudents})
          </button>
        </div>
      )}

      {/* Anonymized Student Roster Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Student ID (FERPA Anonymized)</th>
                <th className="px-4 py-3">Course / CO</th>
                <th className="px-4 py-3">Risk Classification</th>
                <th className="px-4 py-3 text-right">Predicted Prob. %</th>
                <th className="px-4 py-3">Horizon</th>
                <th className="px-4 py-3">Historical Trajectory</th>
                <th className="px-4 py-3">Diagnostic Primary Weakness</th>
                <th className="px-4 py-3">Intervention Status</th>
                <th className="px-4 py-3">Reassessment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No students found in the selected risk tier.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(s => (
                  <tr key={s.studentId} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-bold font-mono text-slate-900">
                      {s.studentId}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {s.courseId} • {s.coId}
                    </td>
                    <td className="px-4 py-3">
                      {getRiskBadge(s.riskLevel)}
                    </td>
                    <td className="px-4 py-3 text-right font-black font-mono text-slate-900">
                      {s.predictedProbability !== null ? `${s.predictedProbability.toFixed(1)}%` : 'Pending'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      [{s.predictionHorizon}]
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          s.historicalTrend === 'Declining'
                            ? 'text-rose-600'
                            : s.historicalTrend === 'Improving'
                            ? 'text-emerald-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {s.historicalTrend}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      {s.primaryWeakness}
                    </td>
                    <td className="px-4 py-3">
                      {s.hasApprovedIntervention ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Approved (M6)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.hasReassessmentOutcome ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Evaluated (M7)
                        </span>
                      ) : s.hasApprovedIntervention ? (
                        <span className="text-amber-600 font-medium text-[11px]">Awaiting Post-Test</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
