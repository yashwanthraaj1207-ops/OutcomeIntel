import React, { useState } from 'react';
import { FolderTree, ArrowUpDown, Filter, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TopicPerformanceItem } from '../../types/dataTypes';

interface TopicPerformanceBreakdownProps {
  topicItems: TopicPerformanceItem[];
}

export const TopicPerformanceBreakdown: React.FC<TopicPerformanceBreakdownProps> = ({ topicItems }) => {
  const [sortField, setSortField] = useState<keyof TopicPerformanceItem>('attainmentPct');
  const [sortAsc, setSortAsc] = useState<boolean>(true); // default lowest attainment first to surface weak topics
  const [selectedCOFilter, setSelectedCOFilter] = useState<string>('ALL');

  if (topicItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <FolderTree className="h-10 w-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No Topic Performance Records</h3>
        <p className="text-xs text-slate-400 mt-1">Select an active course scope with associated topics.</p>
      </div>
    );
  }

  // Derive distinct COs for local filter
  const distinctCOs = Array.from(new Set(topicItems.map(t => t.coId))).sort();

  const filteredTopics = topicItems.filter(item => {
    if (selectedCOFilter !== 'ALL' && item.coId !== selectedCOFilter) return false;
    return true;
  });

  const sortedTopics = [...filteredTopics].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (aVal === null || aVal === undefined) aVal = -Infinity;
    if (bVal === null || bVal === undefined) bVal = -Infinity;

    if (typeof aVal === 'string') {
      return sortAsc
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }

    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const handleSort = (field: keyof TopicPerformanceItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending on new metric
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
            <FolderTree className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              SECTION 4 — TOPIC-LEVEL SUPPORTING PERFORMANCE
            </h2>
            <p className="text-xs text-slate-500">
              Granular Topic → Course Outcome diagnostics identifying exact pedagogical strengths and learning deficits
            </p>
          </div>
        </div>

        {/* Local CO Filter Pill */}
        <div className="flex items-center space-x-2 self-start md:self-auto text-xs">
          <span className="text-slate-500 font-medium flex items-center">
            <Filter className="h-3 w-3 mr-1 text-slate-400" />
            Filter by CO:
          </span>
          <select
            value={selectedCOFilter}
            onChange={e => setSelectedCOFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 font-medium"
          >
            <option value="ALL">All COs ({distinctCOs.join(', ')})</option>
            {distinctCOs.map(co => (
              <option key={co} value={co}>
                {co}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Topics Table */}
      <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
            <tr>
              <th
                scope="col"
                onClick={() => handleSort('topic')}
                className="px-4 py-3 cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Curricular Topic</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-center">Course</th>
              <th
                scope="col"
                onClick={() => handleSort('coId')}
                className="px-4 py-3 text-center cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Mapped CO</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-center">Questions</th>
              <th scope="col" className="px-4 py-3 text-right">Observations</th>
              <th
                scope="col"
                onClick={() => handleSort('averageMarks')}
                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Avg Marks</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('attainmentPct')}
                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Attainment %</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-right">Target %</th>
              <th
                scope="col"
                onClick={() => handleSort('gapPct')}
                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Target Gap</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedTopics.map(item => {
              const isMet = item.status === 'Target Met';
              const isBelow = item.status === 'Below Target';

              return (
                <tr key={`${item.courseId}-${item.topic}-${item.coId}`} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                    {item.topic}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600 text-xs">
                    {item.courseId}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {item.coId}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-700">
                    {item.questionCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    {item.observationCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                    {item.averageMarks.toFixed(2)} <span className="text-slate-400 font-normal">/ {item.maxMarks}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                    <span className={item.attainmentPct < 60 ? 'text-rose-600' : 'text-slate-900'}>
                      {item.attainmentPct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {item.targetConfigured ? `${item.targetPct}%` : <span className="text-slate-400 italic">Not set</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">
                    {item.gapPct !== null ? (
                      <span className={item.gapPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {item.gapPct >= 0 ? `+${item.gapPct.toFixed(2)}%` : `${item.gapPct.toFixed(2)}%`}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isMet && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Target Met
                      </span>
                    )}
                    {isBelow && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertTriangle className="h-3 w-3 mr-1 text-rose-600" /> Below Target
                      </span>
                    )}
                    {!item.targetConfigured && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        No Target
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
