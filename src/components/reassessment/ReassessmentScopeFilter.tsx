import React from 'react';
import { Filter, BookOpen, Calendar, Layers, User, Award, Database } from 'lucide-react';
import { InterventionRecord } from '../../types/dataTypes';

export interface ReassessmentFilterState {
  courseId: string;
  semester: string;
  coId: string;
  studentId: string;
  interventionId: string;
  reassessmentAssessmentId: string;
}

interface ReassessmentScopeFilterProps {
  filters: ReassessmentFilterState;
  onChange: (updated: ReassessmentFilterState) => void;
  availableCourses: string[];
  availableCOs: string[];
  approvedInterventions: InterventionRecord[];
  availableReassessments: Array<{ assessmentId: string; date: string }>;
  isSyntheticLoaded: boolean;
  onToggleSyntheticData: () => void;
}

export const ReassessmentScopeFilter: React.FC<ReassessmentScopeFilterProps> = ({
  filters,
  onChange,
  availableCourses,
  availableCOs,
  approvedInterventions,
  availableReassessments,
  isSyntheticLoaded,
  onToggleSyntheticData
}) => {
  // Extract distinct students who have at least one approved intervention
  const eligibleStudents = Array.from(
    new Set(approvedInterventions.map(i => i.studentId))
  ).sort();

  // Filter interventions for the currently selected student
  const studentInterventions = approvedInterventions.filter(
    i => (!filters.studentId || i.studentId === filters.studentId) &&
         (!filters.courseId || i.courseId === filters.courseId)
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Reassessment Evaluation Scope Selector
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 1
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Select an approved intervention case and the corresponding post-intervention reassessment
            </p>
          </div>
        </div>

        {/* Data Mode / Toggle Button */}
        <div className="flex items-center space-x-2">
          {isSyntheticLoaded ? (
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                <Database className="h-3.5 w-3.5 text-amber-600" />
                SYNTHETIC DEMONSTRATION DATA (R1)
              </span>
              <button
                onClick={onToggleSyntheticData}
                className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 cursor-pointer font-medium"
              >
                Unload Demo
              </button>
            </div>
          ) : (
            <button
              onClick={onToggleSyntheticData}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Load Synthetic Demonstration Reassessment (R1)</span>
            </button>
          )}
        </div>
      </div>

      {/* Selectors Grid */}
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
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            {availableCourses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* CO */}
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

        {/* Student Case */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-indigo-500" />
            <span>Approved Student ({eligibleStudents.length})</span>
          </label>
          <select
            value={filters.studentId}
            onChange={(e) => onChange({ ...filters, studentId: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            {eligibleStudents.length === 0 ? (
              <option value="">No Approved Students</option>
            ) : (
              eligibleStudents.map(s => (
                <option key={s} value={s}>Student {s}</option>
              ))
            )}
          </select>
        </div>

        {/* Approved Intervention Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-indigo-500" />
            <span>Approved Strategy</span>
          </label>
          <select
            value={filters.interventionId}
            onChange={(e) => onChange({ ...filters, interventionId: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer truncate"
          >
            {studentInterventions.length === 0 ? (
              <option value="">No Intervention Found</option>
            ) : (
              studentInterventions.map(i => (
                <option key={i.interventionId} value={i.interventionId}>
                  {i.interventionType} ({i.topic})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Reassessment Assessment Horizon */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
            <span>Reassessment Cycle</span>
          </label>
          <select
            value={filters.reassessmentAssessmentId}
            onChange={(e) => onChange({ ...filters, reassessmentAssessmentId: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            {availableReassessments.length === 0 ? (
              <option value="">No Reassessments Available</option>
            ) : (
              availableReassessments.map(a => (
                <option key={a.assessmentId} value={a.assessmentId}>
                  {a.assessmentId} ({a.date || 'Undated'})
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    </div>
  );
};

