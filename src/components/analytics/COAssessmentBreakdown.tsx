import React from 'react';
import { CalendarDays } from 'lucide-react';
import { AssessmentBreakdownMatrix } from '../../types/dataTypes';

interface COAssessmentBreakdownProps {
  matrix: AssessmentBreakdownMatrix;
}

export const COAssessmentBreakdown: React.FC<COAssessmentBreakdownProps> = ({ matrix }) => {
  if (matrix.rows.length === 0 || matrix.assessments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No Assessment Progression Data Available</h3>
        <p className="text-xs text-slate-400 mt-1">Select an active course scope with recorded assessment cycles.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              SECTION 3 — ASSESSMENT-WISE BREAKDOWN & PROGRESSION
            </h2>
            <p className="text-xs text-slate-500">
              Trace course outcome performance across sequential assessment milestones (Internal 1, Internal 2, Model Exam)
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Assessed Cycles: <span className="font-bold text-slate-800">{matrix.assessments.join(', ')}</span>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50/90 text-slate-700 font-semibold uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3 w-28">Course</th>
              <th scope="col" className="px-4 py-3 w-24">CO ID</th>
              {matrix.assessments.map(a => (
                <th key={a} scope="col" className="px-4 py-3 text-center min-w-[140px]">
                  <div className="font-mono font-bold text-slate-900">{a}</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {a === 'A1' || a === 'B1' ? 'Internal 1' : a === 'A2' || a === 'B2' ? 'Internal 2' : a === 'A3' ? 'Model Exam' : 'Assessment'}
                  </div>
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-center min-w-[120px]">Overall Mean</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {matrix.rows.map(row => {
              // Calculate overall mean across available assessments for this CO row
              let totalObt = 0;
              let totalMax = 0;
              Object.values(row.assessmentScores).forEach(score => {
                if (score) {
                  totalObt += score.marksObtained;
                  totalMax += score.maxMarks;
                }
              });
              const overallMean = totalMax > 0 ? (totalObt / totalMax) * 100 : 0;

              return (
                <tr key={`${row.courseId}-${row.coId}`} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {row.courseId}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-indigo-700 text-sm">
                    {row.coId}
                  </td>
                  {matrix.assessments.map(a => {
                    const score = row.assessmentScores[a];
                    if (!score) {
                      return (
                        <td key={a} className="px-4 py-3 text-center text-slate-400 italic text-[11px]">
                          No data available
                        </td>
                      );
                    }

                    return (
                      <td key={a} className="px-4 py-3 text-center">
                        <div className="font-mono font-bold text-sm text-slate-900">
                          {score.attainmentPct.toFixed(2)}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {score.observations.toLocaleString()} obs ({score.marksObtained}/{score.maxMarks})
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-20 mx-auto bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              score.attainmentPct >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, score.attainmentPct))}%` }}
                          />
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center bg-slate-50/40">
                    <div className="font-mono font-black text-sm text-indigo-900">
                      {overallMean.toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Aggregated Mean</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
