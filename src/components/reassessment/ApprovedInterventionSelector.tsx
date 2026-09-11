import React from 'react';
import { InterventionRecord } from '../../types/dataTypes';
import { Award, CheckCircle2, Clock, FileText, ArrowRight, User } from 'lucide-react';

interface ApprovedInterventionSelectorProps {
  interventions: InterventionRecord[];
  selectedInterventionId: string;
  onSelectIntervention: (intervention: InterventionRecord) => void;
  onNavigateToModule6: () => void;
}

export const ApprovedInterventionSelector: React.FC<ApprovedInterventionSelectorProps> = ({
  interventions,
  selectedInterventionId,
  onSelectIntervention,
  onNavigateToModule6
}) => {
  const approvedOnly = interventions.filter(i => i.status === 'Approved');

  if (approvedOnly.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
          <Award className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">No Approved Interventions Available for Reassessment</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Module 7 evaluates closed-loop performance strictly for faculty-approved interventions. No interventions have been approved yet in this session.
          </p>
        </div>
        <button
          onClick={onNavigateToModule6}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
        >
          <span>Return to Module 6 (Intervention Planning)</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Approved Intervention Candidate Selector
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 2
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Only faculty-approved interventions from Module 6 are eligible for closed-loop evaluation ({approvedOnly.length} candidate case(s))
            </p>
          </div>
        </div>
      </div>

      {/* Candidates List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {approvedOnly.map((intv) => {
          const isSelected = intv.interventionId === selectedInterventionId;

          const priorityStyle =
            intv.priority === 'CRITICAL'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : intv.priority === 'HIGH'
              ? 'bg-orange-50 text-orange-700 border-orange-200'
              : intv.priority === 'MODERATE'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200';

          return (
            <div
              key={intv.interventionId}
              onClick={() => onSelectIntervention(intv)}
              className={`p-4 rounded-xl border transition-all cursor-pointer bg-white flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-indigo-500" />
                    Student {intv.studentId}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityStyle}`}>
                    {intv.priority} Priority
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {intv.interventionType}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Topic: <strong className="text-slate-700">{intv.topic}</strong> • CO:{' '}
                    <strong className="text-slate-700">{intv.coId}</strong>
                  </div>
                </div>

                {intv.facultyNotes && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 flex items-start gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="italic line-clamp-2">{intv.facultyNotes}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Approved: {new Date(intv.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approved</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

