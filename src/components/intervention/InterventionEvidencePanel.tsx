import React from 'react';
import {
  StudentExplanationPayload,
  InterventionRecommendation
} from '../../types/dataTypes';
import { buildEvidenceTraceChain } from '../../services/interventionEngine';
import { GitCommit, ArrowRight, ShieldCheck, HelpCircle, Bot, CheckCircle2, UserCheck } from 'lucide-react';

interface InterventionEvidencePanelProps {
  explanation: StudentExplanationPayload;
  selectedIntervention: InterventionRecommendation | null;
}

export const InterventionEvidencePanel: React.FC<InterventionEvidencePanelProps> = ({
  explanation,
  selectedIntervention
}) => {
  const chainNodes = buildEvidenceTraceChain(explanation, selectedIntervention);

  const getSeverityStyle = (sev?: 'critical' | 'warning' | 'positive' | 'info') => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-50 border-rose-200 text-rose-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'positive':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'info':
      default:
        return 'bg-indigo-50 border-indigo-200 text-indigo-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <GitCommit className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Pedagogical Evidence Traceability Chain
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 5
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic 6-stage derivation linking early risk indicators to actionable instructional remediation
            </p>
          </div>
        </div>

        {/* Verification & Governance Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md font-medium">
            <Bot className="h-3.5 w-3.5 text-indigo-600" />
            <span>AI-generated recommendation</span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Evidence-grounded</span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md font-medium">
            <UserCheck className="h-3.5 w-3.5 text-slate-600" />
            <span>Faculty approval required</span>
          </div>
        </div>
      </div>

      {/* Traceability Chain Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 relative">
        {chainNodes.map((node, index) => {
          const isLast = index === chainNodes.length - 1;
          const style = isLast
            ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 text-indigo-900'
            : getSeverityStyle(node.severity);

          const displayLabel = isLast ? 'Gemini AI Recommendation' : node.label;

          return (
            <div key={index} className="flex flex-col relative">
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between h-full transition-all ${style}`}>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
                    {node.stage}
                  </div>
                  <div className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1">
                    {isLast && <Bot className="h-3.5 w-3.5 text-indigo-600 inline shrink-0" />}
                    <span>{displayLabel}</span>
                  </div>
                  <div className="text-xs font-mono font-semibold break-words">
                    {node.value}
                  </div>
                </div>
                {isLast && (
                  <div className="mt-2 pt-1.5 border-t border-indigo-200/60 text-[10px] text-indigo-700 font-sans font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-indigo-500" />
                    <span>Evidence-grounded strategy</span>
                  </div>
                )}
              </div>

              {/* Arrow on desktop between cards */}
              {!isLast && (
                <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-0.5 shadow-sm border border-slate-200 text-slate-400">
                  <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Traceability Description */}
      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <HelpCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-800">Pedagogical Accountability & Anti-Fabrication: </span>
          <span>
            Every Gemini AI recommendation is strictly grounded in observed academic evidence. The system never proposes an intervention for an unassessed topic or without historical assessment deficits. Upstream analytics, risks, and predictions remain deterministic. Faculty retain final authority to review, customize, approve, or reject recommendations.
          </span>
        </div>
      </div>
    </div>
  );
};
