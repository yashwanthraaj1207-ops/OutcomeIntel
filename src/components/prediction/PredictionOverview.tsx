import React from 'react';
import { Users, CheckCircle2, AlertTriangle, TrendingUp, HelpCircle } from 'lucide-react';

interface PredictionOverviewProps {
  totalEvaluated: number;
  predictedMet: number;
  predictedBelow: number;
  avgProbability: number;
  targetThreshold: number | null;
  hasHistoricalData: boolean;
}

export const PredictionOverview: React.FC<PredictionOverviewProps> = ({
  totalEvaluated,
  predictedMet,
  predictedBelow,
  avgProbability,
  targetThreshold,
  hasHistoricalData
}) => {
  if (!hasHistoricalData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No Eligible Prediction Cases</h3>
        <p className="text-xs text-slate-400 mt-1">
          Historical assessment observations are required to forecast future Course Outcome attainment.
        </p>
      </div>
    );
  }

  if (targetThreshold === null) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">Target Not Configured</h3>
        <p className="text-xs text-slate-400 mt-1">
          Predictions cannot be computed without a defined target attainment percentage in the CO target mapping.
        </p>
      </div>
    );
  }

  const metPct = totalEvaluated > 0 ? (predictedMet / totalEvaluated) * 100 : 0;
  const belowPct = totalEvaluated > 0 ? (predictedBelow / totalEvaluated) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Cohort Prediction Overview
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                Section 2
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Aggregate forecast of student Course Outcome target attainment probability
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Target Threshold: <strong className="font-mono text-slate-800">{targetThreshold.toFixed(1)}%</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Students Evaluated */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-medium">Students Evaluated</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800 font-mono">
            {totalEvaluated.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active student cohort</div>
        </div>

        {/* Predicted Likely to Meet Target */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
          <div className="flex items-center justify-between text-emerald-700 text-xs mb-1.5">
            <span className="font-medium">Predicted to Meet Target</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 font-mono">
            {predictedMet.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-emerald-600">
              ({metPct.toFixed(1)}%)
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">Forecasted probability ≥ 50%</div>
        </div>

        {/* Predicted Likely Below Target */}
        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80">
          <div className="flex items-center justify-between text-rose-700 text-xs mb-1.5">
            <span className="font-medium">Predicted Below Target</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-800 font-mono">
            {predictedBelow.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-rose-600">
              ({belowPct.toFixed(1)}%)
            </span>
          </div>
          <div className="text-[11px] text-rose-600 mt-1">Forecasted probability &lt; 50%</div>
        </div>

        {/* Average Attainment Probability */}
        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80">
          <div className="flex items-center justify-between text-indigo-700 text-xs mb-1.5">
            <span className="font-medium">Mean Cohort Probability</span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-800 font-mono">
            {avgProbability.toFixed(1)}%
          </div>
          <div className="text-[11px] text-indigo-600 mt-1">Average model probability</div>
        </div>
      </div>
    </div>
  );
};
