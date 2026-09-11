import React, { useState } from 'react';
import { Module8HandoverPayload } from '../../types/dataTypes';
import { Download, ShieldCheck, Info, ArrowRight } from 'lucide-react';

interface Module8HandoverCardProps {
  payload: Module8HandoverPayload;
  onNavigateToModule8?: () => void;
}

export const Module8HandoverCard: React.FC<Module8HandoverCardProps> = ({
  payload,
  onNavigateToModule8
}) => {
  const [showSummary, setShowSummary] = useState<boolean>(false);

  const exportOutcomeJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `reassessment_outcome_${payload.studentId}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isReady = payload.dataSufficiency === 'SUFFICIENT';

  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-md border border-slate-800 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Module 7 Complete
            </span>
            <span className={`flex items-center text-xs ${isReady ? 'text-emerald-400' : 'text-amber-400'}`}>
              <ShieldCheck className="h-4 w-4 mr-1" />
              {isReady ? 'Closed-Loop Evaluation Verified' : 'Evaluation Partially Complete'}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            Ready for Module 8 — Longitudinal Accreditation Reporting
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The closed-loop evaluation payload for Student <strong className="font-mono text-indigo-300">{payload.studentId}</strong> ({payload.courseId} • {payload.coId}) is audited. Pre/post learning gains, topic recovery deltas, and institutional target achievement are verified for accreditation reporting.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
              Status: <strong className="text-white">{payload.effectivenessStatus}</strong>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
              Gain: <strong className="text-white font-mono">{payload.learningGains.absoluteGain !== null ? `${payload.learningGains.absoluteGain >= 0 ? '+' : ''}${payload.learningGains.absoluteGain.toFixed(1)} pp` : 'Pending'}</strong>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
              Target: <strong className="text-white">{payload.targetAchieved ? 'Achieved' : 'Not Yet Achieved'}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-start lg:items-end space-y-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportOutcomeJSON}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => setShowSummary(!showSummary)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-all cursor-pointer"
            >
              <span>{showSummary ? 'Hide Payload' : 'View Payload'}</span>
            </button>

            {onNavigateToModule8 && (
              <button
                onClick={onNavigateToModule8}
                className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
              >
                <span>Continue to CO Report</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 max-w-xs text-left lg:text-right">
            <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>
              Module 8 is the subsequent stage in the prototype pipeline. No PII is included in the payload.
            </span>
          </div>
        </div>
      </div>

      {/* Payload Modal / Expandable View */}
      {showSummary && (
        <div className="mt-6 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-200 mb-2">Structured Module 8 Handover JSON:</h4>
          <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto max-h-60">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
