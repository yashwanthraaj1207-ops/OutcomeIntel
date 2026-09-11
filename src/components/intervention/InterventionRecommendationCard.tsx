import React, { useState, useEffect } from 'react';
import {
  InterventionRecommendation,
  InterventionRecord,
  StudentExplanationPayload,
  InterventionPriority,
  InterventionStatus,
  GeminiRecommendationResult
} from '../../types/dataTypes';
import {
  Clock,
  Zap,
  FileQuestion,
  CheckCircle2,
  XCircle,
  Bot,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Info,
  X
} from 'lucide-react';
import {
  buildGeminiEvidencePayload,
  generateAIInterventionRecommendation,
  getGeminiApiKey
} from '../../services/geminiRecommendationService';
import { useToast } from '../common/Toast';

interface InterventionRecommendationCardProps {
  recommendation: InterventionRecommendation;
  isSelected: boolean;
  onSelect: (recommendation: InterventionRecommendation) => void;
  activeRecord?: InterventionRecord;
  explanation?: StudentExplanationPayload;
  priority?: InterventionPriority;
  onSaveDecision?: (
    recommendation: InterventionRecommendation,
    status: InterventionStatus,
    notes: string
  ) => void;
}

export const InterventionRecommendationCard: React.FC<InterventionRecommendationCardProps> = ({
  recommendation,
  onSelect,
  activeRecord,
  explanation,
  priority = 'MODERATE',
  onSaveDecision
}) => {
  const { showSuccess, showWarning } = useToast();
  const [geminiResult, setGeminiResult] = useState<GeminiRecommendationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [, setApiKeyConfigured] = useState<boolean>(() => Boolean(getGeminiApiKey()));

  // Confirmation Modals State
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showTechDetailsModal, setShowTechDetailsModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Query server status on mount to check if API key is configured
  useEffect(() => {
    let isMounted = true;
    const checkServerKey = async () => {
      try {
        const res = await fetch('/api/gemini/status');
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setApiKeyConfigured(Boolean(json.hasKey || getGeminiApiKey()));
            return;
          }
        }
      } catch {
        // ignore network error
      }
      if (isMounted) {
        setApiKeyConfigured(Boolean(getGeminiApiKey()));
      }
    };
    checkServerKey();
    return () => {
      isMounted = false;
    };
  }, []);

  // Reset Gemini state when student or CO changes
  useEffect(() => {
    setGeminiResult(null);
  }, [explanation?.studentId, explanation?.coId]);

  const handleGenerateGemini = async () => {
    if (!explanation) return;
    setIsGenerating(true);

    try {
      const evidence = buildGeminiEvidencePayload(explanation, priority);
      const result = await generateAIInterventionRecommendation(evidence, explanation);
      setGeminiResult(result);
      if (result.source === 'GEMINI_AI') {
        setApiKeyConfigured(true);
        showSuccess('Evidence-grounded recommendation generated via Gemini AI.', 'AI Ready');
      } else {
        showWarning('AI recommendation unavailable. Verified evidence-based fallback applied.', 'Evidence Fallback');
      }
    } catch (err: any) {
      setGeminiResult({
        data: null,
        source: 'DETERMINISTIC_FALLBACK',
        status: 'API_ERROR',
        statusMessage: 'AI recommendation unavailable. Showing deterministic evidence-based recommendation.',
        error: err?.message || 'Network failure',
        isAIGenerated: false
      });
      showWarning('AI recommendation unavailable. Verified evidence-based fallback applied.', 'Evidence Fallback');
    } finally {
      setIsGenerating(false);
    }
  };

  // Resolve currently active recommendation payload (AI result or deterministic)
  const activeTitle = geminiResult?.data?.recommendationTitle || recommendation.type;
  const activeTopic = geminiResult?.data?.targetTopic || recommendation.targetTopic;
  const activeCO = geminiResult?.data?.targetCO || recommendation.targetCO;
  const activePriority = geminiResult?.data?.priority || recommendation.priority || priority;
  const activeIntensity = geminiResult?.data?.intensity || recommendation.intensity;
  const activeTiming = geminiResult?.data?.timing || recommendation.timing;
  const activeReason =
    geminiResult?.data?.evidenceBasedReason ||
    recommendation.reason ||
    'General reinforcement practice is recommended based on the observed diagnostic evidence.';
  const activeFocus = geminiResult?.data?.academicFocus || recommendation.academicFocus;
  const activeQuestions = geminiResult?.data?.targetQuestionIds || recommendation.questionIds || [];

  // Instructional sequence steps
  const instructionalSteps: { step: string; title: string; desc: string }[] =
    geminiResult?.data?.instructionalSequence && geminiResult.data.instructionalSequence.length > 0
      ? geminiResult.data.instructionalSequence.map((text, idx) => {
          const stepNum = String(idx + 1).padStart(2, '0');
          const titles = ['Diagnostic Review', 'Worked Example', 'Guided Practice', 'Formative Assessment'];
          return {
            step: stepNum,
            title: titles[idx] || `Instructional Step ${idx + 1}`,
            desc: text
          };
        })
      : [
          {
            step: '01',
            title: 'Diagnostic Review',
            desc: `Analyze student responses on ${activeTopic} predecessor assessments.`
          },
          {
            step: '02',
            title: 'Worked Example',
            desc: 'Review representative problems with step-by-step resolution and misconception breakdown.'
          },
          {
            step: '03',
            title: 'Guided Practice',
            desc: 'Complete targeted formative questions with immediate corrective feedback.'
          }
        ];

  // Resolve authorization status
  const isApproved = activeRecord?.status === 'Approved' && activeRecord.interventionType === recommendation.type;
  const isRejected = activeRecord?.status === 'Rejected' && activeRecord.interventionType === recommendation.type;

  // Active recommendation object to pass to handlers
  const resolvedRec: InterventionRecommendation = {
    ...recommendation,
    type: (geminiResult?.data?.interventionType as any) || recommendation.type,
    targetTopic: activeTopic,
    targetCO: activeCO,
    priority: activePriority as any,
    intensity: activeIntensity,
    timing: activeTiming as any,
    academicFocus: activeFocus,
    reason: activeReason,
    questionIds: activeQuestions,
    facultyNotes: geminiResult?.data?.facultyReviewNote || recommendation.facultyNotes
  };

  // Execution of Approved decision
  const confirmApprove = () => {
    onSelect(resolvedRec);
    if (onSaveDecision) {
      onSaveDecision(resolvedRec, 'Approved', activeRecord?.facultyNotes || `Approved ${activeTitle} for ${activeTopic}`);
    }
    setShowApproveModal(false);
    showSuccess('Intervention approved successfully.', 'Faculty Decision Recorded');
  };

  // Execution of Rejected decision
  const confirmReject = () => {
    onSelect(resolvedRec);
    const notes = rejectReason.trim()
      ? `Rejected: ${rejectReason.trim()}`
      : `Rejected recommendation: ${activeTitle} for ${activeTopic}`;
    if (onSaveDecision) {
      onSaveDecision(resolvedRec, 'Rejected', notes);
    }
    setShowRejectModal(false);
    setRejectReason('');
    showSuccess('Intervention rejected. Faculty decision recorded.', 'Decision Logged');
  };

  const isFallbackActive = geminiResult?.source === 'DETERMINISTIC_FALLBACK';

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden text-slate-900 transition-all">
      {/* ========================================================================= */}
      {/* 1. COMPACT INSTITUTIONAL HEADER                                           */}
      {/* ========================================================================= */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
              <Bot className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Instructional Intervention Recommendation
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evidence-based recommendation generated from the diagnostic analysis.
          </p>
        </div>

        {/* Right side: Regenerate button */}
        {explanation && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGenerateGemini}
              disabled={isGenerating}
              className="h-9 px-4 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{geminiResult?.data ? 'Regenerate Recommendation' : 'Generate Recommendation'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. COMPACT STATUS ROW                                                     */}
      {/* ========================================================================= */}
      <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Evidence Grounded badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>Evidence-Grounded</span>
          </span>

          {/* Fallback status: Only shown when fallback active, never alarming */}
          {isFallbackActive && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Evidence-based fallback active</span>
            </span>
          )}

          {/* Genuine AI Badge if connected */}
          {geminiResult?.source === 'GEMINI_AI' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Powered by Gemini AI</span>
            </span>
          )}
        </div>

        {/* Small secondary trigger for technical details */}
        {geminiResult && (
          <button
            type="button"
            onClick={() => setShowTechDetailsModal(true)}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
          >
            <Info className="h-3 w-3 text-slate-400" />
            <span>Technical details</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. COMPACT FALLBACK STATUS STRIP (ONLY WHEN FALLBACK IS ACTIVE)           */}
      {/* ========================================================================= */}
      {isFallbackActive && (
        <div className="mx-5 my-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-amber-950">
          <div>
            <span className="font-bold block text-amber-900">AI recommendation unavailable</span>
            <span className="text-amber-800/90 text-[11px]">
              Using verified deterministic evidence from Module 5.
            </span>
          </div>

          {/* Compact 3-step verification chain */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium shrink-0">
            <span className="px-2 py-1 bg-white rounded-md border border-amber-200 text-slate-700">
              Evidence Verified
            </span>
            <span className="text-amber-500">→</span>
            <span className="px-2 py-1 bg-white rounded-md border border-amber-200 text-slate-700">
              Recommendation Generated
            </span>
            <span className="text-amber-500">→</span>
            <span className="px-2 py-1 bg-emerald-50 rounded-md border border-emerald-200 text-emerald-800 font-semibold">
              Faculty Review
            </span>
          </div>
        </div>
      )}

      {/* Loading state indicator */}
      {isGenerating && (
        <div className="mx-5 my-3 p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-center gap-2.5 text-xs text-indigo-900">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
          <span className="font-semibold">Synthesizing clinical diagnostic recommendation...</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DOMINANT INTERVENTION CONTENT                                          */}
      {/* ========================================================================= */}
      <div className="p-6 space-y-6">
        {/* Section A: Recommended Intervention & Key Scope */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 block mb-1">
            RECOMMENDED INTERVENTION
          </span>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                {activeTitle}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeted instructional strategy focused on {activeFocus}
              </p>
            </div>

            {/* Structured Scope Grid / Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Target Topic</span>
                <span className="font-bold text-slate-800 truncate block">{activeTopic}</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Target CO</span>
                <span className="font-bold text-slate-800 block">{activeCO}</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Priority</span>
                <span className="font-bold text-indigo-700 block font-mono">{activePriority}</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Intensity</span>
                <span className="font-bold text-slate-800 block flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  <span>{activeIntensity}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section B: Why This Is Recommended */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
            WHY THIS IS RECOMMENDED
          </span>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <p>{activeReason}</p>
          </div>
        </div>

        {/* Section C: Recommended Instructional Sequence */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
            RECOMMENDED INSTRUCTIONAL SEQUENCE
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {instructionalSteps.map(step => (
              <div
                key={step.step}
                className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    {step.step}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{step.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pt-0.5">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section D: Targeted Question Items & Timing */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <FileQuestion className="h-3.5 w-3.5 text-slate-400" />
              <span>Target Question Items:</span>
            </span>
            {activeQuestions.length > 0 ? (
              activeQuestions.map((q, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[11px] font-bold text-slate-700"
                >
                  {q}
                </span>
              ))
            ) : (
              <span className="text-slate-400 italic text-[11px]">Comprehensive topic remediation</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Timing: <strong className="text-slate-700">{activeTiming}</strong></span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. FACULTY DECISION ACTION ROW                                            */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-0.5">
              FACULTY DECISION
            </span>
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Decision Authorized: Approved</span>
              </span>
            ) : isRejected ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>Decision Authorized: Rejected / Overridden</span>
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Awaiting instructor review and formal authorization.
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              className="h-9 px-4 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-semibold text-xs transition cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              Reject / Override
            </button>

            <button
              type="button"
              onClick={() => setShowApproveModal(true)}
              className="h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs transition shadow-xs cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500 flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve Intervention</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: APPROVE INTERVENTION CONFIRMATION DIALOG                         */}
      {/* ========================================================================= */}
      {showApproveModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-fade-in text-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Approve this intervention?</h4>
                  <p className="text-xs text-slate-500">
                    Confirm that the recommended instructional intervention should proceed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>
                <strong className="text-slate-800">Strategy:</strong> {activeTitle}
              </div>
              <div>
                <strong className="text-slate-800">Target Focus:</strong> {activeTopic} ({activeCO})
              </div>
              <div>
                <strong className="text-slate-800">Intensity:</strong> {activeIntensity} • {activeTiming}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="h-9 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmApprove}
                className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold cursor-pointer active:scale-[0.98] shadow-xs"
              >
                Approve Intervention
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REJECT / OVERRIDE CONFIRMATION DIALOG                            */}
      {/* ========================================================================= */}
      {showRejectModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-fade-in text-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Reject or override this recommendation?</h4>
                  <p className="text-xs text-slate-500">Allow a short optional reason.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Override / Rejection Reason (Optional):
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g., Student already demonstrated mastery in lab clinic, or alternative remediation planned..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="h-9 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReject}
                className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold cursor-pointer active:scale-[0.98] shadow-xs"
              >
                Reject / Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TECHNICAL DETAILS & NETWORK DIAGNOSTICS                          */}
      {/* ========================================================================= */}
      {showTechDetailsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-fade-in text-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Technical Details & Diagnostics</h4>
                  <p className="text-xs text-slate-500">
                    System diagnostics and external AI integration status.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTechDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Recommendation Source:</span>
                  <span className="font-bold text-slate-900">{geminiResult?.source || 'DETERMINISTIC_CATALOG'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Request Status:</span>
                  <span className="font-bold text-slate-900">{geminiResult?.status || 'IDLE'}</span>
                </div>
                {geminiResult?.error && (
                  <div className="pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-sans block mb-0.5">Diagnostic Error / Response:</span>
                    <span className="text-rose-700 break-all block">{geminiResult.error}</span>
                  </div>
                )}
                {geminiResult?.statusMessage && (
                  <div className="pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-sans block mb-0.5">Status Summary:</span>
                    <span className="text-slate-700 break-all block">{geminiResult.statusMessage}</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500">
                When external generative services are rate-limited or unreachable, OutcomeIntel automatically preserves institutional continuity by engaging deterministic pedagogical decision matrices.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTechDetailsModal(false)}
                className="h-9 px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
