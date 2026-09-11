import React from 'react';
import { ArrowRight, ShieldCheck, Database, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { COAttainmentItem, CourseSummaryMetrics } from '../../types/dataTypes';

interface Module3HandoverCardProps {
  summary: CourseSummaryMetrics;
  coItems: COAttainmentItem[];
  onNavigateToModule3?: () => void;
}

export const Module3HandoverCard: React.FC<Module3HandoverCardProps> = ({
  summary,
  coItems,
  onNavigateToModule3
}) => {
  const metCOs = coItems.filter(c => c.status === 'Target Met').length;
  const belowCOs = coItems.filter(c => c.status === 'Below Target').length;
  const noTargetCOs = coItems.filter(c => c.status === 'Target Not Configured').length;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-md border border-slate-800 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Module 2 Complete
            </span>
            <span className="flex items-center text-xs text-emerald-400">
              <ShieldCheck className="h-4 w-4 mr-1" />
              CO Attainment Engine Active
            </span>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            Ready for Module 3 — Student Risk Prediction & Early Warning
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Deterministic Course Outcome and Question/Topic attainment analytics have been calculated and verified from the validated dataset. This analytic state is prepared to feed downstream predictive models.
          </p>

          {/* Payload Summary Pills */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
              <Database className="h-3.5 w-3.5 text-indigo-400" />
              <span>Scope: <strong className="text-white font-mono">{summary.selectedCourse}</strong></span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
              <span>Cohort: <strong className="text-white font-mono">{summary.totalStudents}</strong> students</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
              <span>Records: <strong className="text-white font-mono">{summary.totalObservations.toLocaleString()}</strong> rows</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-emerald-950/70 border border-emerald-800/60 px-2.5 py-1 rounded-md text-emerald-300">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Met: <strong>{metCOs}</strong> COs</span>
            </div>

            {belowCOs > 0 && (
              <div className="flex items-center space-x-1.5 bg-rose-950/70 border border-rose-800/60 px-2.5 py-1 rounded-md text-rose-300">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Lagging: <strong>{belowCOs}</strong> COs</span>
              </div>
            )}

            {noTargetCOs > 0 && (
              <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-400">
                <span>Unconfigured: <strong>{noTargetCOs}</strong> COs</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button & Architecture Boundary Note */}
        <div className="flex flex-col items-start lg:items-end space-y-2 flex-shrink-0">
          {onNavigateToModule3 ? (
            <button
              type="button"
              onClick={onNavigateToModule3}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white cursor-pointer shadow-md transition-all"
            >
              <span>Proceed to Module 3 (Prediction)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed shadow-inner"
              title="Module 3 is reserved for subsequent development"
            >
              <span>Proceed to Module 3 (Prediction)</span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </button>
          )}

          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 max-w-xs text-left lg:text-right">
            <Info className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
            <span>
              Module 3 early-warning prediction pipeline consumes verified Module 2 analytics.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

