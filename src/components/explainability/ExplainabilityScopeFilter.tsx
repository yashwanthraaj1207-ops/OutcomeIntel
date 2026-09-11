import React from 'react';
import { Filter, Calendar, BookOpen, Layers, ShieldAlert, User, Clock, AlertTriangle } from 'lucide-react';
import { ExplainabilityScopeFilters, RiskLevel } from '../../types/dataTypes';

export interface FilterStudentOption {
  studentId: string;
  riskLevel: RiskLevel;
  priorityRank?: number;
}

interface ExplainabilityScopeFilterProps {
  filters: ExplainabilityScopeFilters;
  onChange: (updated: ExplainabilityScopeFilters) => void;
  availableCourses: string[];
  availableAssessments: string[];
  availableCOs: string[];
  availableStudents: FilterStudentOption[];
  historicalAssessments: string[];
  targetThreshold: number | null;
}

export const ExplainabilityScopeFilter: React.FC<ExplainabilityScopeFilterProps> = ({
  filters,
  onChange,
  availableCourses,
  availableAssessments,
  availableCOs,
  availableStudents,
  historicalAssessments,
  targetThreshold
}) => {
  const isBaseline = historicalAssessments.length === 0;

  // Filter pills counts
  const highCount = availableStudents.filter(s => s.riskLevel === 'HIGH RISK').length;
  const medCount = availableStudents.filter(s => s.riskLevel === 'MEDIUM RISK').length;
  const lowCount = availableStudents.filter(s => s.riskLevel === 'LOW RISK').length;

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
              Explainability & Diagnostic Scope Selector
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 1
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Select student case, target assessment horizon, and course outcome to investigate root-cause academic factors
            </p>
          </div>
        </div>

        {/* Target Badge */}
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

      {/* Main Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Course */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
            <span>Course</span>
          </label>
          <select
            value={filters.courseId}
            onChange={(e) => onChange({ ...filters, courseId: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            {availableCourses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Prediction Assessment Horizon */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
            <span>Target Assessment Horizon</span>
          </label>
          <select
            value={filters.predictionAssessment}
            onChange={(e) => onChange({ ...filters, predictionAssessment: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
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
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            {availableCOs.map(co => (
              <option key={co} value={co}>{co}</option>
            ))}
          </select>
        </div>

        {/* Risk Filter Quick Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-indigo-500" />
            <span>Filter Cohort by Risk</span>
          </label>
          <select
            value={filters.riskFilter}
            onChange={(e) => onChange({ ...filters, riskFilter: e.target.value as any })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="ALL">All Risk Categories ({availableStudents.length})</option>
            <option value="HIGH">High Risk ({highCount})</option>
            <option value="MEDIUM">Medium Risk ({medCount})</option>
            <option value="LOW">Low Risk ({lowCount})</option>
            <option value="INSUFFICIENT">Insufficient Data</option>
          </select>
        </div>

        {/* Student Selector - DYNAMICALLY POPULATED */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-indigo-500" />
            <span>Anonymized Student Case</span>
          </label>
          <select
            value={filters.studentId}
            onChange={(e) => onChange({ ...filters, studentId: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            {availableStudents.length === 0 ? (
              <option value="">No matching students</option>
            ) : (
              availableStudents.map(s => (
                <option key={s.studentId} value={s.studentId}>
                  {s.studentId} {s.priorityRank ? `(#${s.priorityRank})` : ''} - {s.riskLevel}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Historical Timeline Preview & Anti-Leakage Notice */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-600">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>Historical Assessments Admitted:</span>
          {historicalAssessments.length > 0 ? (
            <div className="flex items-center space-x-1.5">
              {historicalAssessments.map((a) => (
                <span
                  key={a}
                  className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[11px] font-semibold border border-indigo-200"
                >
                  {a}
                </span>
              ))}
              <span className="text-[11px] text-slate-400 font-mono">➔ Target [{filters.predictionAssessment}]</span>
            </div>
          ) : (
            <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              None (Baseline Cycle)
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-500">
          Strict anti-leakage: Target <strong className="font-mono text-slate-700">{filters.predictionAssessment}</strong> marks are strictly quarantined from explanation inputs.
        </span>
      </div>

      {/* Baseline Warning Banner */}
      {isBaseline && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2 text-amber-900 text-xs">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Baseline Cycle Selected:</strong> Assessment {filters.predictionAssessment} is the earliest chronological assessment milestone. No historical predecessor records exist to explain performance trends or topic root causes.
          </div>
        </div>
      )}
    </div>
  );
};

