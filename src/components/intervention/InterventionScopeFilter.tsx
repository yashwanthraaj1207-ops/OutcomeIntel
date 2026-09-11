import React from 'react';
import { Filter, Calendar, BookOpen, Layers, ShieldAlert, User, Flame } from 'lucide-react';
import { InterventionScopeFilters, RiskLevel, InterventionPriority } from '../../types/dataTypes';

export interface InterventionStudentOption {
  studentId: string;
  riskLevel: RiskLevel;
  priority: InterventionPriority;
  priorityRank?: number;
}

interface InterventionScopeFilterProps {
  filters: InterventionScopeFilters;
  onChange: (updated: InterventionScopeFilters) => void;
  availableCourses: string[];
  availableAssessments: string[];
  availableCOs: string[];
  availableStudents: InterventionStudentOption[];
  targetThreshold: number | null;
}

export const InterventionScopeFilter: React.FC<InterventionScopeFilterProps> = ({
  filters,
  onChange,
  availableCourses,
  availableAssessments,
  availableCOs,
  availableStudents,
  targetThreshold
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Intervention Planning Scope Selector
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 1
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Filter by course, prediction horizon, risk severity, and intervention priority to prescribe targeted pedagogical actions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {targetThreshold !== null ? (
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              CO Target: <strong className="font-mono">{targetThreshold}%</strong>
            </span>
          ) : (
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              Target reference unavailable
            </span>
          )}
        </div>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Course */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
            <span>Course</span>
          </label>
          <select
            value={filters.courseId}
            onChange={(e) => onChange({ ...filters, courseId: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            {availableCourses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Prediction Assessment */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
            <span>Horizon</span>
          </label>
          <select
            value={filters.predictionAssessment}
            onChange={(e) => onChange({ ...filters, predictionAssessment: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            {availableAssessments.map(a => (
              <option key={a} value={a}>Assessment {a}</option>
            ))}
          </select>
        </div>

        {/* Course Outcome */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
            <span>Course Outcome</span>
          </label>
          <select
            value={filters.coId}
            onChange={(e) => onChange({ ...filters, coId: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            {availableCOs.map(co => (
              <option key={co} value={co}>{co}</option>
            ))}
          </select>
        </div>

        {/* Risk Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-indigo-500" />
            <span>Risk Filter</span>
          </label>
          <select
            value={filters.riskFilter}
            onChange={(e) => onChange({ ...filters, riskFilter: e.target.value as any })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
            <option value="INSUFFICIENT">Insufficient Data</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-rose-500" />
            <span>Intervention Priority</span>
          </label>
          <select
            value={filters.priorityFilter}
            onChange={(e) => onChange({ ...filters, priorityFilter: e.target.value as any })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MODERATE">Moderate Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>

        {/* Dynamic Student Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-indigo-500" />
            <span>Student Case ({availableStudents.length})</span>
          </label>
          <select
            value={filters.studentId}
            onChange={(e) => onChange({ ...filters, studentId: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            {availableStudents.length === 0 ? (
              <option value="">No matching students</option>
            ) : (
              availableStudents.map(s => (
                <option key={s.studentId} value={s.studentId}>
                  {s.studentId} - [{s.priority}] - {s.riskLevel}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    </div>
  );
};

