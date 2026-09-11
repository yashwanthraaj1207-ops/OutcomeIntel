import React from 'react';
import {
  Filter,
  Calendar,
  BookOpen,
  Target,
  AlertTriangle,
  History,
  Clock
} from 'lucide-react';
import {
  PredictionScopeFilters,
  ChronologicalAssessmentInfo
} from '../../types/dataTypes';

interface PredictionScopeFilterProps {
  filters: PredictionScopeFilters;
  onFilterChange: (filters: PredictionScopeFilters) => void;
  availableCourses: string[];
  availableSemesters: string[];
  availableCOs: string[];
  chronologicalAssessments: ChronologicalAssessmentInfo[];
  historicalAssessments: string[];
  targetThreshold: number | null;
}

export const PredictionScopeFilter: React.FC<PredictionScopeFilterProps> = ({
  filters,
  onFilterChange,
  availableCourses,
  availableSemesters,
  availableCOs,
  chronologicalAssessments,
  historicalAssessments,
  targetThreshold
}) => {
  const isEarliestAssessment = historicalAssessments.length === 0;

  const handleChange = (key: keyof PredictionScopeFilters, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Prediction Scope & Horizon Selector
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 1
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Select temporal cutoff point to evaluate future Course Outcome attainment probability
            </p>
          </div>
        </div>

        {targetThreshold !== null ? (
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium">
            <Target className="h-3.5 w-3.5 text-emerald-600" />
            <span>Target Threshold:</span>
            <strong className="font-mono">{targetThreshold.toFixed(1)}%</strong>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Target Not Configured</span>
          </div>
        )}
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Course */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
            Course
          </label>
          <select
            value={filters.courseId}
            onChange={e => handleChange('courseId', e.target.value)}
            className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {availableCourses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Semester */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Semester
          </label>
          <select
            value={filters.semester}
            onChange={e => handleChange('semester', e.target.value)}
            className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {availableSemesters.map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        {/* Prediction Target Assessment */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-indigo-500" />
            Prediction Assessment Target
          </label>
          <select
            value={filters.predictionAssessment}
            onChange={e => handleChange('predictionAssessment', e.target.value)}
            className="w-full text-xs py-2 px-3 border border-indigo-200 rounded-lg bg-indigo-50/40 text-indigo-900 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {chronologicalAssessments.map(a => (
              <option key={a.assessmentId} value={a.assessmentId}>
                {a.assessmentId} ({a.date})
              </option>
            ))}
          </select>
        </div>

        {/* Target CO */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
            <Target className="h-3.5 w-3.5 text-slate-400" />
            Course Outcome (CO)
          </label>
          <select
            value={filters.coId}
            onChange={e => handleChange('coId', e.target.value)}
            className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {availableCOs.map(co => (
              <option key={co} value={co}>{co}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chronological Timeline & Historical Evidence Bar */}
      <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <History className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <span className="text-slate-500">Historical Assessments in Window:</span>
          {historicalAssessments.length > 0 ? (
            <div className="flex items-center space-x-1 font-mono">
              {historicalAssessments.map(a => (
                <span
                  key={a}
                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200"
                >
                  {a}
                </span>
              ))}
              <span className="text-slate-400 px-1">➔</span>
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                Predict {filters.predictionAssessment}
              </span>
            </div>
          ) : (
            <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              None (Baseline Cycle)
            </span>
          )}
        </div>

        <div className="text-slate-400 text-[11px]">
          Chronological sequence derived from assessment dates in dataset
        </div>
      </div>

      {/* Warning banner if earliest assessment selected */}
      {isEarliestAssessment && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start space-x-2.5 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Insufficient historical data for prediction</span>
            Assessment <code className="bg-amber-100 px-1 rounded">{filters.predictionAssessment}</code> is the earliest chronological assessment cycle in this course. At least one preceding assessment is required to construct historical performance features without data leakage. Please select a subsequent assessment (such as <code className="bg-amber-100 px-1 rounded">A2</code> or <code className="bg-amber-100 px-1 rounded">A3</code>).
          </div>
        </div>
      )}
    </div>
  );
};
