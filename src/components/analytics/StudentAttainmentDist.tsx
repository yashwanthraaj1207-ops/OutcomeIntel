import React from 'react';
import { Users, UserCheck, UserX } from 'lucide-react';
import { StudentAttainmentDistribution } from '../../types/dataTypes';

interface StudentAttainmentDistProps {
  distributionItems: StudentAttainmentDistribution[];
}

export const StudentAttainmentDist: React.FC<StudentAttainmentDistProps> = ({ distributionItems }) => {
  if (distributionItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No Student Attainment Data Available</h3>
        <p className="text-xs text-slate-400 mt-1">Select an active course scope with student assessment records.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              SECTION 5 — STUDENT ATTAINMENT DISTRIBUTION & THRESHOLD ANALYSIS
            </h2>
            <p className="text-xs text-slate-500">
              Aggregated student-level attainment showing proportions meeting institutional threshold vs requiring remediation
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Threshold Model: <span className="font-bold text-slate-800">NBA / OBE Student Aggregation</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {distributionItems.map(item => {
          return (
            <div
              key={`${item.courseId}-${item.coId}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-black font-mono text-slate-900">
                      {item.coId}
                    </span>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.courseId}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Target: <strong className="text-slate-800">{item.targetConfigured ? `${item.targetPct}%` : 'Not configured'}</strong>
                  </span>
                </div>

                {/* Summary Dual Counters: Meeting vs Below */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                    <div className="flex items-center space-x-1.5 text-emerald-800 text-[11px] font-semibold mb-1">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Meeting Target</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xl font-bold font-mono text-emerald-700">
                        {item.studentsMeetingTarget}
                      </span>
                      <span className="text-xs text-emerald-600 font-mono">
                        ({item.percentMeetingTarget.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg">
                    <div className="flex items-center space-x-1.5 text-rose-800 text-[11px] font-semibold mb-1">
                      <UserX className="h-3.5 w-3.5 text-rose-600" />
                      <span>Below Target</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xl font-bold font-mono text-rose-700">
                        {item.studentsBelowTarget}
                      </span>
                      <span className="text-xs text-rose-600 font-mono">
                        ({item.percentBelowTarget.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stacked Cohort Progress Bar */}
                <div className="mb-4">
                  <div className="text-[11px] text-slate-500 font-semibold mb-1.5 flex justify-between">
                    <span>Performance Spread</span>
                    <span>Total: {item.totalStudents} students</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
                    {item.buckets.map((b, idx) => (
                      <div
                        key={b.rangeLabel}
                        title={`${b.rangeLabel}: ${b.studentCount} students (${b.percentage}%)`}
                        className={`h-3 transition-all ${
                          idx === 0
                            ? 'bg-rose-500'
                            : idx === 1
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${b.percentage}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Buckets Breakdown List */}
                <div className="space-y-2 text-xs">
                  {item.buckets.map((b, idx) => {
                    const dotColor = idx === 0 ? 'bg-rose-500' : idx === 1 ? 'bg-amber-400' : 'bg-emerald-500';
                    return (
                      <div
                        key={b.rangeLabel}
                        className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                          <span className="font-medium text-slate-700">{b.rangeLabel}</span>
                        </div>
                        <div className="font-mono text-slate-900 font-semibold">
                          {b.studentCount} students{' '}
                          <span className="text-slate-400 font-normal">({b.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Evaluated across {item.totalStudents} enrolled candidates</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
