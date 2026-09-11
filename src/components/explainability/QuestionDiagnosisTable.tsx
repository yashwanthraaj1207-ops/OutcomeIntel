import React, { useState, useMemo } from 'react';
import { FileQuestion, ArrowUpDown, ShieldAlert, AlertTriangle, CheckCircle2, Award } from 'lucide-react';
import { QuestionDiagnosisItem } from '../../types/dataTypes';

interface QuestionDiagnosisTableProps {
  questions: QuestionDiagnosisItem[];
}

type SortField = 'attainment' | 'questionId' | 'topic' | 'assessment';
type SortOrder = 'asc' | 'desc';

export const QuestionDiagnosisTable: React.FC<QuestionDiagnosisTableProps> = ({ questions }) => {
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

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'attainment':
          comparison = a.attainmentPct - b.attainmentPct;
          break;
        case 'questionId':
          comparison = a.questionId.localeCompare(b.questionId, undefined, { numeric: true });
          break;
        case 'topic':
          comparison = a.topic.localeCompare(b.topic);
          break;
        case 'assessment':
          comparison = a.assessmentId.localeCompare(b.assessmentId, undefined, { numeric: true });
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [questions, sortField, sortOrder]);

  const getBadge = (_diag: string, pct: number) => {
    if (pct < 40) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
          <ShieldAlert className="h-3 w-3 text-rose-600" />
          Critical Weakness
        </span>
      );
    }
    if (pct < 60) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          Needs Reinforcement
        </span>
      );
    }
    if (pct < 80) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          Satisfactory
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1 w-fit">
        <Award className="h-3 w-3 text-blue-600" />
        Mastered
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <FileQuestion className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Question-Level Performance Breakdown
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 6
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Individual assessment question responses mapping specific academic tasks to topic weaknesses
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          Showing <strong className="font-mono text-slate-800">{questions.length}</strong> historical question attempts
        </span>
      </div>

      {/* Table */}
      {questions.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
          No question observations found for this student and CO in admitted historical assessments.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-bold select-none">
              <tr>
                <th
                  onClick={() => handleSort('questionId')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Question ID</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('topic')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Associated Topic</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('assessment')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Assessment</span>
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
                <th className="px-4 py-3">Max Marks</th>
                <th className="px-4 py-3">Diagnosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sortedQuestions.map((q) => (
                <tr key={`${q.questionId}-${q.assessmentId}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{q.questionId}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{q.topic}</td>
                  <td className="px-4 py-3 font-mono text-indigo-700 font-semibold">{q.assessmentId}</td>
                  <td className="px-4 py-3 font-mono font-bold">
                    <span className={q.attainmentPct < 40 ? 'text-rose-600' : q.attainmentPct < 60 ? 'text-amber-600' : 'text-emerald-600'}>
                      {q.attainmentPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{q.marksObtained}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{q.maxMarks}</td>
                  <td className="px-4 py-3">{getBadge(q.diagnosis, q.attainmentPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
