import React, { useState } from 'react';
import {
  ListChecks,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { PredictionResult } from '../../types/dataTypes';

interface PredictionTableProps {
  predictions: PredictionResult[];
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
  hasHistoricalData: boolean;
  targetThreshold: number | null;
}

export const PredictionTable: React.FC<PredictionTableProps> = ({
  predictions,
  selectedStudentId,
  onSelectStudent,
  hasHistoricalData,
  targetThreshold
}) => {
  const [sortField, setSortField] = useState<keyof PredictionResult | 'rollingCOAttainment'>('probabilityMeetingTarget');
  const [sortAsc, setSortAsc] = useState<boolean>(false); // default descending (highest probability or lowest first)
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  if (!hasHistoricalData) {
    return null;
  }

  if (targetThreshold === null) {
    return null;
  }

  const filteredPredictions = predictions.filter(p => {
    if (statusFilter === 'MET' && p.predictedStatus !== 'Likely to Meet Target') return false;
    if (statusFilter === 'BELOW' && p.predictedStatus !== 'Likely Below Target') return false;
    return true;
  });

  const sortedPredictions = [...filteredPredictions].sort((a, b) => {
    let aVal: any = a[sortField as keyof PredictionResult];
    let bVal: any = b[sortField as keyof PredictionResult];

    if (sortField === 'rollingCOAttainment') {
      aVal = a.features.rollingCOAttainment;
      bVal = b.features.rollingCOAttainment;
    }

    if (aVal === null || aVal === undefined) aVal = -Infinity;
    if (bVal === null || bVal === undefined) bVal = -Infinity;

    if (typeof aVal === 'string') {
      return sortAsc
        ? aVal.localeCompare(bVal, undefined, { numeric: true })
        : bVal.localeCompare(aVal, undefined, { numeric: true });
    }

    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field: keyof PredictionResult | 'rollingCOAttainment') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Student Prediction Roster
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {filteredPredictions.length} Students
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Select any student row to view factual historical assessment evidence in Section 4
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-500">Predicted Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs py-1 px-2 border border-slate-200 rounded-md bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Cohort ({predictions.length})</option>
            <option value="MET">Likely to Meet Target</option>
            <option value="BELOW">Likely Below Target (At-Risk)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-semibold border-y border-slate-200 uppercase tracking-wider text-[11px]">
              <th
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('studentId')}
              >
                <div className="flex items-center space-x-1">
                  <span>Student ID</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">Course</th>
              <th className="py-3 px-3">CO Target</th>
              <th className="py-3 px-3">Prediction Point</th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('rollingCOAttainment')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Historical Attainment</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Historical Trend</th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('probabilityMeetingTarget')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>P(Meets Target)</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Predicted Status</th>
              <th className="py-3 px-3 text-right">Target Threshold</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedPredictions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                  No prediction records match the active filter.
                </td>
              </tr>
            ) : (
              sortedPredictions.map((pred, idx) => {
                const isSelected = selectedStudentId === pred.studentId;
                const isMet = pred.predictedStatus === 'Likely to Meet Target';
                const trend = pred.features.performanceTrend;

                return (
                  <tr
                    key={pred.studentId}
                    onClick={() => onSelectStudent(pred.studentId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/80 border-l-4 border-indigo-600 font-medium'
                        : idx % 2 === 1
                        ? 'bg-slate-50/40 hover:bg-slate-100/60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {pred.studentId}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {pred.courseId}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] border border-indigo-100">
                        {pred.coId}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        Predict {pred.predictionAssessment}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800">
                      {pred.features.rollingCOAttainment.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {trend === 'Improving' && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <TrendingUp className="h-3 w-3" />
                          <span>Improving (+{pred.features.trendDelta.toFixed(1)}%)</span>
                        </span>
                      )}
                      {trend === 'Declining' && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <TrendingDown className="h-3 w-3" />
                          <span>Declining ({pred.features.trendDelta.toFixed(1)}%)</span>
                        </span>
                      )}
                      {trend === 'Stable' && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Minus className="h-3 w-3" />
                          <span>Stable</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={isMet ? 'text-emerald-700' : 'text-rose-600'}>
                        {pred.probabilityMeetingTarget.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isMet ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Likely to Meet</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Likely Below</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {pred.targetPct ? `${pred.targetPct.toFixed(1)}%` : 'N/A'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
        <div>
          Showing {sortedPredictions.length} of {predictions.length} evaluated students (Anonymized)
        </div>
        <div className="flex items-center space-x-3 mt-1 sm:mt-0">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Likely to Meet (P ≥ 50%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Likely Below (P &lt; 50%)
          </span>
        </div>
      </div>
    </div>
  );
};
