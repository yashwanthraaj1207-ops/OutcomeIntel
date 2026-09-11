import React from 'react';
import { ArrowRight, ShieldCheck, Database, Info, Layers, FileQuestion, AlertTriangle } from 'lucide-react';
import { StudentExplanationPayload } from '../../types/dataTypes';

interface Module6HandoverCardProps {
  payload: StudentExplanationPayload;
  onNavigateToModule6?: () => void;
}

export const Module6HandoverCard: React.FC<Module6HandoverCardProps> = ({ payload, onNavigateToModule6 }) => {
  const weakTopicCount = payload.topics.filter(t => t.diagnosisCategory === 'Critical Weakness' || t.diagnosisCategory === 'Needs Attention').length;
  const weakQuestionCount = payload.questions.filter(q => q.attainmentPct < 50.0).length;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-md border border-slate-800 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Module 5 Complete
            </span>
            <span className="flex items-center text-xs text-emerald-400">
              <ShieldCheck className="h-4 w-4 mr-1" />
              Diagnostic Evidence Attributed
            </span>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            Ready for Module 6 — Instructional Intervention
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The diagnostic evidence payload has been synthesized for student case <strong className="font-mono text-indigo-300">{payload.studentId}</strong>. Traceable root causes across Course Outcome, contributing topics, and question-level responses are ready for prescriptive pedagogical intervention planning.
          </p>

          {/* Payload Summary Pills */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
              <Database className="h-3.5 w-3.5 text-indigo-400" />
              <span>Case: <strong className="text-white font-mono">{payload.studentId}</strong> ({payload.courseId} / {payload.coId})</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>Weak Topics: <strong className="text-white font-mono">{weakTopicCount}</strong></span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
              <FileQuestion className="h-3.5 w-3.5 text-rose-400" />
              <span>Deficit Questions: <strong className="text-white font-mono">{weakQuestionCount}</strong></span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md text-slate-300">
              <AlertTriangle className="h-3.5 w-3.5 text-indigo-400" />
              <span>Evidence Triggers: <strong className="text-white font-mono">{payload.evidenceFactors.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Button & Architecture Boundary Note */}
        <div className="flex flex-col items-start lg:items-end space-y-2 flex-shrink-0">
          {onNavigateToModule6 ? (
            <button
              type="button"
              onClick={onNavigateToModule6}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <span>Proceed to Module 6 (Intervention)</span>
              <ArrowRight className="h-4 w-4 text-white" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed shadow-inner"
            >
              <span>Proceed to Module 6 (Intervention)</span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </button>
          )}

          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 max-w-xs text-left lg:text-right">
            <Info className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
            <span>
              Pass diagnostic evidence directly into Module 6 for faculty-in-the-loop intervention planning.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

