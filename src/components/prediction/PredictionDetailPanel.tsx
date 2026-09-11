import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Calendar,
  Layers
} from 'lucide-react';
import { PredictionResult } from '../../types/dataTypes';

interface PredictionDetailPanelProps {
  selectedPrediction: PredictionResult | null;
}

export const PredictionDetailPanel: React.FC<PredictionDetailPanelProps> = ({
  selectedPrediction
}) => {
  if (!selectedPrediction) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <HelpCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No Student Selected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Click on any student record in the prediction table above to inspect factual historical evidence.
        </p>
      </div>
    );
  }

  const { features, probabilityMeetingTarget, probabilityBelowTarget, predictedStatus, targetPct } =
    selectedPrediction;
  const isMet = predictedStatus === 'Likely to Meet Target';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Factual Feature Evidence & Prediction Breakdown
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                {selectedPrediction.studentId}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic historical inputs utilized by the prediction model (strictly prior to {selectedPrediction.predictionAssessment})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isMet ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Likely to Meet Target ({probabilityMeetingTarget.toFixed(1)}%)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>Likely Below Target ({probabilityBelowTarget.toFixed(1)}%)</span>
            </span>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <div className="text-[11px] text-slate-500 mb-0.5">Target Outcome</div>
          <div className="text-sm font-bold font-mono text-indigo-700">
            {selectedPrediction.courseId} / {selectedPrediction.coId}
          </div>
          <div className="text-[10px] text-slate-400">Institutional scope</div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <div className="text-[11px] text-slate-500 mb-0.5">Forecast Horizon</div>
          <div className="text-sm font-bold font-mono text-slate-800">
            {selectedPrediction.predictionAssessment}
          </div>
          <div className="text-[10px] text-slate-400">Subsequent assessment</div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <div className="text-[11px] text-slate-500 mb-0.5">Target Threshold</div>
          <div className="text-sm font-bold font-mono text-slate-800">
            {targetPct ? `${targetPct.toFixed(1)}%` : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400">Institutional target</div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <div className="text-[11px] text-slate-500 mb-0.5">Historical Attainment</div>
          <div className="text-sm font-bold font-mono text-slate-800">
            {features.rollingCOAttainment.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400">Cumulative prior mean</div>
        </div>
      </div>

      {/* Historical Assessment Evidence Matrix */}
      <div className="pt-2">
        <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
          <Calendar className="h-3.5 w-3.5 text-indigo-600" />
          <span>Historical Assessment Progression (Chronological Inputs)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {features.historicalAssessmentScores.map(score => {
            const scoreMet = targetPct ? score.attainmentPct >= targetPct : false;
            return (
              <div
                key={score.assessmentId}
                className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                    {score.assessmentId}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      scoreMet
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {scoreMet ? 'Target Met' : 'Below Target'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-lg font-bold font-mono text-slate-900">
                    {score.attainmentPct.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Score: {score.marksObtained.toFixed(1)} / {score.maxMarks} marks
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Summary & Logistic Regression Contributions */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-600" />
            <span>Logistic Regression Feature Contributions & Linear Logit</span>
          </h4>
          {selectedPrediction.linearCombinationScore !== undefined && (
            <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Logit z = {selectedPrediction.linearCombinationScore.toFixed(3)} ➔ P = {selectedPrediction.probabilityMeetingTarget.toFixed(1)}%
            </span>
          )}
        </div>

        {/* Feature Contribution Breakdown Table */}
        {features.featureContributions && features.featureContributions.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2">Feature Name</th>
                  <th className="px-3 py-2 text-right">Raw Value (x)</th>
                  <th className="px-3 py-2 text-right">Normalized (x̃)</th>
                  <th className="px-3 py-2 text-right">Model Weight (w)</th>
                  <th className="px-3 py-2 text-right">Contribution (w·x̃)</th>
                  <th className="px-3 py-2 text-center">Directional Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {features.featureContributions.map(c => {
                  const isPositive = c.contribution >= 0;
                  return (
                    <tr key={c.featureName} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-medium text-slate-800">
                        {c.displayName}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {c.featureName}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">
                        {c.rawValue}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-500">
                        {c.normalizedValue.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">
                        {c.weight > 0 ? `+${c.weight.toFixed(3)}` : c.weight.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold">
                        <span
                          className={
                            c.contribution > 0
                              ? 'text-emerald-700'
                              : c.contribution < 0
                              ? 'text-rose-700'
                              : 'text-slate-600'
                          }
                        >
                          {c.contribution > 0 ? `+${c.contribution.toFixed(3)}` : c.contribution.toFixed(3)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isPositive ? 'Promotes Target' : 'Lowers Probability'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Previous Assessment Score</span>
              <strong className="font-mono text-slate-800">{features.previousCOAttainment.toFixed(1)}%</strong>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Performance Trend</span>
              <strong className="font-mono text-slate-800">
                {features.performanceTrend} ({features.trendDelta >= 0 ? '+' : ''}{features.trendDelta.toFixed(1)}%)
              </strong>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Prior Target Met</span>
              <strong className="font-mono text-slate-800">{features.priorTargetMet ? 'Yes (True)' : 'No (False)'}</strong>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Historical Questions Attempted</span>
              <strong className="font-mono text-slate-800">{features.historicalObservationsCount} Questions</strong>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-3 text-[11px] text-slate-500 leading-relaxed flex items-center justify-between flex-wrap gap-2">
        <span>
          <strong className="text-slate-700">Model Transparency:</strong> {selectedPrediction.modelType || 'Logistic Regression'} ({selectedPrediction.modelVersion || 'LR-v1'}). Displays strictly factual historical inputs prior to {selectedPrediction.predictionAssessment}.
        </span>
        <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
          sigma(z) = 1 / (1 + e^-z)
        </span>
      </div>
    </div>
  );
};
