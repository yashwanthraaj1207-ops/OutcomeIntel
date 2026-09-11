import React from 'react';
import { DataSufficiencyReport } from '../../types/dataTypes';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, HelpCircle } from 'lucide-react';

interface ReassessmentDataStatusProps {
  report: DataSufficiencyReport;
  reassessmentAssessmentId: string;
}

export const ReassessmentDataStatus: React.FC<ReassessmentDataStatusProps> = ({
  report,
  reassessmentAssessmentId
}) => {
  const getBadge = (available: boolean, partialLabel?: string) => {
    if (available) {
      return (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Available
        </span>
      );
    }
    if (partialLabel) {
      return (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> {partialLabel}
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
        <XCircle className="h-3 w-3" /> Missing
      </span>
    );
  };

  const statusColor =
    report.status === 'SUFFICIENT'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : report.status === 'PARTIAL'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-rose-50 text-rose-800 border-rose-200';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Reassessment Data Sufficiency & Integrity Verification
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 3
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic 5-point audit validating eligibility before computing learning gain metrics
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusColor}`}>
            Sufficiency: {report.status}
          </span>
        </div>
      </div>

      {/* 5-Point Verification Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Check 1: Approved Intervention */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between space-y-2">
          <span className="text-xs font-bold text-slate-700">1. Approved Intervention</span>
          <div className="flex items-center justify-between">
            {getBadge(report.hasApprovedIntervention)}
          </div>
        </div>

        {/* Check 2: Pre-Intervention Evidence */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between space-y-2">
          <span className="text-xs font-bold text-slate-700">2. Baseline Evidence</span>
          <div className="flex items-center justify-between">
            {getBadge(report.hasPreInterventionEvidence)}
          </div>
        </div>

        {/* Check 3: Post-Reassessment Data */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between space-y-2">
          <span className="text-xs font-bold text-slate-700">3. Reassessment [{reassessmentAssessmentId || 'N/A'}]</span>
          <div className="flex items-center justify-between">
            {getBadge(report.hasPostReassessmentEvidence)}
          </div>
        </div>

        {/* Check 4: Target Mapping */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between space-y-2">
          <span className="text-xs font-bold text-slate-700">4. Target Benchmark</span>
          <div className="flex items-center justify-between">
            {getBadge(report.hasTargetMapping, 'Default 70%')}
          </div>
        </div>

        {/* Check 5: Chronology Integrity */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between space-y-2">
          <span className="text-xs font-bold text-slate-700">5. Chronology Guard</span>
          <div className="flex items-center justify-between">
            {getBadge(report.isChronologicallyValid)}
          </div>
        </div>
      </div>

      {/* Missing Details / Warning Callout */}
      {report.missingDetails.length > 0 && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Pending Reassessment Requirements:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900">
              {report.missingDetails.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

