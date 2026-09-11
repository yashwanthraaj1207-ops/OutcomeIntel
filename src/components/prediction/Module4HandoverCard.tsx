import React from 'react';
import { ArrowRight, ShieldCheck, Database, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { PredictionResult } from '../../types/dataTypes';

interface Module4HandoverCardProps {
  predictions: PredictionResult[];
  courseId: string;
  coId: string;
  predictionAssessment: string;
  onNavigateToModule4?: () => void;
}

export const Module4HandoverCard: React.FC<Module4HandoverCardProps> = ({
  predictions,
  courseId,
  coId,
  predictionAssessment,
  onNavigateToModule4
}) => {
  const atRiskCount = predictions.filter(p => p.predictedStatus === 'Likely Below Target').length;
  const safeCount = predictions.length - atRiskCount;
  const atRiskPct = predictions.length > 0 ? (atRiskCount / predictions.length) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-md border border-slate-800 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Module 3 Complete
            </span>
            <span className="flex items-center text-xs text-emerald-400">
              <ShieldCheck className="h-4 w-4 mr-1" />
              Early-Warning Predictions Generated
            </span>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            Ready for Module 4 — Multi-Factor Student Risk Detection & Scoring
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Conditional early-warning probabilities have been estimated without temporal leakage. This predictive signal is prepared to feed Module 4's multi-factor risk categorization engine.
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

            <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
              <span>Evaluated: <strong className="text-white font-mono">{predictions.length}</strong> students</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-rose-950/70 border border-rose-800/60 px-2.5 py-1 rounded-md text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>At-Risk Cohort: <strong>{atRiskCount}</strong> ({atRiskPct.toFixed(1)}%)</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-emerald-950/70 border border-emerald-800/60 px-2.5 py-1 rounded-md text-emerald-300">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>On-Track: <strong>{safeCount}</strong> students</span>
            </div>
          </div>
        </div>

        {/* Action Button & Architecture Boundary Note */}
        <div className="flex flex-col items-start lg:items-end space-y-2 flex-shrink-0">
          {onNavigateToModule4 ? (
            <button
              type="button"
              onClick={onNavigateToModule4}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white cursor-pointer shadow-md transition-all"
            >
              <span>Proceed to Module 4 (Risk Detection)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed shadow-inner"
              title="Module 4 is scheduled for subsequent development"
            >
              <span>Proceed to Module 4 (Risk Detection)</span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </button>
          )}

          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 max-w-xs text-left lg:text-right">
            <Info className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
            <span>
              Module 4 multi-signal risk detection consumes verified Module 3 predictions.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
