import React from 'react';
import { COExecutiveSummaryItem, COTargetStatus } from '../../types/dataTypes';
import { Target, CheckCircle2, AlertTriangle, HelpCircle, Layers } from 'lucide-react';

interface CourseOutcomeExecutiveSummaryProps {
  coSummary: COExecutiveSummaryItem[];
  selectedCO: string;
  onSelectCO: (coId: string) => void;
}

export const CourseOutcomeExecutiveSummary: React.FC<CourseOutcomeExecutiveSummaryProps> = ({
  coSummary,
  selectedCO,
  onSelectCO
}) => {
  const getStatusBadge = (status: COTargetStatus) => {
    switch (status) {
      case 'TARGET MET':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            TARGET MET
          </span>
        );
      case 'BELOW TARGET':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3.5 w-3.5 mr-1 text-rose-600" />
            BELOW TARGET
          </span>
        );
      case 'TARGET NOT CONFIGURED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <HelpCircle className="h-3.5 w-3.5 mr-1 text-slate-500" />
            TARGET NOT CONFIGURED
          </span>
        );
      case 'INSUFFICIENT DATA':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-600" />
            INSUFFICIENT DATA
          </span>
        );
    }
  };

  const filteredItems = selectedCO === 'ALL'
    ? coSummary
    : coSummary.filter(c => c.coId.toUpperCase() === selectedCO.toUpperCase());

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Course Outcome Executive Summary & Benchmark Compliance
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 2
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Comparative analysis of cohort attainment against institutional accreditation benchmarks across all assessed course outcomes.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Layers className="h-4 w-4 text-indigo-500" />
          <span>{filteredItems.length} Outcomes Displayed</span>
        </div>
      </div>

      {/* CO KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.map(item => {
          const isSelected = selectedCO === item.coId;
          const isMet = item.status === 'TARGET MET';
          const isBelow = item.status === 'BELOW TARGET';

          return (
            <div
              key={item.coId}
              onClick={() => onSelectCO(isSelected ? 'ALL' : item.coId)}
              className={`p-4 rounded-xl border transition cursor-pointer text-left space-y-3 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 font-mono">
                  {item.coId}
                </span>
                {getStatusBadge(item.status)}
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Cohort Attainment:</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {item.attainmentPct !== null ? `${item.attainmentPct.toFixed(1)}%` : 'Pending'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500">Institutional Target:</span>
                  <span className="font-semibold text-slate-700 font-mono">
                    {item.targetThreshold !== null ? `${item.targetThreshold}%` : 'Not Set'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500">Benchmark Gap:</span>
                  <span
                    className={`font-bold font-mono ${
                      item.gapPct === null
                        ? 'text-slate-400'
                        : isMet
                        ? 'text-emerald-600'
                        : isBelow
                        ? 'text-rose-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {item.gapPct !== null ? `${item.gapPct >= 0 ? '+' : ''}${item.gapPct.toFixed(1)} pp` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isMet ? 'bg-emerald-500' : isBelow ? 'bg-rose-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.min(item.attainmentPct ?? 0, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0%</span>
                  {item.targetThreshold !== null && (
                    <span className="font-medium text-slate-600">
                      Target: {item.targetThreshold}%
                    </span>
                  )}
                  <span>100%</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>{item.uniqueTopicsCount} Topics</span>
                <span>{item.totalStudents} Students</span>
                <span>{item.uniqueAssessmentsCount} Assessments</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Granular Table View */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3 text-right">Attainment %</th>
                <th className="px-4 py-3 text-right">Target %</th>
                <th className="px-4 py-3 text-right">Gap (pp)</th>
                <th className="px-4 py-3">Compliance Status</th>
                <th className="px-4 py-3 text-right">Topics</th>
                <th className="px-4 py-3 text-right">Assessments</th>
                <th className="px-4 py-3 text-right">Students</th>
                <th className="px-4 py-3 text-right">Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredItems.map(item => {
                const isMet = item.status === 'TARGET MET';
                const isBelow = item.status === 'BELOW TARGET';

                return (
                  <tr key={item.coId} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                      {item.coId}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {item.courseId}
                    </td>
                    <td className="px-4 py-3 text-right font-black font-mono text-slate-900">
                      {item.attainmentPct !== null ? `${item.attainmentPct.toFixed(1)}%` : 'Pending'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {item.targetThreshold !== null ? `${item.targetThreshold}%` : 'Not Configured'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold font-mono ${
                        item.gapPct === null
                          ? 'text-slate-400'
                          : isMet
                          ? 'text-emerald-600'
                          : isBelow
                          ? 'text-rose-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {item.gapPct !== null ? `${item.gapPct >= 0 ? '+' : ''}${item.gapPct.toFixed(1)} pp` : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {item.uniqueTopicsCount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {item.uniqueAssessmentsCount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {item.totalStudents}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">
                      {item.totalObservations.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

