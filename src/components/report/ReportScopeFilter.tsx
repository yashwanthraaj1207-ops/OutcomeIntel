import React from 'react';
import { ReportScopeFilters } from '../../types/dataTypes';
import { Filter, RotateCcw } from 'lucide-react';

interface ReportScopeFilterProps {
  filters: ReportScopeFilters;
  onChange: (updated: ReportScopeFilters) => void;
  availableCourses: string[];
  availableCOs: string[];
  onReset: () => void;
}

export const ReportScopeFilter: React.FC<ReportScopeFilterProps> = ({
  filters,
  onChange,
  availableCourses,
  availableCOs,
  onReset
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2 text-slate-800">
          <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-600">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Report Scope & Filter Configuration
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 1
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Customize multi-dimensional report views across courses, outcome benchmarks, risk categories, and reassessment statuses.
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 bg-slate-50 transition cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Course Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Course Scope
          </label>
          <select
            value={filters.courseId}
            onChange={e => onChange({ ...filters, courseId: e.target.value })}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Enrolled Courses</option>
            {availableCourses.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* CO Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Course Outcome (CO)
          </label>
          <select
            value={filters.coId}
            onChange={e => onChange({ ...filters, coId: e.target.value })}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Course Outcomes</option>
            {availableCOs.map(co => (
              <option key={co} value={co}>
                {co}
              </option>
            ))}
          </select>
        </div>

        {/* Risk Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Early-Warning Risk Level
          </label>
          <select
            value={filters.riskFilter}
            onChange={e => onChange({ ...filters, riskFilter: e.target.value as ReportScopeFilters['riskFilter'] })}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="HIGH">High Risk Only (&lt;40% / Trajectory Deficit)</option>
            <option value="MEDIUM">Medium Risk Only</option>
            <option value="LOW">Low Risk Only (&ge;70%)</option>
            <option value="INSUFFICIENT">Insufficient Data Only</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Intervention Priority
          </label>
          <select
            value={filters.priorityFilter}
            onChange={e => onChange({ ...filters, priorityFilter: e.target.value as ReportScopeFilters['priorityFilter'] })}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Urgency (Rank 1-5)</option>
            <option value="HIGH">High Priority</option>
            <option value="MODERATE">Moderate Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>

        {/* Reassessment Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reassessment Verification
          </label>
          <select
            value={filters.reassessmentStatus}
            onChange={e => onChange({ ...filters, reassessmentStatus: e.target.value as ReportScopeFilters['reassessmentStatus'] })}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Interventions</option>
            <option value="EVALUATED">Evaluated with Learning Gain</option>
            <option value="PENDING">Pending Post-Assessment</option>
          </select>
        </div>
      </div>
    </div>
  );
};

