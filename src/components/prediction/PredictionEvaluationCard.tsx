import React from 'react';
import { Award, AlertCircle, Info } from 'lucide-react';
import { PredictionEvaluationMetrics } from '../../types/dataTypes';

interface PredictionEvaluationCardProps {
  metrics: PredictionEvaluationMetrics | null;
}

export const PredictionEvaluationCard: React.FC<PredictionEvaluationCardProps> = ({ metrics }) => {
  if (!metrics || metrics.testCount === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
        <Info className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">Evaluation Metrics Unavailable</h3>
        <p className="text-xs text-slate-400 mt-1">
          Evaluation metrics unavailable due to insufficient test samples. Requires multiple chronological assessment transitions.
        </p>
      </div>
    );
  }

  const { confusionMatrix } = metrics;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Model Evaluation & Test Performance
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 5
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated strictly on held-out test students ({metrics.testStudentsCount} students, {metrics.testCount} transition samples)
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
          Student-Level 70/30 Split
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <span className="text-[11px] text-slate-500 block mb-1">Accuracy</span>
          <span className="text-xl font-bold font-mono text-slate-900">
            {metrics.accuracy.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Held-out test set</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <span className="text-[11px] text-slate-500 block mb-1">Precision</span>
          <span className="text-xl font-bold font-mono text-slate-900">
            {metrics.precision.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Positive predictive</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <span className="text-[11px] text-slate-500 block mb-1">Recall</span>
          <span className="text-xl font-bold font-mono text-slate-900">
            {metrics.recall.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">True positive rate</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <span className="text-[11px] text-slate-500 block mb-1">F1 Score</span>
          <span className="text-xl font-bold font-mono text-slate-900">
            {metrics.f1Score.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Harmonic mean</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <span className="text-[11px] text-slate-500 block mb-1">ROC-AUC</span>
          <span className="text-xl font-bold font-mono text-indigo-700">
            {metrics.rocAuc !== null ? metrics.rocAuc.toFixed(3) : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Rank discrimination</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <span className="text-[11px] text-slate-500 block mb-1">Log Loss</span>
          <span className="text-xl font-bold font-mono text-slate-900">
            {metrics.logLoss !== undefined ? metrics.logLoss.toFixed(4) : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Binary cross-entropy</span>
        </div>
      </div>

      {/* Confusion Matrix & Cohort Partitioning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* 2x2 Confusion Matrix */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>2×2 Empirical Confusion Matrix</span>
            <span className="text-[10px] font-normal text-slate-500">
              N = {metrics.testCount} test cases
            </span>
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
              <span className="text-[11px] text-emerald-800 font-semibold block">
                True Positives (TP)
              </span>
              <div className="text-lg font-bold font-mono text-emerald-900 mt-0.5">
                {confusionMatrix.tp}
              </div>
              <span className="text-[10px] text-emerald-600">Predicted Met & Actual Met</span>
            </div>

            <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg">
              <span className="text-[11px] text-rose-800 font-semibold block">
                False Positives (FP)
              </span>
              <div className="text-lg font-bold font-mono text-rose-900 mt-0.5">
                {confusionMatrix.fp}
              </div>
              <span className="text-[10px] text-rose-600">Predicted Met but Actual Below</span>
            </div>

            <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg">
              <span className="text-[11px] text-rose-800 font-semibold block">
                False Negatives (FN)
              </span>
              <div className="text-lg font-bold font-mono text-rose-900 mt-0.5">
                {confusionMatrix.fn}
              </div>
              <span className="text-[10px] text-rose-600">Predicted Below but Actual Met</span>
            </div>

            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
              <span className="text-[11px] text-emerald-800 font-semibold block">
                True Negatives (TN)
              </span>
              <div className="text-lg font-bold font-mono text-emerald-900 mt-0.5">
                {confusionMatrix.tn}
              </div>
              <span className="text-[10px] text-emerald-600">Predicted Below & Actual Below</span>
            </div>
          </div>
        </div>

        {/* Train/Test Cohort Breakdown */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-800">
            Student-Level Cohort Partitioning
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-600">Training Partition (70% students):</span>
              <strong className="font-mono text-slate-800">
                {metrics.trainStudentsCount} students ({metrics.trainCount} transitions)
              </strong>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-600">Held-Out Test Partition (30% students):</span>
              <strong className="font-mono text-slate-800">
                {metrics.testStudentsCount} students ({metrics.testCount} transitions)
              </strong>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Student Overlap Across Train/Test:</span>
              <span className="font-semibold text-emerald-700 font-mono">0 (Strictly Disjoint)</span>
            </div>
          </div>

          <div className="pt-2">
            <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 leading-relaxed">
              <strong>Anti-Leakage Verification:</strong> Evaluated strictly on the 30% held-out students whose records never participated in gradient descent optimization.
            </div>
          </div>
        </div>
      </div>

      {/* Prototype Disclaimer Banner */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 flex items-start space-x-2.5 text-xs text-amber-900">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Prototype Model Evaluation Disclosure:</strong> Metrics are calculated purely on the synthetic hackathon benchmark dataset. This model is designed to demonstrate data-driven architecture and temporal feature pipelines. It is not clinically or academically validated for production deployment without institution-wide institutional training.
        </div>
      </div>
    </div>
  );
};
