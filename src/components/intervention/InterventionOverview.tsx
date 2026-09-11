import React from 'react';
import {
  StudentExplanationPayload,
  InterventionPriority,
  InterventionRecord
} from '../../types/dataTypes';
import {
  User,
  ShieldAlert,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileQuestion
} from 'lucide-react';

interface InterventionOverviewProps {
  explanation: StudentExplanationPayload;
  priority: InterventionPriority;
  activeRecord?: InterventionRecord;
}

export const InterventionOverview: React.FC<InterventionOverviewProps> = ({
  explanation,
  priority,
  activeRecord
}) => {
  const isHighRisk = explanation.riskLevel === 'HIGH RISK';
  const isMedRisk = explanation.riskLevel === 'MEDIUM RISK';

  const priorityColor =
    priority === 'CRITICAL'
      ? 'bg-rose-50 border-rose-200 text-rose-700'
      : priority === 'HIGH'
      ? 'bg-orange-50 border-orange-200 text-orange-700'
      : priority === 'MODERATE'
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-emerald-50 border-emerald-200 text-emerald-700';

  const riskColor = isHighRisk
    ? 'bg-red-50 border-red-200 text-red-700'
    : isMedRisk
    ? 'bg-amber-50 border-amber-200 text-amber-700'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700';

  const weakestTopic = explanation.topics[0];
  const weakQs = explanation.questions.filter(q => q.attainmentPct < 50.0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Top Banner & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700 border border-slate-200">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                Student {explanation.studentId}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 2
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {explanation.courseId} • Horizon: Assessment {explanation.predictionAssessment} • Outcome: {explanation.coId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Diagnostic Case Profile & Pedagogical Remediation State
            </p>
          </div>
        </div>

        {/* Current Approval Status Banner */}
        <div className="flex items-center">
          {activeRecord ? (
            activeRecord.status === 'Approved' ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Intervention Approved: {activeRecord.interventionType}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>Intervention Rejected / Overridden</span>
              </div>
            )
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>Pending Faculty Review</span>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Intervention Priority */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${priorityColor}`}>
          <div className="flex items-center justify-between text-xs font-semibold opacity-80 mb-1">
            <span>Intervention Priority</span>
            <Flame className="h-4 w-4" />
          </div>
          <div className="text-lg font-bold font-mono">
            {priority}
          </div>
          <div className="text-[10px] opacity-75 mt-1 font-medium">
            Strict precedence rule
          </div>
        </div>

        {/* Module 4 Risk */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${riskColor}`}>
          <div className="flex items-center justify-between text-xs font-semibold opacity-80 mb-1">
            <span>Module 4 Risk</span>
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="text-sm font-bold font-mono">
            {explanation.riskLevel}
          </div>
          <div className="text-[10px] opacity-75 mt-1 font-medium">
            Prob: {explanation.predictedProbability !== null ? `${explanation.predictedProbability.toFixed(1)}%` : 'N/A'}
          </div>
        </div>

        {/* Historical CO Attainment */}
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between text-slate-700">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span>Prior Attainment</span>
            <Target className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {explanation.historicalAttainment !== null ? `${explanation.historicalAttainment.toFixed(1)}%` : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Across {explanation.historicalAssessmentsUsed.length} prior exam(s)
          </div>
        </div>

        {/* Target & Gap */}
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between text-slate-700">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span>Attainment Gap</span>
            <Target className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold font-mono">
            {explanation.attainmentGap !== null ? (
              <span className={explanation.attainmentGap < 0 ? 'text-red-600' : 'text-emerald-600'}>
                {explanation.attainmentGap > 0 ? '+' : ''}
                {explanation.attainmentGap.toFixed(1)}%
              </span>
            ) : (
              <span className="text-xs text-amber-700 font-normal">Target Unavail.</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Target: {explanation.targetThreshold !== null ? `${explanation.targetThreshold}%` : 'N/A'}
          </div>
        </div>

        {/* Performance Trend */}
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between text-slate-700">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span>Historical Trend</span>
            {explanation.performanceTrend === 'Improving' ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : explanation.performanceTrend === 'Declining' ? (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            ) : (
              <Minus className="h-4 w-4 text-slate-400" />
            )}
          </div>
          <div className="text-sm font-bold font-mono text-slate-900">
            {explanation.performanceTrend}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Velocity factor
          </div>
        </div>

        {/* Primary Weak Topic */}
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between text-slate-700">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span>Primary Focus Topic</span>
            <FileQuestion className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-xs font-bold text-slate-900 truncate" title={weakestTopic?.topic || 'None'}>
            {weakestTopic?.topic || 'None'}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            {weakestTopic ? `${weakestTopic.attainmentPct.toFixed(1)}% (${weakestTopic.diagnosisCategory})` : 'Satisfactory'}
          </div>
        </div>
      </div>

      {/* Diagnostic Context Note */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <HelpCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-800">Diagnostic Remediation Rationale: </span>
          <span>
            {weakestTopic
              ? `Student demonstrates ${weakestTopic.diagnosisCategory.toLowerCase()} in "${weakestTopic.topic}" (${weakestTopic.attainmentPct.toFixed(1)}%). `
              : 'All evaluated topics meet current performance thresholds. '}
            {weakQs.length > 0
              ? `Specific question deficits identified in: ${weakQs.map(q => `${q.questionId} (${q.attainmentPct.toFixed(0)}%)`).join(', ')}. `
              : 'No individual question scored below 50%. '}
            {explanation.performanceTrend === 'Declining'
              ? 'Negative trajectory necessitates immediate remediation prior to upcoming assessment.'
              : 'Intervention options below are calibrated to prevent performance slippage.'}
          </span>
        </div>
      </div>
    </div>
  );
};
