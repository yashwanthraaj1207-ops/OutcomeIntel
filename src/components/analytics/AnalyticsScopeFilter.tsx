import React from 'react';
import { Filter, RotateCcw, BookOpen, Calendar, FileText, Target } from 'lucide-react';
import { AnalyticsFilters } from '../../types/dataTypes';

interface AnalyticsScopeFilterProps {
  filters: AnalyticsFilters;
  onFilterChange: (filters: AnalyticsFilters) => void;
  onResetFilters: () => void;
  availableOptions: {
    courses: string[];
    semesters: string[];
    assessments: string[];
    cos: string[];
  };
  totalObservationsCount: number;
  filteredObservationsCount: number;
}

export const AnalyticsScopeFilter: React.FC<AnalyticsScopeFilterProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableOptions,
  totalObservationsCount,
  filteredObservationsCount
}) => {
  const isAnyFilterActive =
    filters.courseId !== 'ALL' ||
    filters.semester !== 'ALL' ||
    filters.assessmentId !== 'ALL' ||
    filters.coId !== 'ALL';

  const handleChange = (key: keyof AnalyticsFilters, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              SECTION 1 — ANALYTICS SCOPE & FILTERS
            </h2>
            <p className="text-xs text-slate-500">
              Filter assessment evidence across curriculum dimensions. Downstream analytics dynamically recalculate.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition font-medium cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
          <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-md font-semibold">
            {filteredObservationsCount.toLocaleString()} of {totalObservationsCount.toLocaleString()} observations
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Course Filter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center">
            <BookOpen className="h-3.5 w-3.5 mr-1 text-slate-400" />
            Course Code
          </label>
          <select
            value={filters.courseId}
            onChange={e => handleChange('courseId', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-indigo-500 focus:border-indigo-500 font-medium"
          >
            <option value="ALL">All Courses ({availableOptions.courses.join(', ')})</option>
            {availableOptions.courses.map(c => (
              <option key={c} value={c}>
                {c} {c === 'CS301' ? '(Operating Systems)' : c === 'CS302' ? '(Database Systems)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Semester Filter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
            Semester
          </label>
          <select
            value={filters.semester}
            onChange={e => handleChange('semester', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-indigo-500 focus:border-indigo-500 font-medium"
          >
            <option value="ALL">All Semesters</option>
            {availableOptions.semesters.map(s => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>

        {/* Assessment Filter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center">
            <FileText className="h-3.5 w-3.5 mr-1 text-slate-400" />
            Assessment Cycle
          </label>
          <select
            value={filters.assessmentId}
            onChange={e => handleChange('assessmentId', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-indigo-500 focus:border-indigo-500 font-medium font-mono"
          >
            <option value="ALL">All Assessments ({availableOptions.assessments.join(', ')})</option>
            {availableOptions.assessments.map(a => (
              <option key={a} value={a}>
                {a} {a === 'A1' || a === 'B1' ? '(Internal 1)' : a === 'A2' || a === 'B2' ? '(Internal 2)' : a === 'A3' ? '(Model Exam)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* CO Filter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center">
            <Target className="h-3.5 w-3.5 mr-1 text-slate-400" />
            Course Outcome
          </label>
          <select
            value={filters.coId}
            onChange={e => handleChange('coId', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-indigo-500 focus:border-indigo-500 font-medium font-mono"
          >
            <option value="ALL">All Course Outcomes ({availableOptions.cos.join(', ')})</option>
            {availableOptions.cos.map(co => (
              <option key={co} value={co}>
                {co}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Tags */}
      {isAnyFilterActive && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
          <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Active Filter Scope:</span>
          {filters.courseId !== 'ALL' && (
            <span className="inline-flex items-center bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-semibold font-mono">
              Course: {filters.courseId}
            </span>
          )}
          {filters.semester !== 'ALL' && (
            <span className="inline-flex items-center bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-semibold font-mono">
              Sem: {filters.semester}
            </span>
          )}
          {filters.assessmentId !== 'ALL' && (
            <span className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold font-mono">
              Assessment: {filters.assessmentId}
            </span>
          )}
          {filters.coId !== 'ALL' && (
            <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold font-mono">
              CO: {filters.coId}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
