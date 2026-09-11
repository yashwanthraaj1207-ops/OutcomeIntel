import React from 'react';
import { BarChart3, TrendingDown, Target, HelpCircle, Layers, FileQuestion, AlertTriangle } from 'lucide-react';
import { StudentExplanationPayload } from '../../types/dataTypes';

interface EvidenceSummaryProps {
  payload: StudentExplanationPayload;
}

export const EvidenceSummary: React.FC<EvidenceSummaryProps> = ({ payload }) => {
  const weakestTopic = payload.topics.length > 0 ? payload.topics[0] : null;
  const weakestQuestion = payload.questions.length > 0 ? payload.questions[0] : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Key Diagnostic Evidence Summary
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 3
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Core empirical signals explaining student outcome classification across macro and granular dimensions
            </p>
          </div>
        </div>

        <span className="text-xs font-medium text-slate-500">
          Evaluated across <strong className="font-mono text-slate-800">{payload.coEvidence.observationCount}</strong> historical question observations
        </span>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Historical Performance */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Historical CO Attainment</span>
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {payload.historicalAttainment !== null ? `${payload.historicalAttainment.toFixed(1)}%` : 'N/A'}
          </div>
          <p className="text-[11px] text-slate-500">
            {payload.coEvidence.progression.length > 0
              ? `Progression: ${payload.coEvidence.progression.map(p => `${p.assessmentId}: ${p.attainmentPct.toFixed(0)}%`).join(' → ')}`
              : 'No historical assessments available'}
          </p>
        </div>

        {/* 2. Target Gap */}
        <div className={`p-4 border rounded-xl space-y-1.5 ${
          payload.attainmentGap === null
            ? 'bg-slate-50 border-slate-200'
            : payload.attainmentGap < -10
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : payload.attainmentGap < 0
            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Institutional Target Gap</span>
            <Target className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold font-mono">
            {payload.attainmentGap !== null ? (
              `${payload.attainmentGap > 0 ? '+' : ''}${payload.attainmentGap.toFixed(1)}%`
            ) : (
              <span className="text-xs font-normal">Target reference unavailable</span>
            )}
          </div>
          <p className="text-[11px] opacity-80">
            {payload.targetThreshold !== null
              ? `Target benchmark: ${payload.targetThreshold}%`
              : 'Evaluated under prototype fallback rule (70%)'}
          </p>
        </div>

        {/* 3. Performance Trend */}
        <div className={`p-4 border rounded-xl space-y-1.5 ${
          payload.performanceTrend === 'Declining'
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : payload.performanceTrend === 'Improving'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Chronological Trajectory</span>
            <TrendingDown className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold">
            {payload.performanceTrend}
          </div>
          <p className="text-[11px] opacity-80">
            Score progression across historical milestones
          </p>
        </div>

        {/* 4. Prediction Probability */}
        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1.5 text-indigo-950">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-800">
            <span>Predicted Probability</span>
            <HelpCircle className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-900">
            {payload.predictedProbability !== null ? `${payload.predictedProbability.toFixed(1)}%` : 'N/A'}
          </div>
          <p className="text-[11px] text-indigo-700">
            {payload.predictedProbability !== null && payload.predictedProbability < 50
              ? 'Model forecasts below-target final performance'
              : 'Model forecasts on-target attainment'}
          </p>
        </div>

        {/* 5. Weakest Topic */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Weakest Contributing Topic</span>
            <Layers className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {weakestTopic ? weakestTopic.topic : 'None identified'}
          </div>
          <p className="text-[11px] text-slate-500">
            {weakestTopic ? (
              <span className="flex items-center gap-1 font-mono font-semibold text-rose-700">
                <AlertTriangle className="h-3 w-3" />
                {weakestTopic.attainmentPct.toFixed(1)}% ({weakestTopic.diagnosisCategory})
              </span>
            ) : (
              'No topic weaknesses detected'
            )}
          </p>
        </div>

        {/* 6. Weakest Question */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Weakest Question Item</span>
            <FileQuestion className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-sm font-bold font-mono text-slate-900">
            {weakestQuestion ? `${weakestQuestion.questionId} (${weakestQuestion.assessmentId})` : 'None'}
          </div>
          <p className="text-[11px] text-slate-500">
            {weakestQuestion ? (
              <span className="font-mono text-rose-700 font-semibold">
                {weakestQuestion.attainmentPct.toFixed(1)}% ({weakestQuestion.marksObtained}/{weakestQuestion.maxMarks} marks)
              </span>
            ) : (
              'All questions answered satisfactorily'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
