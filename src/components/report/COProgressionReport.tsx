import React from 'react';
import { COProgressionCycleItem } from '../../types/dataTypes';
import { TrendingUp, Calendar, RefreshCw, CheckCircle2 } from 'lucide-react';

interface COProgressionReportProps {
  progression: COProgressionCycleItem[];
  availableCOs: string[];
}

export const COProgressionReport: React.FC<COProgressionReportProps> = ({
  progression,
  availableCOs
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Chronological Course Outcome Progression Timeline
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 3
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Longitudinal tracking of cohort attainment trajectories across sequential assessment cycles, including post-intervention reassessment.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span>{progression.length} Assessment Milestones</span>
        </div>
      </div>

      {/* Timeline Steps Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {progression.map((cycle, idx) => {
          const isLast = idx === progression.length - 1;
          const isReassess = cycle.isReassessment;

          return (
            <div
              key={cycle.assessmentId}
              className={`p-4 rounded-xl border relative transition ${
                isReassess
                  ? 'border-indigo-300 bg-indigo-50/40'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono">
                    Step {idx + 1}
                  </span>
                  <span className="font-bold text-sm text-slate-900 font-mono">
                    {cycle.assessmentId}
                  </span>
                </div>

                {isReassess ? (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    REASSESSMENT
                  </span>
                ) : isLast ? (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                    BASELINE HORIZON
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 font-mono">
                    Historical
                  </span>
                )}
              </div>

              <div className="space-y-1 mb-3">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  Date: {cycle.assessmentDate}
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-slate-500">Overall Attainment:</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {cycle.overallAttainmentPct !== null ? `${cycle.overallAttainmentPct.toFixed(1)}%` : 'Pending'}
                  </span>
                </div>
              </div>

              {/* CO Breakdown in this cycle */}
              <div className="pt-2 border-t border-slate-200/80 space-y-1 text-xs">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  CO Breakdown:
                </span>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                  {Object.entries(cycle.coAttainments).map(([co, pct]) => (
                    <div key={co} className="flex justify-between bg-white px-2 py-1 rounded border border-slate-100">
                      <span className="font-bold text-slate-700">{co}:</span>
                      <span className="text-slate-900 font-semibold">
                        {pct !== null ? `${pct.toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 text-[10px] text-slate-400 text-right">
                {cycle.observationCount.toLocaleString()} observations
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Progression Grid */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Assessment Milestone</th>
                <th className="px-4 py-3">Administration Date</th>
                <th className="px-4 py-3">Cycle Type</th>
                <th className="px-4 py-3 text-right">Overall Attainment %</th>
                {availableCOs.map(co => (
                  <th key={co} className="px-4 py-3 text-right font-mono">
                    {co} %
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {progression.map(cycle => (
                <tr key={cycle.assessmentId} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                    {cycle.assessmentId}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {cycle.assessmentDate}
                  </td>
                  <td className="px-4 py-3">
                    {cycle.isReassessment ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Reassessment (Post-Intervention)
                      </span>
                    ) : (
                      <span className="text-slate-600">Standard Summative</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-black font-mono text-slate-900">
                    {cycle.overallAttainmentPct !== null ? `${cycle.overallAttainmentPct.toFixed(1)}%` : 'Pending'}
                  </td>
                  {availableCOs.map(co => {
                    const pct = cycle.coAttainments[co.toUpperCase()] ?? null;
                    return (
                      <td key={co} className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                        {pct !== null ? `${pct.toFixed(1)}%` : '—'}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-mono text-slate-500">
                    {cycle.observationCount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
