import React, { useState } from 'react';
import { RefreshCw, ArrowRight, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { InterventionRecord } from '../../types/dataTypes';

interface Module7HandoverCardProps {
  approvedCount: number;
  approvedRecords: InterventionRecord[];
  onNavigateToModule7?: () => void;
}

export const Module7HandoverCard: React.FC<Module7HandoverCardProps> = ({
  approvedCount,
  approvedRecords,
  onNavigateToModule7
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const isUnlocked = approvedCount > 0;

  return (
    <div className={`rounded-xl border p-6 transition-all ${
      isUnlocked
        ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-lg border-indigo-700'
        : 'bg-slate-100 border-slate-300 text-slate-500'
    }`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isUnlocked
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                : 'bg-slate-200 text-slate-600 border-slate-300'
            }`}>
              Section 9 • Next Lifecycle Stage
            </span>
            <span className="text-xs opacity-75 font-medium">
              Closed-Loop Pedagogical Evaluation
            </span>
          </div>

          <h3 className={`text-lg font-bold flex items-center gap-2 ${isUnlocked ? 'text-white' : 'text-slate-700'}`}>
            <RefreshCw className={`h-5 w-5 ${isUnlocked ? 'text-indigo-400 animate-spin-slow' : 'text-slate-400'}`} />
            <span>Module 7 — Reassessment & Continuous Improvement</span>
          </h3>

          <p className={`text-xs leading-relaxed ${isUnlocked ? 'text-slate-300' : 'text-slate-500'}`}>
            {isUnlocked
              ? `You have approved ${approvedCount} instructional intervention(s) in this session. Module 7 ingests these approved interventions to track re-assessment performance, measure actual CO recovery, and calculate closed-loop attainment delta.`
              : 'Reassessment evaluation is currently locked. Faculty must review and approve at least one instructional intervention in Module 6 before progressing to Module 7.'}
          </p>

          {isUnlocked && (
            <div className="flex items-center space-x-2 text-xs text-indigo-200 pt-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                Ready for handover: {approvedRecords.map(r => `${r.studentId} (${r.interventionType})`).slice(0, 3).join(', ')}
                {approvedRecords.length > 3 ? ` + ${approvedRecords.length - 3} more` : ''}
              </span>
            </div>
          )}
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
          {isUnlocked ? (
            <button
              onClick={() => {
                if (onNavigateToModule7) {
                  onNavigateToModule7();
                } else {
                  setShowModal(true);
                }
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <span>Proceed to Module 7 — Reassessment</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-200 border border-slate-300 text-slate-400 font-bold text-xs flex items-center justify-center space-x-2 cursor-not-allowed">
              <Lock className="h-4 w-4" />
              <span>Module 7 Locked (Approval Required)</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal explaining handover status */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center space-x-2.5 text-indigo-600">
              <RefreshCw className="h-6 w-6" />
              <h4 className="text-base font-bold text-slate-900">Module 7 Handover Ready</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Approved intervention payload is prepared for Module 7.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-slate-800">Intervention Payload Summary:</div>
              <div className="text-slate-600 font-mono text-[11px]">
                • Total Approved Cases: {approvedCount}
              </div>
              <div className="text-slate-600 font-mono text-[11px]">
                • Target Course: {approvedRecords[0]?.courseId || 'N/A'}
              </div>
              <div className="text-slate-600 font-mono text-[11px]">
                • Pipeline Status: Closed-Loop Reassessment Handover Verified
              </div>
            </div>

            <div className="flex items-start space-x-2 text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Module 7 (Reassessment & Continuous Improvement) is the subsequent module in the prototype pipeline.
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Close Handover Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

