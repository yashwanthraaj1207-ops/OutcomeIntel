import React from 'react';
import { TopicReassessmentComparison } from '../../types/dataTypes';
import { Layers, TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';

interface TopicLearningGainTableProps {
  topics: TopicReassessmentComparison[];
}

export const TopicLearningGainTable: React.FC<TopicLearningGainTableProps> = ({ topics }) => {
  const getStatusBadge = (status: TopicReassessmentComparison['status']) => {
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
      case 'Insufficient Data':
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
            <HelpCircle className="h-3 w-3" /> Pending
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
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Topic-Level Learning Gain Analysis
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 6
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Ranked by observed absolute learning gain in percentage points ({topics.length} diagnosed topics)
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      {topics.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
          No topic evidence available for the selected Course Outcome.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">CO</th>
                <th className="px-4 py-3 text-right">Pre Attainment</th>
                <th className="px-4 py-3 text-right">Post Attainment</th>
                <th className="px-4 py-3 text-right">Learning Gain</th>
                <th className="px-4 py-3 text-right">Target</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {topics.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">{t.topic}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{t.coId}</td>
                  <td className="px-4 py-3 font-mono text-right text-slate-800">
                    {t.preAttainment !== null ? `${t.preAttainment.toFixed(1)}%` : 'Pending'}
                  </td>
                  <td className="px-4 py-3 font-mono text-right font-semibold text-slate-900">
                    {t.postAttainment !== null ? `${t.postAttainment.toFixed(1)}%` : 'Pending'}
                  </td>
                  <td className="px-4 py-3 font-mono text-right font-bold">
                    {t.absoluteGain !== null ? (
                      <span className={t.absoluteGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {t.absoluteGain >= 0 ? '+' : ''}
                        {t.absoluteGain.toFixed(1)} pp
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-right text-slate-500">
                    {t.targetThreshold !== null ? `${t.targetThreshold}%` : '70%'}
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(t.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

