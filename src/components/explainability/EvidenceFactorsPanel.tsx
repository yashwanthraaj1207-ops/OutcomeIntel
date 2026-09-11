import React from 'react';
import { ListChecks, AlertCircle, CheckCircle2, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { EvidenceFactor } from '../../types/dataTypes';

interface EvidenceFactorsPanelProps {
  factors: EvidenceFactor[];
}

export const EvidenceFactorsPanel: React.FC<EvidenceFactorsPanelProps> = ({ factors }) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-rose-600" />
            Critical Factor
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            Warning
          </span>
        );
      case 'positive':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Positive Signal
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
            <Info className="h-3 w-3 text-slate-500" />
            Informational
          </span>
        );
    }
  };

  const getSourceLevelBadge = (level: string) => {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
        Level: {level}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Traceable Deterministic Evidence Factors
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 8
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Discrete factual triggers synthesized directly from historical performance records (100% auditable, no LLM hallucinations)
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          {factors.length} Active Evidence Triggers
        </span>
      </div>

      {/* Factors List */}
      <div className="space-y-3">
        {factors.map((f, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
              f.severity === 'critical'
                ? 'bg-rose-50/50 border-rose-200'
                : f.severity === 'warning'
                ? 'bg-amber-50/50 border-amber-200'
                : f.severity === 'positive'
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-xs">{f.category}</span>
                {getSourceLevelBadge(f.sourceLevel)}
              </div>
              <div>{getSeverityBadge(f.severity)}</div>
            </div>

            <p className="text-slate-700 leading-relaxed font-medium">
              {f.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200/60 text-[11px] font-mono">
              <div className="flex items-center space-x-1.5 text-slate-600">
                <span className="text-slate-400 font-sans">Observed Value:</span>
                <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{f.actualValue}</strong>
              </div>

              <div className="flex items-center space-x-1.5 text-slate-600">
                <span className="text-slate-400 font-sans">Reference:</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">{f.referenceValue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

