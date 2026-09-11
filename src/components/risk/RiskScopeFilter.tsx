import React from 'react';
import {
  Filter,
  Calendar,
  BookOpen,
  Target,
  Clock,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import {
  RiskScopeFilters,
  ChronologicalAssessmentInfo
} from '../../types/dataTypes';

interface RiskScopeFilterProps {
  filters: RiskScopeFilters;
  onFilterChange: (filters: RiskScopeFilters) => void;
  availableCourses: string[];
  availableSemesters: string[];
  availableCOs: string[];
  chronologicalAssessments: ChronologicalAssessmentInfo[];
  targetThreshold: number | null;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  insufficientCount: number;
}

export const RiskScopeFilter: React.FC<RiskScopeFilterProps> = ({
  filters,
  onFilterChange,
  availableCourses,
  availableSemesters,
  availableCOs,
  chronologicalAssessments,
  targetThreshold,
  highCount,
  mediumCount,
  lowCount,
  insufficientCount
}) => {
  const handleChange = (key: keyof RiskScopeFilters, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Risk Scope & Multi-Signal Filter
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                Section 1
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Isolate academic risk cohort by course scope, assessment horizon, outcome, and triage priority
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

      {/* Scope Dropdowns Grid */}
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
            className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
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
            className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
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
            Assessment Target Horizon
          </label>
          <select
            value={filters.predictionAssessment}
            onChange={e => handleChange('predictionAssessment', e.target.value)}
            className="w-full text-xs py-2 px-3 border border-indigo-200 rounded-lg bg-indigo-50/40 text-indigo-900 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
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
            className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            {availableCOs.map(co => (
              <option key={co} value={co}>{co}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Risk Category Pills */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 text-xs text-slate-500">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span>Triage Filter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleChange('riskFilter', 'ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filters.riskFilter === 'ALL'
                ? 'bg-slate-800 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Students
          </button>

          <button
            type="button"
            onClick={() => handleChange('riskFilter', 'HIGH')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
              filters.riskFilter === 'HIGH'
                ? 'bg-rose-600 text-white font-semibold shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span>High Risk</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900">
              {highCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleChange('riskFilter', 'MEDIUM')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
              filters.riskFilter === 'MEDIUM'
                ? 'bg-amber-600 text-white font-semibold shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>Medium Risk</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900">
              {mediumCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleChange('riskFilter', 'LOW')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
              filters.riskFilter === 'LOW'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span>Low Risk</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900">
              {lowCount}
            </span>
          </button>

          {insufficientCount > 0 && (
            <button
              type="button"
              onClick={() => handleChange('riskFilter', 'INSUFFICIENT')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                filters.riskFilter === 'INSUFFICIENT'
                  ? 'bg-slate-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <span>Insufficient Data</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800">
                {insufficientCount}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

