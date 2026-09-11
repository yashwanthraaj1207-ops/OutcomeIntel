import React from 'react';
import { InterventionOutcomeReportItem, FullCOIntelligenceReport } from '../../types/dataTypes';
import { Stethoscope, CheckCircle2, TrendingUp, Minus, TrendingDown, Clock, AlertCircle } from 'lucide-react';

interface InterventionOutcomeTableProps {
  outcomes: FullCOIntelligenceReport['interventionOutcomes'];
}

export const InterventionOutcomeTable: React.FC<InterventionOutcomeTableProps> = ({
  outcomes
}) => {
  const getEffectivenessBadge = (status: InterventionOutcomeReportItem['effectivenessStatus']) => {
    switch (status) {
      case 'TARGET ACHIEVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
            TARGET ACHIEVED
          </span>
        );
      case 'POSITIVE GAIN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-300">
            <TrendingUp className="h-3 w-3 mr-1 text-indigo-600" />
            POSITIVE GAIN
          </span>
        );
      case 'NO MEASURABLE GAIN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Minus className="h-3 w-3 mr-1 text-slate-500" />
            NO GAIN
          </span>
        );
      case 'NEGATIVE CHANGE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
            <TrendingDown className="h-3 w-3 mr-1 text-rose-600" />
            NEGATIVE CHANGE
          </span>
        );
      case 'PENDING REASSESSMENT':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300">
            <Clock className="h-3 w-3 mr-1 text-amber-600" />
            PENDING REASSESSMENT
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
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Instructional Intervention Approvals & Closed-Loop Outcomes
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 6
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Audit log tracking faculty-approved pedagogical interventions and subsequent post-reassessment learning gains.
            </p>
          </div>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
            Approved: {outcomes.approvedCount}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            Evaluated: {outcomes.reassessedCount}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            Pending: {outcomes.pendingCount}
          </span>
        </div>
      </div>

      {outcomes.records.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <AlertCircle className="h-6 w-6 text-slate-400 mx-auto" />
          <p className="font-bold text-slate-700">No Approved Interventions on Record</p>
          <p>Navigate to Module 6 to review recommended strategies and approve targeted intervention plans.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Course / CO</th>
                  <th className="px-4 py-3">Target Topic</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Approved Intervention Strategy</th>
                  <th className="px-4 py-3 text-right">Pre %</th>
                  <th className="px-4 py-3 text-right">Post %</th>
                  <th className="px-4 py-3 text-right">Observed Gain (pp)</th>
                  <th className="px-4 py-3 text-center">Target Met?</th>
                  <th className="px-4 py-3">Effectiveness Status</th>
                  <th className="px-4 py-3">Cycle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {outcomes.records.map(rec => {
                  const isPositive = rec.absoluteGainPp !== null && rec.absoluteGainPp > 0;
                  const isNegative = rec.absoluteGainPp !== null && rec.absoluteGainPp < 0;

                  return (
                    <tr key={rec.interventionId} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-bold font-mono text-slate-900">
                        {rec.studentId}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {rec.courseId} • {rec.coId}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {rec.topic}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            rec.priority === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : rec.priority === 'HIGH'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rec.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{rec.interventionType}</div>
                        {rec.facultyNotes && (
                          <div className="text-[11px] text-slate-500 italic truncate max-w-xs">
                            "{rec.facultyNotes}"
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {rec.preAttainmentPct !== null ? `${rec.preAttainmentPct.toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {rec.postAttainmentPct !== null ? `${rec.postAttainmentPct.toFixed(1)}%` : 'Pending'}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-black ${
                          rec.absoluteGainPp === null
                            ? 'text-slate-400'
                            : isPositive
                            ? 'text-emerald-600'
                            : isNegative
                            ? 'text-rose-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {rec.absoluteGainPp !== null
                          ? `${rec.absoluteGainPp >= 0 ? '+' : ''}${rec.absoluteGainPp.toFixed(1)} pp`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {rec.postAttainmentPct === null ? (
                          <span className="text-slate-400 text-xs">—</span>
                        ) : rec.targetAchieved ? (
                          <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getEffectivenessBadge(rec.effectivenessStatus)}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        {rec.reassessmentAssessmentId || 'Scheduled'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

