import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Database,
  Info
} from 'lucide-react';
import { StandardizedAssessmentRecord, DatasetStats, CourseMetadata } from '../types/dataTypes';

interface Module2PlaceholderProps {
  records: StandardizedAssessmentRecord[];
  stats: DatasetStats;
  courseMeta: CourseMetadata;
  onBack: () => void;
}

export const Module2Placeholder: React.FC<Module2PlaceholderProps> = ({
  records,
  stats,
  courseMeta,
  onBack
}) => {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Return to Module 1 (Data Ingestion & Validation)</span>
      </button>

      {/* Main Landing Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Handover Gatekeeper Passed
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              CO Analytics — Module 2
            </h1>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          The faculty assessment dataset, question taxonomies, and course outcome targets have completed structural and cross-file relational validation. The standardized internal dataset is ready for downstream analytical processing.
        </p>

        {/* Notice on Module 2 boundary */}
        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3">
          <Info className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-0.5">Strict Prototype Milestone Boundary</span>
            In accordance with prototype development guidelines, <span className="font-semibold">Module 2 (CO Analytics)</span> is scheduled for the next implementation phase. No simulated charts, fabricated predictions, or dummy performance metrics are rendered.
          </div>
        </div>
      </div>

      {/* Standardized Dataset Summary Handover Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-2 pb-4 mb-5 border-b border-slate-100">
          <Database className="h-5 w-5 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Validated Handover Payload Summary
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Selected Course</span>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
              {courseMeta.courseId}
            </p>
            <span className="text-[11px] text-slate-400">{courseMeta.courseName || 'Operating Systems'}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Validated Observations</span>
            <p className="text-lg font-bold text-emerald-600 mt-1 font-mono">
              {records.length.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-400">100% Schema Valid</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Anonymized Candidates</span>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
              {stats.uniqueStudents}
            </p>
            <span className="text-[11px] text-slate-400">Cohort: {stats.cohort}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Target Course Outcomes</span>
            <p className="text-lg font-bold text-indigo-600 mt-1 font-mono">
              {stats.uniqueCOs.join(', ')}
            </p>
            <span className="text-[11px] text-slate-400">{stats.uniqueCOs.length} Outcomes Ready</span>
          </div>
        </div>

        {/* Future Modules Pipeline Indicator */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
            Subsequent Module Pipeline
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold text-indigo-900">Module 1: Data Input & Validation</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center space-x-2 text-slate-500">
              <Lock className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span>Module 2: CO Analytics</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center space-x-2 text-slate-500">
              <Lock className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span>Module 3: Conditional Prediction</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center space-x-2 text-slate-500">
              <Lock className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span>Module 4: Risk Detection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
