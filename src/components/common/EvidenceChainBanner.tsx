import React from 'react';
import { GitCommit, ShieldCheck } from 'lucide-react';

const EVIDENCE_STEPS = [
  'Assessment Data',
  'CO Analytics',
  'Prediction',
  'Risk Detection',
  'Topic Diagnosis',
  'Instructional Intervention',
  'Reassessment',
  'Observed Learning Outcome'
];

export const EvidenceChainBanner: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800 space-y-3 my-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-indigo-500/20 border border-indigo-400/30 rounded text-indigo-300">
            <GitCommit className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            Closed-Loop Academic Evidence Chain
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="italic">"Every recommendation is traceable to observed academic evidence."</span>
        </div>
      </div>

      {/* Chain Track */}
      <div className="flex items-center justify-between overflow-x-auto py-1 gap-1 text-[11px] font-mono">
        {EVIDENCE_STEPS.map((step, idx) => (
          <React.Fragment key={step}>
            <div className="bg-slate-800/80 border border-slate-700/80 px-2.5 py-1.5 rounded-lg whitespace-nowrap text-slate-200 text-center flex items-center space-x-1.5 shadow-xs">
              <span className="text-indigo-400 font-bold text-[10px]">#{idx + 1}</span>
              <span className="font-semibold">{step}</span>
            </div>
            {idx < EVIDENCE_STEPS.length - 1 && (
              <span className="text-indigo-400 font-bold px-1 select-none">
                →
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

