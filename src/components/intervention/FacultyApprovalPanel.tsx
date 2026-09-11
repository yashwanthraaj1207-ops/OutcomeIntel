import React, { useState, useEffect } from 'react';
import {
  InterventionRecommendation,
  InterventionRecord,
  InterventionStatus
} from '../../types/dataTypes';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  FileEdit,
  AlertCircle,
  Zap,
  X
} from 'lucide-react';
import { useToast } from '../common/Toast';

interface FacultyApprovalPanelProps {
  studentId: string;
  selectedRecommendation: InterventionRecommendation | null;
  activeRecord?: InterventionRecord;
  onSaveDecision: (
    recommendation: InterventionRecommendation,
    status: InterventionStatus,
    notes: string
  ) => void;
}

export const FacultyApprovalPanel: React.FC<FacultyApprovalPanelProps> = ({
  studentId,
  selectedRecommendation,
  activeRecord,
  onSaveDecision
}) => {
  const { showSuccess } = useToast();
  const [notes, setNotes] = useState<string>('');
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  useEffect(() => {
    if (activeRecord) {
      setNotes(activeRecord.facultyNotes || '');
    } else if (selectedRecommendation) {
      setNotes(`Recommended: ${selectedRecommendation.type} for ${selectedRecommendation.targetTopic}. `);
    } else {
      setNotes('');
    }
  }, [selectedRecommendation, activeRecord]);

  if (!selectedRecommendation) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center space-y-3">
        <UserCheck className="h-8 w-8 text-slate-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Faculty Review & Approval</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Please select an intervention option from the catalog or recommendation card above to review, customize notes, and approve or reject.
        </p>
      </div>
    );
  }

  const handleConfirmApprove = () => {
    onSaveDecision(selectedRecommendation, 'Approved', notes);
    setShowApproveModal(false);
    showSuccess('Intervention approved successfully.', 'Faculty Decision Recorded');
  };

  const handleConfirmReject = () => {
    const finalNotes = rejectReason.trim()
      ? `${notes.trim()} [Override: ${rejectReason.trim()}]`
      : notes.trim() || 'Intervention rejected by instructor';
    onSaveDecision(selectedRecommendation, 'Rejected', finalNotes);
    setShowRejectModal(false);
    setRejectReason('');
    showSuccess('Intervention rejected. Faculty decision recorded.', 'Decision Logged');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Faculty Review & Approval Workflow
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 7
              </span>
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-wider text-[10px]">
                AI Recommends. Faculty Decides.
              </span>
              <span>Faculty-in-the-loop governance for Student <strong className="font-mono text-slate-900">{studentId}</strong></span>
            </p>
          </div>
        </div>

        {activeRecord ? (
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-xs ${
                activeRecord.status === 'Approved'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {activeRecord.status === 'Approved' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-rose-600" />
              )}
              <span>Decision Authorized: {activeRecord.status}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-800 flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>Recommendation loaded for review</span>
            </span>
          </div>
        )}
      </div>

      {/* Selected Action Card Summary */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-slate-500 font-medium block text-[11px]">Selected Strategy</span>
          <span className="font-bold text-slate-900 text-sm">{selectedRecommendation.type}</span>
        </div>
        <div>
          <span className="text-slate-500 font-medium block text-[11px]">Target Focus</span>
          <span className="font-semibold text-slate-800">{selectedRecommendation.targetTopic} ({selectedRecommendation.targetCO})</span>
        </div>
        <div>
          <span className="text-slate-500 font-medium block text-[11px]">Intensity & Timing</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-500" /> {selectedRecommendation.intensity} • {selectedRecommendation.timing}
          </span>
        </div>
        <div>
          <span className="text-slate-500 font-medium block text-[11px]">Priority Level</span>
          <span className="font-bold text-indigo-700 font-mono">{selectedRecommendation.priority}</span>
        </div>
      </div>

      {/* Faculty Editable Notes */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <FileEdit className="h-3.5 w-3.5 text-indigo-600" />
          <span>Faculty Clinical Notes & Customized Action Plan</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add instructor instructions, scheduled clinic hours, assigned problem sets, or rationale for override..."
          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
        />
        <p className="text-[11px] text-slate-500">
          Faculty notes will be permanently logged in the audit trail and handed over to Module 7 for reassessment evaluation.
        </p>
      </div>

      {/* Approval & Rejection Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-slate-100 gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
          <span>Interventions are NOT automatically applied. Explicit faculty sign-off is required.</span>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Reject / Override Button */}
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400 active:scale-[0.98]"
          >
            <XCircle className="h-4 w-4 text-rose-600" />
            <span>Reject / Override</span>
          </button>

          {/* Approve Button */}
          <button
            type="button"
            onClick={() => setShowApproveModal(true)}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 active:scale-[0.98]"
          >
            <CheckCircle2 className="h-4 w-4 text-white" />
            <span>Approve Intervention</span>
          </button>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
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
                <strong className="text-slate-800">Strategy:</strong> {selectedRecommendation.type}
              </div>
              <div>
                <strong className="text-slate-800">Target Focus:</strong> {selectedRecommendation.targetTopic} ({selectedRecommendation.targetCO})
              </div>
              <div>
                <strong className="text-slate-800">Faculty Notes:</strong> {notes || 'None entered'}
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
                onClick={handleConfirmApprove}
                className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold cursor-pointer active:scale-[0.98] shadow-xs"
              >
                Approve Intervention
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject / Override Confirmation Modal */}
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
                placeholder="e.g., Clinical review indicates alternative remediation schedule..."
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
                onClick={handleConfirmReject}
                className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold cursor-pointer active:scale-[0.98] shadow-xs"
              >
                Reject / Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
