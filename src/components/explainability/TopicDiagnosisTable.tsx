import React, { useState, useMemo } from 'react';
import { Layers, ArrowUpDown, ShieldAlert, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { TopicDiagnosisItem, TopicDiagnosisCategory } from '../../types/dataTypes';

interface TopicDiagnosisTableProps {
  topics: TopicDiagnosisItem[];
  targetThreshold: number | null;
}

type SortField = 'attainment' | 'gap' | 'topic' | 'questions';
type SortOrder = 'asc' | 'desc';

export const TopicDiagnosisTable: React.FC<TopicDiagnosisTableProps> = ({ topics, targetThreshold }) => {
  const [sortField, setSortField] = useState<SortField>('attainment');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc'); // Default weakest first

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'attainment':
          comparison = a.attainmentPct - b.attainmentPct;
          break;
        case 'gap':
          comparison = (a.gapPct ?? -999) - (b.gapPct ?? -999);
          break;
        case 'topic':
          comparison = a.topic.localeCompare(b.topic);
          break;
        case 'questions':
          comparison = a.questionCount - b.questionCount;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [topics, sortField, sortOrder]);

  const getDiagnosisBadge = (cat: TopicDiagnosisCategory) => {
    switch (cat) {
      case 'Critical Weakness':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
            <ShieldAlert className="h-3 w-3 text-rose-600" />
            Critical Weakness (&lt; 50%)
          </span>
        );
      case 'Needs Attention':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            Needs Attention (&lt; Target)
          </span>
        );
      case 'Adequate':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Adequate (&ge; Target)
          </span>
        );
      case 'Strong':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1 w-fit">
            <ShieldCheck className="h-3 w-3 text-blue-600" />
            Strong (&ge; 80%)
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Topic-Level Performance Diagnosis
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 5
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Granular topic root-cause attribution ranked from weakest to strongest performance
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          {targetThreshold === null && (
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
              Target reference unavailable — using prototype fallback diagnostic rule (70%)
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      {topics.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
          No topic performance observations available in historical assessments for this student and CO.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-bold select-none">
              <tr>
                <th
                  onClick={() => handleSort('topic')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Topic</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('attainment')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Attainment %</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3">Marks Obtained</th>
                <th className="px-4 py-3">Target Reference</th>
                <th
                  onClick={() => handleSort('gap')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Gap</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('questions')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Questions</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3">Observations</th>
                <th className="px-4 py-3">Diagnostic Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sortedTopics.map((t) => (
                <tr key={t.topic} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{t.topic}</td>
                  <td className="px-4 py-3 font-mono font-bold">
                    <span className={t.attainmentPct < 50 ? 'text-rose-600' : t.attainmentPct < 70 ? 'text-amber-600' : 'text-emerald-600'}>
                      {t.attainmentPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {t.totalMarksObtained} / {t.totalMaxMarks}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {t.targetPct !== null ? `${t.targetPct}%` : 'Unavailable (70% fallback)'}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {t.gapPct !== null ? (
                      <span className={t.gapPct < 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                        {t.gapPct > 0 ? '+' : ''}{t.gapPct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{t.questionCount}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{t.observationCount}</td>
                  <td className="px-4 py-3">{getDiagnosisBadge(t.diagnosisCategory)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

