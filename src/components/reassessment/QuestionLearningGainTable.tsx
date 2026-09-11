import React from 'react';
import { QuestionReassessmentComparison } from '../../types/dataTypes';
import { FileQuestion, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface QuestionLearningGainTableProps {
  questions: QuestionReassessmentComparison[];
  matchDirectly: boolean;
}

export const QuestionLearningGainTable: React.FC<QuestionLearningGainTableProps> = ({
  questions,
  matchDirectly
}) => {
  const getStatusBadge = (status: QuestionReassessmentComparison['status']) => {
    switch (status) {
      case 'Improved':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Improved
          </span>
        );
      case 'Unchanged':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
            <Minus className="h-3 w-3" /> Unchanged
          </span>
        );
      case 'Declined':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> Declined
          </span>
        );
      case 'No Direct Match':
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
            Reassessment Item
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <FileQuestion className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Question-Level Item Performance Comparison
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 7
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Granular comparison of matching assessment items between baseline and reassessment cycles
            </p>
          </div>
        </div>
      </div>

      {/* Discrepancy Notice if Question Sets Differ */}
      {!matchDirectly && questions.length > 0 && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Item Mapping Notice:</strong> Question-level comparison unavailable: reassessment items do not match the baseline question set. Topic-level and CO-level aggregations above represent the validated academic outcomes.
          </span>
        </div>
      )}

      {/* Table */}
      {questions.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
          No question records available for reassessment evaluation.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Question ID</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3 text-right">Pre Marks</th>
                <th className="px-4 py-3 text-right">Pre %</th>
                <th className="px-4 py-3 text-right">Post Marks</th>
                <th className="px-4 py-3 text-right">Post %</th>
                <th className="px-4 py-3 text-right">Change</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {questions.map((q, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{q.questionId}</td>
                  <td className="px-4 py-3 text-slate-700">{q.topic}</td>
                  <td className="px-4 py-3 font-mono text-right text-slate-600">
                    {q.preMarks !== null && q.preMaxMarks !== null ? `${q.preMarks}/${q.preMaxMarks}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-right text-slate-800">
                    {q.preAttainmentPct !== null ? `${q.preAttainmentPct.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-right text-slate-600">
                    {q.postMarks !== null && q.postMaxMarks !== null ? `${q.postMarks}/${q.postMaxMarks}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-right font-semibold text-slate-900">
                    {q.postAttainmentPct !== null ? `${q.postAttainmentPct.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-right font-bold">
                    {q.absoluteGainPct !== null ? (
                      <span className={q.absoluteGainPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {q.absoluteGainPct >= 0 ? '+' : ''}
                        {q.absoluteGainPct.toFixed(1)} pp
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(q.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

