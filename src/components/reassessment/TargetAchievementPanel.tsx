import React from 'react';
import { Target, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

interface TargetAchievementPanelProps {
  postAttainment: number | null;
  targetThreshold: number | null;
  coId: string;
  studentId: string;
}

export const TargetAchievementPanel: React.FC<TargetAchievementPanelProps> = ({
  postAttainment,
  targetThreshold,
  coId,
  studentId
}) => {
  let statusState: 'ACHIEVED' | 'NOT_ACHIEVED' | 'NO_TARGET' | 'PENDING' = 'PENDING';

  if (postAttainment === null) {
    statusState = 'PENDING';
  } else if (targetThreshold === null) {
    statusState = 'NO_TARGET';
  } else if (postAttainment >= targetThreshold) {
    statusState = 'ACHIEVED';
  } else {
    statusState = 'NOT_ACHIEVED';
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Institutional Target Achievement Determination
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 8
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Direct verification against Course Outcome attainment benchmark for Student {studentId}
            </p>
          </div>
        </div>
      </div>

      {/* Decision Banner */}
      <div className="p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4">
        {statusState === 'ACHIEVED' ? (
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                <span>YES — TARGET ACHIEVED</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-mono">
                  {postAttainment?.toFixed(1)}% ≥ {targetThreshold}%
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Observed post-intervention performance reached the institutional target threshold for {coId}. The student demonstrates mastery meeting departmental curriculum criteria.
              </p>
            </div>
          </div>
        ) : statusState === 'NOT_ACHIEVED' ? (
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <span>NO — TARGET NOT YET ACHIEVED</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-mono">
                  {postAttainment?.toFixed(1)}% &lt; {targetThreshold}%
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                Observed post-intervention performance remains below the institutional target threshold for {coId}. Continued instructional scaffolding or secondary review may be required.
              </p>
            </div>
          </div>
        ) : statusState === 'NO_TARGET' ? (
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-900">
                NO TARGET CONFIGURED
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                No formal target percentage was configured for {coId}. Observed attainment is {postAttainment?.toFixed(1)}%.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl shrink-0 mt-0.5">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                PENDING — REASSESSMENT DATA NOT AVAILABLE
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Target achievement cannot be confirmed until post-intervention reassessment records are loaded for this student.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

