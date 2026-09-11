import React, { useState } from 'react';
import { Table, Eye, User, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { StandardizedAssessmentRecord } from '../types/dataTypes';

interface DataPreviewTableProps {
  records: StandardizedAssessmentRecord[];
  totalRecordsCount: number;
  selectedCourse: string;
  uniqueStudentsCount: number;
  uniqueAssessmentsCount: number;
  uniqueQuestionsCount: number;
  uniqueTopicsCount: number;
  uniqueCOsCount: number;
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  records,
  totalRecordsCount,
  selectedCourse,
  uniqueStudentsCount,
  uniqueAssessmentsCount,
  uniqueQuestionsCount,
  uniqueTopicsCount,
  uniqueCOsCount
}) => {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const totalPages = Math.ceil(records.length / pageSize);

  const displayRows = records.slice(page * pageSize, (page + 1) * pageSize);

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <Table className="h-10 w-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No Assessment Data Loaded</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Upload an assessment CSV or click "Load Sample Dataset" above to inspect question-level records.
        </p>
      </div>
    );
  }

  const isFiltered = selectedCourse !== 'ALL';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all">
      {/* Header & Badges */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md">
              <Eye className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              SECTION 4 — ASSESSMENT DATA PREVIEW
            </h2>
            {isFiltered && (
              <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-200 uppercase">
                {selectedCourse} Filter Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing records {page * pageSize + 1}–{Math.min((page + 1) * pageSize, records.length)} of{' '}
            <span className="font-semibold text-slate-800">{records.length.toLocaleString()}</span> entries
            {isFiltered && ` (Filtered from ${totalRecordsCount.toLocaleString()} total uploaded)`} • Anonymized
          </p>
        </div>

        {/* Quick Dimensional Counters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
            <User className="h-3 w-3 mr-1" />
            {uniqueStudentsCount} Students
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
            <FileText className="h-3 w-3 mr-1" />
            {uniqueAssessmentsCount} Assessments
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            {uniqueQuestionsCount} Questions
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-cyan-50 text-cyan-700 border border-cyan-200/60">
            {uniqueTopicsCount} Topics
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            {uniqueCOsCount} COs
          </span>
        </div>
      </div>

      {/* Horizontally Scrollable Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-3.5 py-2.5 text-center text-slate-400">#</th>
              <th scope="col" className="px-3.5 py-2.5">Student ID</th>
              <th scope="col" className="px-3.5 py-2.5">Course</th>
              <th scope="col" className="px-3.5 py-2.5 text-center">Sem</th>
              <th scope="col" className="px-3.5 py-2.5">Assessment</th>
              <th scope="col" className="px-3.5 py-2.5">Type</th>
              <th scope="col" className="px-3.5 py-2.5">Date</th>
              <th scope="col" className="px-3.5 py-2.5 font-semibold">Q. ID</th>
              <th scope="col" className="px-3.5 py-2.5">Curricular Topic</th>
              <th scope="col" className="px-3.5 py-2.5 text-center">CO</th>
              <th scope="col" className="px-3.5 py-2.5 text-right">Marks</th>
              <th scope="col" className="px-3.5 py-2.5 text-right">Attendance</th>
              <th scope="col" className="px-3.5 py-2.5 text-right">Assignment</th>
              <th scope="col" className="px-3.5 py-2.5 text-right">Lab Score</th>
              <th scope="col" className="px-3.5 py-2.5 text-center">Cohort</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {displayRows.map((row) => (
              <tr key={`${row.student_id}-${row.assessment_id}-${row.question_id}-${row.rowNumber}`} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-3.5 py-2 text-center text-slate-400 font-mono text-[11px]">{row.rowNumber}</td>
                <td className="px-3.5 py-2 font-mono font-medium text-slate-900 whitespace-nowrap">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{row.student_id}</span>
                </td>
                <td className="px-3.5 py-2 font-mono text-slate-700 whitespace-nowrap">
                  <span className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
                    row.course_id === 'CS301' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {row.course_id}
                  </span>
                </td>
                <td className="px-3.5 py-2 text-slate-600 text-center">{row.semester}</td>
                <td className="px-3.5 py-2 font-mono text-slate-700 whitespace-nowrap">{row.assessment_id}</td>
                <td className="px-3.5 py-2 text-slate-600 whitespace-nowrap">{row.assessment_type}</td>
                <td className="px-3.5 py-2 font-mono text-slate-500 whitespace-nowrap">{row.assessment_date}</td>
                <td className="px-3.5 py-2 font-mono font-semibold text-indigo-700 whitespace-nowrap">{row.question_id}</td>
                <td className="px-3.5 py-2 text-slate-800 whitespace-nowrap font-medium">{row.topic}</td>
                <td className="px-3.5 py-2 text-center whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {row.co_id}
                  </span>
                </td>
                <td className="px-3.5 py-2 text-right whitespace-nowrap font-mono font-medium">
                  <span className={row.marks_obtained < row.max_marks * 0.5 ? 'text-amber-600 font-bold' : 'text-slate-900'}>
                    {row.marks_obtained}
                  </span>
                  <span className="text-slate-400">/{row.max_marks}</span>
                </td>
                <td className="px-3.5 py-2 text-right font-mono text-slate-600 whitespace-nowrap">
                  {row.attendance_percentage !== undefined ? `${row.attendance_percentage}%` : '—'}
                </td>
                <td className="px-3.5 py-2 text-right font-mono text-slate-600 whitespace-nowrap">
                  {row.assignment_score !== undefined ? `${row.assignment_score}%` : '—'}
                </td>
                <td className="px-3.5 py-2 text-right font-mono text-slate-600 whitespace-nowrap">
                  {row.lab_score !== undefined ? `${row.lab_score}%` : '—'}
                </td>
                <td className="px-3.5 py-2 text-center font-mono text-slate-500 text-[11px] whitespace-nowrap">
                  {row.cohort || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
        <span className="text-slate-500">
          Page {page + 1} of {totalPages || 1}
        </span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="inline-flex items-center px-2.5 py-1 border border-slate-300 rounded text-slate-600 hover:bg-white disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Prev 10
          </button>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex items-center px-2.5 py-1 border border-slate-300 rounded text-slate-600 hover:bg-white disabled:opacity-40"
          >
            Next 10 <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
