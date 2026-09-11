import React from 'react';
import { FullCOIntelligenceReport } from '../../types/dataTypes';
import { GitCommit, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

interface EvidenceTraceabilityPanelProps {
  stages: FullCOIntelligenceReport['traceabilityStages'];
}

export const EvidenceTraceabilityPanel: React.FC<EvidenceTraceabilityPanelProps> = ({ stages }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <GitCommit className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              End-to-End Evidence Traceability & Audit Verification Chain
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 8
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Complete 8-stage institutional audit pipeline verifying data provenance, predictive calibration, faculty decisions, and closed-loop gain evaluation.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Full Pipeline Provenance</span>
        </div>
      </div>

      {/* 8-Stage Horizontal/Grid Chain */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stages.map(stage => {
          const isComplete = stage.status === 'COMPLETE';

          return (
            <div
              key={stage.stageNumber}
              className={`p-3.5 rounded-xl border relative transition ${
                isComplete
                  ? 'border-slate-200 bg-slate-50/70 hover:bg-white'
                  : 'border-amber-200 bg-amber-50/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">
                  Stage {stage.stageNumber} of 8
                </span>

                {isComplete ? (
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                    VERIFIED
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                    <Clock className="h-3 w-3 mr-1 text-amber-600" />
                    PENDING
                  </span>
                )}
              </div>

              <h3 className="font-bold text-slate-900 text-xs tracking-tight mb-1">
                {stage.stageName}
              </h3>

              <div className="text-[11px] text-indigo-700 font-medium mb-2 font-mono">
                {stage.sourceModule}
              </div>

              <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80 font-mono text-[11px]">
                {stage.summaryMetric}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

