import React from 'react';
import { User, ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp, TrendingDown, Minus, Target, Award } from 'lucide-react';
import { StudentExplanationPayload } from '../../types/dataTypes';

interface StudentExplanationOverviewProps {
  payload: StudentExplanationPayload;
}

export const StudentExplanationOverview: React.FC<StudentExplanationOverviewProps> = ({ payload }) => {
  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'HIGH RISK':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            HIGH RISK
          </span>
        );
      case 'MEDIUM RISK':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            MEDIUM RISK
          </span>
        );
      case 'LOW RISK':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            LOW RISK
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            INSUFFICIENT DATA
          </span>
        );
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Improving':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'Declining':
        return <TrendingDown className="h-4 w-4 text-rose-600" />;
      default:
        return <Minus className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Student Case Diagnostic Profile:
              <span className="font-mono text-indigo-700 font-extrabold">{payload.studentId}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 2
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated case summary synthesizing Module 3 prediction outputs, Module 4 risk classification, and institutional targets
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {getRiskBadge(payload.riskLevel)}
          {payload.priorityScore !== null && (
            <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              Priority: {payload.priorityScore}/100
            </span>
          )}
        </div>
      </div>

      {/* Case Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Scope */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Academic Scope</span>
          <div className="text-sm font-bold font-mono text-slate-900">
            {payload.courseId} / {payload.coId}
          </div>
          <span className="text-[10px] text-slate-500">Horizon: {payload.predictionAssessment}</span>
        </div>

        {/* Target */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center gap-1">
            <Target className="h-3 w-3 text-slate-400" />
            Institutional Target
          </span>
          <div className="text-sm font-bold font-mono text-slate-900">
            {payload.targetThreshold !== null ? (
              `${payload.targetThreshold}%`
            ) : (
              <span className="text-xs font-medium text-amber-700">Unavailable</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400">
            {payload.targetThreshold !== null ? 'Configured Threshold' : 'Fallback Rule: 70%'}
          </span>
        </div>

        {/* Historical Attainment */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center gap-1">
            <Award className="h-3 w-3 text-slate-400" />
            Historical Attainment
          </span>
          <div className="text-sm font-bold font-mono text-slate-900">
            {payload.historicalAttainment !== null ? `${payload.historicalAttainment.toFixed(1)}%` : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-500">
            Across {payload.historicalAssessmentsUsed.join(', ') || 'none'}
          </span>
        </div>

        {/* Target Gap */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Attainment Gap</span>
          <div className={`text-sm font-bold font-mono ${
            payload.attainmentGap === null
              ? 'text-slate-500'
              : payload.attainmentGap < 0
              ? 'text-rose-600'
              : 'text-emerald-600'
          }`}>
            {payload.attainmentGap !== null
              ? `${payload.attainmentGap > 0 ? '+' : ''}${payload.attainmentGap.toFixed(1)}%`
              : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-500">
            {payload.attainmentGap !== null && payload.attainmentGap < 0 ? 'Deficit below target' : 'At or above target'}
          </span>
        </div>

        {/* Prediction Probability */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">P(Meets Target)</span>
          <div className="text-sm font-bold font-mono text-indigo-700">
            {payload.predictedProbability !== null ? `${payload.predictedProbability.toFixed(1)}%` : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-500">Module 3 Inference</span>
        </div>

        {/* Performance Trend */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Assessment Trajectory</span>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            {getTrendIcon(payload.performanceTrend)}
            <span>{payload.performanceTrend}</span>
          </div>
          <span className="text-[10px] text-slate-500">Chronological Delta</span>
        </div>
      </div>
    </div>
  );
};

