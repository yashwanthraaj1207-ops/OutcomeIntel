import React, { useState } from 'react';
import { HelpCircle, ArrowUpDown, Filter, CheckCircle2, AlertTriangle, ListChecks } from 'lucide-react';
import { QuestionPerformanceItem } from '../../types/dataTypes';

interface QuestionPerformanceMatrixProps {
  questionItems: QuestionPerformanceItem[];
}

export const QuestionPerformanceMatrix: React.FC<QuestionPerformanceMatrixProps> = ({ questionItems }) => {
  const [sortField, setSortField] = useState<keyof QuestionPerformanceItem>('questionId');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedCOFilter, setSelectedCOFilter] = useState<string>('ALL');
  const [selectedAssessmentFilter, setSelectedAssessmentFilter] = useState<string>('ALL');

  if (questionItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <ListChecks className="h-10 w-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No Question Performance Data</h3>
        <p className="text-xs text-slate-400 mt-1">Select an active course scope with associated assessment records.</p>
      </div>
    );
  }

  const distinctCOs = Array.from(new Set(questionItems.map(q => q.coId))).sort();
  const distinctAssessments = Array.from(new Set(questionItems.map(q => q.assessmentId))).sort();

  const filteredQuestions = questionItems.filter(item => {
    if (selectedCOFilter !== 'ALL' && item.coId !== selectedCOFilter) return false;
    if (selectedAssessmentFilter !== 'ALL' && item.assessmentId !== selectedAssessmentFilter) return false;
    return true;
  });

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (aVal === null || aVal === undefined) aVal = -Infinity;
    if (bVal === null || bVal === undefined) bVal = -Infinity;

    if (typeof aVal === 'string') {
      return sortAsc
        ? (aVal as string).localeCompare(bVal as string, undefined, { numeric: true })
        : (bVal as string).localeCompare(aVal as string, undefined, { numeric: true });
    }

    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const handleSort = (field: keyof QuestionPerformanceItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending on numeric/metric toggle
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Question Performance Matrix
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {filteredQuestions.length} Questions
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Deterministic question-level attainment displaying Question → Topic → CO traceability
            </p>
          </div>
        </div>

        {/* Local Table Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Assessment:</span>
            <select
              value={selectedAssessmentFilter}
              onChange={e => setSelectedAssessmentFilter(e.target.value)}
              className="text-xs py-1 px-2 border border-slate-200 rounded-md bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All ({distinctAssessments.length})</option>
              {distinctAssessments.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <span>CO:</span>
            <select
              value={selectedCOFilter}
              onChange={e => setSelectedCOFilter(e.target.value)}
              className="text-xs py-1 px-2 border border-slate-200 rounded-md bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All ({distinctCOs.length})</option>
              {distinctCOs.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-semibold border-y border-slate-200 uppercase tracking-wider text-[11px]">
              <th
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('questionId')}
              >
                <div className="flex items-center space-x-1">
                  <span>Question</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('assessmentId')}
              >
                <div className="flex items-center space-x-1">
                  <span>Assessment</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('topic')}
              >
                <div className="flex items-center space-x-1">
                  <span>Topic</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('coId')}
              >
                <div className="flex items-center space-x-1">
                  <span>Mapped CO</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('averageMarks')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Avg Marks / Max</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('attainmentPct')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Attainment %</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('observationCount')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Observations</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedQuestions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                  No questions match the current filters.
                </td>
              </tr>
            ) : (
              sortedQuestions.map((item, idx) => {
                const isLagging = item.status === 'Below Target';
                const isMet = item.status === 'Target Met';

                return (
                  <tr
                    key={`${item.courseId}-${item.assessmentId}-${item.questionId}`}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/30' : ''
                    } ${isLagging ? 'bg-rose-50/20' : ''}`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono">
                      {item.questionId}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                        {item.assessmentId}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {item.topic}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                        {item.coId}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700">
                      {item.averageMarks.toFixed(2)} / {item.maxMarks}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span
                        className={
                          isLagging
                            ? 'text-rose-600'
                            : isMet
                            ? 'text-emerald-600'
                            : 'text-slate-700'
                        }
                      >
                        {item.attainmentPct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {item.observationCount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isMet ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Met</span>
                        </span>
                      ) : isLagging ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Below</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <HelpCircle className="h-3 w-3" />
                          <span>No Target</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
        <div>
          Showing {sortedQuestions.length} of {questionItems.length} question performances
        </div>
        <div className="flex items-center space-x-4 mt-1 sm:mt-0">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Met Target (≥ target %)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Below Target (&lt; target %)
          </span>
        </div>
      </div>
    </div>
  );
};

