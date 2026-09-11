import React from 'react';
import { ArrowRight, ShieldCheck, Database, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { RiskAssessment } from '../../types/dataTypes';

interface Module5HandoverCardProps {
  assessments: RiskAssessment[];
  courseId: string;
  coId: string;
  predictionAssessment: string;
  onNavigateToModule5?: () => void;
}

export const Module5HandoverCard: React.FC<Module5HandoverCardProps> = ({
  assessments,
  courseId,
  coId,
  predictionAssessment,
  onNavigateToModule5
}) => {
  const highRisk = assessments.filter(a => a.riskLevel === 'HIGH RISK').length;
  const medRisk = assessments.filter(a => a.riskLevel === 'MEDIUM RISK').length;
  const lowRisk = assessments.filter(a => a.riskLevel === 'LOW RISK').length;
  const highRiskPct = assessments.length > 0 ? (highRisk / assessments.length) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-md border border-slate-800 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-400/30">
              Module 4 Complete
            </span>
            <span className="flex items-center text-xs text-emerald-400">
              <ShieldCheck className="h-4 w-4 mr-1" />
              Risk Triage Complete
            </span>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            Ready for Module 5 — Topic Diagnosis & Model Explainability
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Multi-signal early-warning risk levels and priority triage scores have been calculated. This triage roster is prepared for downstream topic-level root-cause diagnosis and factual evidence attribution.
          </p>

          {/* Payload Summary Pills */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
              <Database className="h-3.5 w-3.5 text-indigo-400" />
              <span>Scope: <strong className="text-white font-mono">{courseId} ({coId})</strong></span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
              <span>Target Horizon: <strong className="text-white font-mono">{predictionAssessment}</strong></span>
            </div>

            <div className="flex items-center space-x-1.5 bg-rose-950/70 border border-rose-800/60 px-2.5 py-1 rounded-md text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>High Risk: <strong>{highRisk}</strong> ({highRiskPct.toFixed(1)}%)</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-amber-950/70 border border-amber-800/60 px-2.5 py-1 rounded-md text-amber-300">
              <span>Medium Risk: <strong>{medRisk}</strong></span>
            </div>

            <div className="flex items-center space-x-1.5 bg-emerald-950/70 border border-emerald-800/60 px-2.5 py-1 rounded-md text-emerald-300">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Low Risk: <strong>{lowRisk}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Button & Architecture Boundary Note */}
        <div className="flex flex-col items-start lg:items-end space-y-2 flex-shrink-0">
          <button
            type="button"
            onClick={onNavigateToModule5}
            disabled={!onNavigateToModule5}
            className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
              onNavigateToModule5
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-95 shadow-indigo-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed shadow-inner'
            }`}
            title={onNavigateToModule5 ? 'Navigate to Module 5 Explainability' : 'Module 5 is not implemented yet'}
          >
            <span>Proceed to Module 5 (Explainability)</span>
            <ArrowRight className="h-4 w-4 text-white" />
          </button>

          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 max-w-xs text-left lg:text-right">
            <Info className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
            <span>
              {onNavigateToModule5
                ? 'Ready to inspect student topic root causes and question-level diagnosis.'
                : 'Module 5 is scheduled for subsequent implementation.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

