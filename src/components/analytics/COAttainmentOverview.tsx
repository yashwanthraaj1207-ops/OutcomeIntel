import React from 'react';
import { Target, CheckCircle2, AlertTriangle, HelpCircle, Users } from 'lucide-react';
import { COAttainmentItem } from '../../types/dataTypes';

interface COAttainmentOverviewProps {
  coItems: COAttainmentItem[];
}

export const COAttainmentOverview: React.FC<COAttainmentOverviewProps> = ({ coItems }) => {
  if (coItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <Target className="h-10 w-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No Course Outcomes for Selected Filter Scope</h3>
        <p className="text-xs text-slate-400 mt-1">Adjust the course or CO filter to view attainment metrics.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              SECTION 2 — COURSE OUTCOME ATTAINMENT OVERVIEW
            </h2>
            <p className="text-xs text-slate-500">
              Evaluates institutional target attainment and performance gaps for each dynamic Course Outcome
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Derived COs: <span className="font-bold text-slate-800">{coItems.length} Outcomes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {coItems.map(item => {
          const isMet = item.status === 'Target Met';
          const isBelow = item.status === 'Below Target';

          return (
            <div
              key={`${item.courseId}-${item.coId}`}
              className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                isMet
                  ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 shadow-sm'
                  : isBelow
                  ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 shadow-sm'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-black font-mono text-slate-900 tracking-tight">
                      {item.coId}
                    </span>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.courseId}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {isMet && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>Target Met</span>
                    </span>
                  )}
                  {isBelow && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      <AlertTriangle className="h-3 w-3 text-rose-600" />
                      <span>Below Target</span>
                    </span>
                  )}
                  {!item.targetConfigured && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                      <HelpCircle className="h-3 w-3" />
                      <span>No Target</span>
                    </span>
                  )}
                </div>

                {/* Primary Metric: Mean Score Attainment */}
                <div className="mb-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Mean Score Attainment
                  </span>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className={`text-2xl font-black font-mono tracking-tight ${
                      isMet ? 'text-emerald-700' : isBelow ? 'text-rose-700' : 'text-slate-900'
                    }`}>
                      {item.attainmentPct.toFixed(2)}%
                    </span>
                    {item.gapPct !== null && (
                      <span className={`text-xs font-bold font-mono ${
                        item.gapPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {item.gapPct >= 0 ? `+${item.gapPct.toFixed(2)}%` : `${item.gapPct.toFixed(2)}%`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isMet ? 'bg-emerald-500' : isBelow ? 'bg-rose-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, item.attainmentPct))}%` }}
                  />
                </div>

                {/* Target & Gap Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-white/70 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Inst. Target</span>
                    <span className="font-mono font-bold text-slate-800">
                      {item.targetConfigured ? `${item.targetPct}%` : 'Target not configured'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Gap</span>
                    <span className={`font-mono font-bold ${
                      item.gapPct !== null
                        ? item.gapPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        : 'text-slate-400'
                    }`}>
                      {item.gapPct !== null
                        ? `${item.gapPct >= 0 ? '+' : ''}${item.gapPct.toFixed(2)}%`
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Student Threshold Attainment distinction */}
                <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center">
                      <Users className="h-3 w-3 mr-1 text-slate-400" />
                      Students ≥ Target:
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {item.targetConfigured
                        ? `${item.studentsMeetingTarget} / ${item.totalStudents} (${item.studentThresholdAttainmentPct.toFixed(1)}%)`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Contributing Evidence */}
              <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>{item.questionCount} question(s)</span>
                <span className="font-mono">{item.observationCount.toLocaleString()} obs.</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
