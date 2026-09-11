import React from 'react';
import { FileText, CheckSquare, Target, Compass, BookOpen } from 'lucide-react';
import { DiagnosisSummary } from '../../types/dataTypes';

interface DiagnosisSummaryCardProps {
  summary: DiagnosisSummary;
  studentId: string;
  coId: string;
}

export const DiagnosisSummaryCard: React.FC<DiagnosisSummaryCardProps> = ({ summary, studentId, coId }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Faculty Diagnostic Synthesis Summary
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 9
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic, template-derived academic diagnosis connecting Course Outcome, topic root causes, and assessment progression
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
          Case: {studentId} ({coId})
        </span>
      </div>

      {/* Synthesis Content Blocks */}
      <div className="space-y-4 text-xs">
        {/* Primary Diagnosis */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
          <div className="flex items-center space-x-1.5 text-indigo-900 font-bold text-xs uppercase tracking-wide">
            <Compass className="h-4 w-4 text-indigo-600" />
            <span>Primary Academic Diagnosis</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-relaxed">
            {summary.primaryDiagnosis}
          </p>
        </div>

        {/* Supporting Evidence Bullets */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs">
            <CheckSquare className="h-4 w-4 text-indigo-600" />
            <span>Measurable Supporting Evidence</span>
          </div>

          <ul className="space-y-1.5 text-slate-700 pl-1">
            {summary.supportingEvidence.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-indigo-500 font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Priority Area & Narrative Block */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
              <Target className="h-4 w-4 text-amber-700" />
              <span>Recommended Priority Topic</span>
            </div>
            <div className="text-base font-bold text-slate-900">
              {summary.priorityArea}
            </div>
            <p className="text-[11px] text-slate-600">
              Targeted focus area identified as the primary contributor to outcome deficit
            </p>
          </div>

          <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <span>Diagnostic Narrative</span>
            </div>
            <p className="text-slate-700 leading-relaxed italic text-[11px]">
              "{summary.narrativeSummary}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

