import React from 'react';
import { Layers, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { COEvidenceData } from '../../types/dataTypes';

interface COEvidenceCardProps {
  coEvidence: COEvidenceData;
  predictionAssessment: string;
}

export const COEvidenceCard: React.FC<COEvidenceCardProps> = ({ coEvidence, predictionAssessment }) => {
  const isTargetMet = coEvidence.attainmentGap !== null && coEvidence.attainmentGap >= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Course Outcome Evidence Deep-Dive: <span className="font-mono text-indigo-700">{coEvidence.coId}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 4
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Aggregated historical attainment, institutional target deficit, and assessment-by-assessment progression
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {coEvidence.configuredTarget !== null ? (
            isTargetMet ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Historical Attainment On Target
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                Historical Attainment Below Target
              </span>
            )
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              Target reference unavailable
            </span>
          )}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-semibold block mb-1">CO Attainment</span>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {coEvidence.historicalAttainment !== null ? `${coEvidence.historicalAttainment.toFixed(1)}%` : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-500">Historical weighted mean</span>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Target Benchmark</span>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {coEvidence.configuredTarget !== null ? `${coEvidence.configuredTarget.toFixed(1)}%` : 'Unavailable'}
          </div>
          <span className="text-[11px] text-slate-500">
            {coEvidence.configuredTarget !== null ? 'Institutional threshold' : 'Fallback rule: 70%'}
          </span>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Attainment Gap</span>
          <div className={`text-2xl font-bold font-mono ${
            coEvidence.attainmentGap === null
              ? 'text-slate-500'
              : coEvidence.attainmentGap < 0
              ? 'text-rose-600'
              : 'text-emerald-600'
          }`}>
            {coEvidence.attainmentGap !== null ? (
              `${coEvidence.attainmentGap > 0 ? '+' : ''}${coEvidence.attainmentGap.toFixed(1)}%`
            ) : (
              'N/A'
            )}
          </div>
          <span className="text-[11px] text-slate-500">Attainment - Target</span>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Observation Breadth</span>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {coEvidence.observationCount}
          </div>
          <span className="text-[11px] text-slate-500">
            {coEvidence.questionCount} Qs across {coEvidence.topicCount} topics
          </span>
        </div>
      </div>

      {/* Historical Assessment Milestone Breakdown */}
      <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-indigo-500" />
            Historical Milestone Progression for {coEvidence.coId}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Excluded from evidence: [{predictionAssessment}] (Target Horizon)
          </span>
        </div>

        {coEvidence.progression.length === 0 ? (
          <div className="text-xs text-amber-800 p-3 bg-amber-50 rounded border border-amber-200">
            No historical assessment records exist prior to {predictionAssessment}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {coEvidence.progression.map((p) => {
              const pass = coEvidence.configuredTarget !== null
                ? p.attainmentPct >= coEvidence.configuredTarget
                : p.attainmentPct >= 70;
              return (
                <div
                  key={p.assessmentId}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    pass
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/70 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="font-mono">Assessment {p.assessmentId}</span>
                    <span className="font-mono">{p.attainmentPct.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] opacity-80">
                    <span>Marks: {p.marksObtained} / {p.maxMarks}</span>
                    <span>{pass ? 'Target Met' : 'Below Target'}</span>
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pass ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, p.attainmentPct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
