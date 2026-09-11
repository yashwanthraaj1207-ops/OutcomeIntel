import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Search
} from 'lucide-react';
import { RiskAssessment } from '../../types/dataTypes';

interface RiskStudentTableProps {
  assessments: RiskAssessment[];
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
  activeRiskFilter: string;
}

export const RiskStudentTable: React.FC<RiskStudentTableProps> = ({
  assessments,
  selectedStudentId,
  onSelectStudent,
  activeRiskFilter
}) => {
  const [sortField, setSortField] = useState<string>('priorityScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false); // default descending (highest urgency first)
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAssessments = assessments.filter(a => {
    if (activeRiskFilter === 'HIGH' && a.riskLevel !== 'HIGH RISK') return false;
    if (activeRiskFilter === 'MEDIUM' && a.riskLevel !== 'MEDIUM RISK') return false;
    if (activeRiskFilter === 'LOW' && a.riskLevel !== 'LOW RISK') return false;
    if (activeRiskFilter === 'INSUFFICIENT' && a.riskLevel !== 'INSUFFICIENT DATA') return false;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      return a.studentId.toLowerCase().includes(q);
    }
    return true;
  });

  const sortedAssessments = [...filteredAssessments].sort((a, b) => {
    let aVal: any = a[sortField as keyof RiskAssessment];
    let bVal: any = b[sortField as keyof RiskAssessment];

    if (sortField === 'predictedProbability') {
      aVal = a.features.predictedProbability ?? -Infinity;
      bVal = b.features.predictedProbability ?? -Infinity;
    } else if (sortField === 'historicalAttainment') {
      aVal = a.features.historicalAttainment ?? -Infinity;
      bVal = b.features.historicalAttainment ?? -Infinity;
    } else if (sortField === 'attainmentGap') {
      aVal = a.features.attainmentGap ?? -Infinity;
      bVal = b.features.attainmentGap ?? -Infinity;
    } else if (sortField === 'riskLevel') {
      const rankMap: Record<string, number> = {
        'HIGH RISK': 4,
        'MEDIUM RISK': 3,
        'LOW RISK': 2,
        'INSUFFICIENT DATA': 1
      };
      aVal = rankMap[a.riskLevel] || 0;
      bVal = rankMap[b.riskLevel] || 0;
    } else if (sortField === 'priorityScore') {
      aVal = a.priorityScore ?? -Infinity;
      bVal = b.priorityScore ?? -Infinity;
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for urgency/scores
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            Student Early-Warning Risk Roster
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredAssessments.length} Students
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Sorted by review urgency (Prototype Risk Priority Score). Click any row to inspect underlying risk factors in Section 5.
          </p>
        </div>

        {/* Search box */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Student ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-semibold border-y border-slate-200 uppercase tracking-wider text-[11px]">
              <th
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('priorityScore')}
              >
                <div className="flex items-center space-x-1">
                  <span>Priority</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('studentId')}
              >
                <div className="flex items-center space-x-1">
                  <span>Student ID</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">Course / CO</th>
              <th className="py-3 px-3">Horizon</th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('predictedProbability')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>P(Meets Target)</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('historicalAttainment')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Hist. Attainment</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('attainmentGap')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Gap (vs Target)</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Trend</th>
              <th
                className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('riskLevel')}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Risk Category</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedAssessments.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                  No student records match the active filter criteria.
                </td>
              </tr>
            ) : (
              sortedAssessments.map((item, idx) => {
                const isSelected = selectedStudentId === item.studentId;
                const isHigh = item.riskLevel === 'HIGH RISK';
                const isMed = item.riskLevel === 'MEDIUM RISK';
                const isLow = item.riskLevel === 'LOW RISK';
                const trend = item.features.performanceTrend;
                const gap = item.features.attainmentGap;

                return (
                  <tr
                    key={item.studentId}
                    onClick={() => onSelectStudent(item.studentId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-rose-50/80 border-l-4 border-rose-600 font-medium'
                        : idx % 2 === 1
                        ? 'bg-slate-50/40 hover:bg-slate-100/60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {item.priorityScore !== null ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.priorityScore >= 65
                              ? 'bg-rose-100 text-rose-800'
                              : item.priorityScore >= 35
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          #{item.priorityRank} ({item.priorityScore})
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {item.studentId}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-slate-700">{item.courseId}</span>{' '}
                      <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[10px] border border-indigo-100">
                        {item.coId}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      Predict {item.predictionAssessment}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {item.features.predictedProbability !== null ? (
                        <span
                          className={
                            item.features.predictedProbability < 40
                              ? 'text-rose-600'
                              : item.features.predictedProbability < 70
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }
                        >
                          {item.features.predictedProbability.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-medium">
                      {item.features.historicalAttainment !== null
                        ? `${item.features.historicalAttainment.toFixed(1)}%`
                        : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {gap !== null ? (
                        <span className={gap < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {gap >= 0 ? `+${gap.toFixed(1)}%` : `${gap.toFixed(1)}%`}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {trend === 'Improving' && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <TrendingUp className="h-3 w-3" />
                          <span>Improving</span>
                        </span>
                      )}
                      {trend === 'Declining' && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <TrendingDown className="h-3 w-3" />
                          <span>Declining</span>
                        </span>
                      )}
                      {trend === 'Stable' && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Minus className="h-3 w-3" />
                          <span>Stable</span>
                        </span>
                      )}
                      {trend === 'Insufficient History' && (
                        <span className="text-slate-400 text-[10px]">Baseline</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isHigh && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <ShieldAlert className="h-3 w-3" />
                          <span>HIGH RISK</span>
                        </span>
                      )}
                      {isMed && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle className="h-3 w-3" />
                          <span>MEDIUM RISK</span>
                        </span>
                      )}
                      {isLow && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>LOW RISK</span>
                        </span>
                      )}
                      {item.riskLevel === 'INSUFFICIENT DATA' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <HelpCircle className="h-3 w-3" />
                          <span>INSUFFICIENT DATA</span>
                        </span>
                      )}
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
          Showing {sortedAssessments.length} of {assessments.length} students (Anonymized Roster)
        </div>
        <div className="flex items-center space-x-3 mt-1 sm:mt-0">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> High (Priority &ge; 65)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium (35 &ndash; 64)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low (&lt; 35)
          </span>
        </div>
      </div>
    </div>
  );
};

