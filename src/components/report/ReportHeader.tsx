import React from 'react';
import { CourseMetadata } from '../../types/dataTypes';
import { ShieldCheck, Database, Calendar, Building, FileText, CheckCircle2 } from 'lucide-react';

interface ReportHeaderProps {
  courseMeta: CourseMetadata;
  generatedAt: string;
  reportId: string;
  isSyntheticData: boolean;
  totalStudentsCount: number;
  totalRecordsCount: number;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  courseMeta,
  generatedAt,
  reportId,
  isSyntheticData,
  totalStudentsCount,
  totalRecordsCount
}) => {
  const formattedDate = new Date(generatedAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 p-6 space-y-5">
      {/* Top Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Module 8: Decision Support & Executive Reporting
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ID: {reportId}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-400" />
            Course Outcome Intelligence & Continuous Improvement Report
          </h1>
          <p className="text-xs text-slate-300">
            Comprehensive longitudinal decision-support summary integrating assessment analytics, predictive early-warnings, faculty-approved interventions, and verified post-intervention learning gains.
          </p>
        </div>

        {/* Live vs Synthetic Data Indicator Badge */}
        <div className="shrink-0 flex flex-col items-start sm:items-end space-y-1.5">
          {isSyntheticData ? (
            <div className="inline-flex items-center space-x-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-bold">
              <Database className="h-4 w-4 text-amber-400" />
              <span>SYNTHETIC DEMONSTRATION DATA (R1)</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>LIVE INGESTED DATA</span>
            </div>
          )}
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <Calendar className="h-3.5 w-3.5 text-slate-500" /> Generated: {formattedDate}
          </span>
        </div>
      </div>

      {/* Course Context Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3">
          <span className="text-slate-400 block text-[11px]">Academic Course</span>
          <span className="font-bold text-white text-sm font-mono">{courseMeta.courseId}</span>
          <span className="text-slate-400 block truncate">{courseMeta.courseName}</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3">
          <span className="text-slate-400 block text-[11px]">Semester & Cohort</span>
          <span className="font-bold text-white text-sm">Semester {courseMeta.semester}</span>
          <span className="text-slate-400 block truncate">{courseMeta.section}</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3">
          <span className="text-slate-400 block text-[11px]">Audited Student Population</span>
          <span className="font-bold text-indigo-300 text-sm font-mono">{totalStudentsCount} Students</span>
          <span className="text-slate-400 block truncate">100% Anonymized IDs (FERPA)</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3">
          <span className="text-slate-400 block text-[11px]">Standardized Observations</span>
          <span className="font-bold text-emerald-400 text-sm font-mono">{totalRecordsCount.toLocaleString()} Records</span>
          <span className="text-slate-400 block truncate">Zero Unvalidated Rows</span>
        </div>
      </div>

      {/* Academic Privacy & Non-Causality Banner */}
      <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white">Academic Privacy & FERPA Compliance:</strong> Student identities are anonymized (e.g., S001–S150). No personally identifiable information (PII) is stored or exported.
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-indigo-300 shrink-0 text-[11px]">
          <Building className="h-3.5 w-3.5 text-indigo-400" />
          <span>Accreditation Audit Support Layer</span>
        </div>
      </div>
    </div>
  );
};

