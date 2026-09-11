import React from 'react';
import { StudentLearningProfile } from '../../types/dataTypes';
import { GitCommit, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

interface ReassessmentEvidencePanelProps {
  profile: StudentLearningProfile;
}

export const ReassessmentEvidencePanel: React.FC<ReassessmentEvidencePanelProps> = ({ profile }) => {
  const { intervention, learningGains, effectiveness, targetThreshold } = profile;

  const preStr = learningGains.preAttainment !== null ? `${learningGains.preAttainment.toFixed(1)}%` : 'Pending';
  const postStr = learningGains.postAttainment !== null ? `${learningGains.postAttainment.toFixed(1)}%` : 'Pending';
  const gainStr =
    learningGains.absoluteGain !== null
      ? `${learningGains.absoluteGain >= 0 ? '+' : ''}${learningGains.absoluteGain.toFixed(1)} pp`
      : 'Pending';

  const chainNodes = [
    {
      stage: '1. Approved Intervention',
      label: intervention.interventionType,
      detail: `Topic: ${intervention.topic} (${intervention.priority} Priority)`,
      severity: 'indigo'
    },
    {
      stage: '2. Baseline Evidence',
      label: 'Pre-Intervention Score',
      detail: `${preStr} Attainment`,
      severity: 'slate'
    },
    {
      stage: '3. Reassessment Cycle',
      label: profile.reassessmentAssessmentId || 'Cycle R1',
      detail: `${postStr} Attainment`,
      severity: 'indigo'
    },
    {
      stage: '4. Observed Change',
      label: 'Absolute Learning Gain',
      detail: gainStr,
      severity: learningGains.absoluteGain !== null && learningGains.absoluteGain > 0 ? 'emerald' : 'rose'
    },
    {
      stage: '5. Institutional Status',
      label: effectiveness,
      detail: targetThreshold !== null ? `Target: ${targetThreshold}%` : 'Benchmark',
      severity: effectiveness === 'TARGET ACHIEVED' ? 'emerald' : effectiveness === 'POSITIVE GAIN' ? 'indigo' : 'amber'
    }
  ];

  const getStyle = (sev: string) => {
    switch (sev) {
      case 'emerald':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      case 'rose':
        return 'bg-rose-50 border-rose-200 text-rose-900';
      case 'amber':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'indigo':
        return 'bg-indigo-50 border-indigo-200 text-indigo-900';
      case 'slate':
      default:
        return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <GitCommit className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Closed-Loop Evidence Traceability Chain
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 9
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic 5-stage progression from approved intervention to observed reassessment outcome
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md font-medium">
          <ShieldCheck className="h-4 w-4" />
          <span>Factual Evidence Audited</span>
        </div>
      </div>

      {/* Traceability Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 relative">
        {chainNodes.map((node, index) => {
          const style = getStyle(node.severity);
          const isLast = index === chainNodes.length - 1;

          return (
            <div key={index} className="flex flex-col relative">
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between h-full ${style}`}>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
                    {node.stage}
                  </div>
                  <div className="text-xs font-bold mb-0.5 break-words">
                    {node.label}
                  </div>
                  <div className="text-[11px] font-mono opacity-85">
                    {node.detail}
                  </div>
                </div>
              </div>

              {!isLast && (
                <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-0.5 shadow-sm border border-slate-200 text-slate-400">
                  <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Non-Causality Disclaimer */}
      <div className="p-3 bg-slate-50 border border-slate-200 text-[11px] text-slate-600 rounded-lg flex items-start gap-2">
        <HelpCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Academic Attribution Policy:</strong> This chain documents chronological and empirical alignment. It asserts observed change between baseline and reassessment, without claiming experimental causal proof that the intervention was the sole contributing factor.
        </span>
      </div>
    </div>
  );
};

