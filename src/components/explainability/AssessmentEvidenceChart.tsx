import React from 'react';
import { BarChart3, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { TopicProgressionMilestone, TopicDiagnosisItem } from '../../types/dataTypes';

interface AssessmentEvidenceChartProps {
  coProgression: TopicProgressionMilestone[];
  topics: TopicDiagnosisItem[];
  predictionAssessment: string;
  historicalAssessments: string[];
  targetThreshold: number | null;
}

export const AssessmentEvidenceChart: React.FC<AssessmentEvidenceChartProps> = ({
  coProgression,
  topics,
  predictionAssessment,
  historicalAssessments,
  targetThreshold
}) => {
  const isBaseline = historicalAssessments.length === 0;
  const effectiveTarget = targetThreshold !== null ? targetThreshold : 70;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Historical Assessment Progression Chart
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 7
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Chronological score trajectories across admitted historical assessments preceding horizon {predictionAssessment}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center gap-1 text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Zero Data Leakage: <strong className="font-mono text-slate-700">{predictionAssessment}</strong> Quarantined
          </span>
        </div>
      </div>

      {/* Main Chart Content */}
      {isBaseline ? (
        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-2">
          <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto" />
          <h4 className="text-xs font-bold text-slate-800">No Preceding Historical Assessments</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Assessment {predictionAssessment} is the earliest chronological milestone. Chronological progression charts require at least one prior historical assessment milestone.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Milestone Cards Visual Grid */}
          <div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
              Overall CO Attainment Trajectory by Assessment
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {historicalAssessments.map((assId) => {
                const milestone = coProgression.find(p => p.assessmentId.toUpperCase() === assId.toUpperCase());
                const pct = milestone ? milestone.attainmentPct : 0;
                const marks = milestone ? milestone.marksObtained : 0;
                const max = milestone ? milestone.maxMarks : 0;
                const isAboveTarget = pct >= effectiveTarget;

                return (
                  <div
                    key={assId}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" />
                        Assessment {assId}
                      </span>
                      <span className={`font-mono font-bold ${isAboveTarget ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {milestone ? `${pct.toFixed(1)}%` : 'No Records'}
                      </span>
                    </div>

                    {/* Progress Bar with Target Marker */}
                    <div className="space-y-1">
                      <div className="relative w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isAboveTarget ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>0%</span>
                        <span className="text-indigo-600 font-semibold">Target: {effectiveTarget}%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                      <span>Marks: <strong className="font-mono">{marks} / {max}</strong></span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isAboveTarget ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isAboveTarget ? 'Target Met' : 'Below Target'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Topic Progression Comparison Grid */}
          {topics.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
                Topic Performance Across Admitted Milestones
              </span>

              <div className="space-y-3">
                {topics.map((t) => (
                  <div key={t.topic} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold text-slate-900">{t.topic}</span>
                      <div className="flex items-center space-x-2 font-mono">
                        <span className="text-slate-500 text-[11px]">Cumulative Attainment:</span>
                        <span className={`font-bold ${t.attainmentPct < 50 ? 'text-rose-600' : t.attainmentPct < effectiveTarget ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {t.attainmentPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Milestones chips */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {historicalAssessments.map((assId) => {
                        const m = t.progression.find(p => p.assessmentId.toUpperCase() === assId.toUpperCase());
                        if (!m) return null;
                        const mPass = m.attainmentPct >= effectiveTarget;
                        return (
                          <span
                            key={assId}
                            className={`px-2.5 py-1 rounded text-[11px] font-mono border flex items-center gap-1.5 ${
                              mPass
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            <span>{assId}:</span>
                            <strong>{m.attainmentPct.toFixed(1)}%</strong>
                            <span className="text-[10px] opacity-75">({m.marksObtained}/{m.maxMarks})</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

