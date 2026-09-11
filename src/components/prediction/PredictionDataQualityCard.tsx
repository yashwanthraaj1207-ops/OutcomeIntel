import React from 'react';
import { Database, CheckCircle2, AlertCircle, ShieldCheck, XCircle } from 'lucide-react';

interface ExclusionReasonItem {
  reason: string;
  count: number;
  description: string;
}

interface PredictionDataQualityCardProps {
  totalCohortStudents: number;
  eligiblePredictionCases: number;
  excludedCasesCount: number;
  exclusionReasons: ExclusionReasonItem[];
  hasHistoricalData: boolean;
  targetConfigured: boolean;
  trainSampleCount: number;
  testSampleCount: number;
}

export const PredictionDataQualityCard: React.FC<PredictionDataQualityCardProps> = ({
  totalCohortStudents,
  eligiblePredictionCases,
  excludedCasesCount,
  exclusionReasons,
  hasHistoricalData,
  targetConfigured,
  trainSampleCount,
  testSampleCount
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Model Data Quality & Case Eligibility Audit
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Data Quality
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Pre-inference data validation auditing eligible prediction records, exclusion conditions, and training depth
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Zero Silent Exclusions
          </span>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] text-slate-500 block mb-0.5">Cohort Students</span>
          <span className="text-lg font-bold font-mono text-slate-800">
            {totalCohortStudents.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Enrolled student scope</span>
        </div>

        <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
          <span className="text-[11px] text-emerald-800 block mb-0.5">Eligible Prediction Cases</span>
          <span className="text-lg font-bold font-mono text-emerald-900">
            {eligiblePredictionCases.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Complete historical inputs</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] text-slate-500 block mb-0.5">Excluded Cases</span>
          <span className="text-lg font-bold font-mono text-slate-800">
            {excludedCasesCount}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {excludedCasesCount === 0 ? 'Zero records excluded' : 'Explained below'}
          </span>
        </div>

        <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg">
          <span className="text-[11px] text-indigo-800 block mb-0.5">Model Training Dataset</span>
          <span className="text-lg font-bold font-mono text-indigo-900">
            {trainSampleCount} train / {testSampleCount} test
          </span>
          <span className="text-[10px] text-indigo-600 block mt-0.5">Student-separated samples</span>
        </div>
      </div>

      {/* Conditions Checklist & Exclusions Table */}
      <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Quality Conditions Checklist */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
          <h4 className="text-xs font-bold text-slate-800 mb-2">
            Data Quality Invariants
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
              <span className="text-slate-600">Preceding Historical Assessment Exists</span>
              {hasHistoricalData ? (
                <span className="flex items-center text-emerald-700 font-semibold gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Satisfied
                </span>
              ) : (
                <span className="flex items-center text-rose-600 font-semibold gap-1">
                  <XCircle className="h-3.5 w-3.5" /> Insufficient History
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
              <span className="text-slate-600">Course Outcome Target Configured</span>
              {targetConfigured ? (
                <span className="flex items-center text-emerald-700 font-semibold gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Configured
                </span>
              ) : (
                <span className="flex items-center text-amber-600 font-semibold gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Target Missing
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
              <span className="text-slate-600">Training Samples Threshold (N ≥ 30)</span>
              {trainSampleCount >= 30 ? (
                <span className="flex items-center text-emerald-700 font-semibold gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {trainSampleCount} Samples (Adequate)
                </span>
              ) : (
                <span className="flex items-center text-amber-600 font-semibold gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Limited Samples ({trainSampleCount})
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">Test Evaluation Samples (N ≥ 10)</span>
              {testSampleCount >= 10 ? (
                <span className="flex items-center text-emerald-700 font-semibold gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {testSampleCount} Samples (Adequate)
                </span>
              ) : (
                <span className="flex items-center text-amber-600 font-semibold gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Limited Test Samples
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Exclusions Breakdown */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
          <h4 className="text-xs font-bold text-slate-800 mb-2">
            Exclusions Breakdown
          </h4>

          {exclusionReasons.length === 0 ? (
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
              <strong className="block mb-0.5 font-semibold">100% Case Eligibility:</strong>
              All {totalCohortStudents} students in this cohort have verified preceding historical assessment observations and configured target mappings. No records were excluded.
            </div>
          ) : (
            <div className="space-y-2">
              {exclusionReasons.map(item => (
                <div
                  key={item.reason}
                  className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs"
                >
                  <div className="flex justify-between font-semibold text-amber-900 mb-0.5">
                    <span>{item.reason}</span>
                    <span className="font-mono">{item.count} cases</span>
                  </div>
                  <p className="text-[11px] text-amber-800/90">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

