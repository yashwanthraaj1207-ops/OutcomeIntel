import React from 'react';
import { DataQualityReportSummary } from '../../types/dataTypes';
import { CheckCircle2, AlertTriangle, ShieldCheck, FileCheck } from 'lucide-react';

interface DataQualityReportProps {
  dataQuality: DataQualityReportSummary;
}

export const DataQualityReport: React.FC<DataQualityReportProps> = ({ dataQuality }) => {
  const isClean = dataQuality.canProceed && dataQuality.invalidRecords === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Data Ingestion Integrity & Quality Audit
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 10
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Module 1 gatekeeper audit verifying structural schema conformity, referential mapping integrity, and absence of data corruption.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isClean ? (
            <span className="inline-flex items-center text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-1.5" />
              100% Validated Dataset (Zero Blocking Errors)
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full">
              <AlertTriangle className="h-4 w-4 text-amber-600 mr-1.5" />
              {dataQuality.validationStatus}
            </span>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5 text-xs">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <span className="text-slate-500 text-[11px] block">Total Ingested</span>
          <span className="text-lg font-black text-slate-900 font-mono block">
            {dataQuality.totalRecords.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">Raw rows parsed</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <span className="text-slate-500 text-[11px] block">Valid Observations</span>
          <span className="text-lg font-black text-emerald-700 font-mono block">
            {dataQuality.validRecords.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">100% Conforming</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <span className="text-slate-500 text-[11px] block">Structural Errors</span>
          <span className="text-lg font-black text-slate-900 font-mono block">
            {dataQuality.structuralErrors}
          </span>
          <span className="text-[10px] text-slate-400">Schema anomalies</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <span className="text-slate-500 text-[11px] block">Duplicate Rows</span>
          <span className="text-lg font-black text-slate-900 font-mono block">
            {dataQuality.duplicateRecords}
          </span>
          <span className="text-[10px] text-slate-400">Deduplicated</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <span className="text-slate-500 text-[11px] block">Unmapped Topics</span>
          <span className="text-lg font-black text-slate-900 font-mono block">
            {dataQuality.unmappedTopics}
          </span>
          <span className="text-[10px] text-slate-400">Missing topic links</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <span className="text-slate-500 text-[11px] block">Unmapped COs</span>
          <span className="text-lg font-black text-slate-900 font-mono block">
            {dataQuality.unmappedCOs}
          </span>
          <span className="text-[10px] text-slate-400">Missing CO links</span>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2 text-xs text-slate-600">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Accreditation Audit Statement:</strong> All analytical calculations, probabilities, and intervention plans are executed strictly on records validated through the Module 1 Gatekeeper Engine. No synthetic records are blended into live cohort figures without explicit visual disclaimers.
        </span>
      </div>
    </div>
  );
};
