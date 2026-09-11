import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Trash2,
  GitCompare,
  Eye,
  FileSpreadsheet,
  FileCode,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { HistoryRun } from '../types/historyTypes';
import {
  getAllRuns,
  deleteRun,
  exportRunAsJSON,
  exportRunAsCSV
} from '../services/historyService';
import { useToast } from './common/Toast';

interface HistoryDashboardProps {
  onNavigateToComparison: (runAId: string, runBId: string) => void;
  onViewRunDetail: (run: HistoryRun) => void;
  onBackToPipeline: () => void;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({
  onNavigateToComparison,
  onViewRunDetail,
  onBackToPipeline
}) => {
  const { showSuccess, showError } = useToast();
  const [runs, setRuns] = useState<HistoryRun[]>(() => getAllRuns());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [selectedDataType, setSelectedDataType] = useState<string>('ALL');
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const refreshRuns = () => {
    setRuns(getAllRuns());
  };

  // Available filter options
  const availableCourses = useMemo(() => {
    const courses = Array.from(new Set(runs.map(r => r.courseId))).filter(Boolean);
    return ['ALL', ...courses];
  }, [runs]);

  // Filtered runs
  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      // Course filter
      if (selectedCourse !== 'ALL' && run.courseId !== selectedCourse) {
        return false;
      }
      // Data type filter
      if (selectedDataType !== 'ALL' && run.dataType !== selectedDataType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRunId = run.runId.toLowerCase().includes(q);
        const matchesCourse = run.courseId.toLowerCase().includes(q) || run.courseName.toLowerCase().includes(q);
        const matchesSemester = run.semester.toString().toLowerCase().includes(q);
        const matchesDataset = run.datasetName.toLowerCase().includes(q);
        if (!matchesRunId && !matchesCourse && !matchesSemester && !matchesDataset) {
          return false;
        }
      }
      return true;
    });
  }, [runs, selectedCourse, selectedDataType, searchQuery]);

  // Handle selection for comparison (maximum 2)
  const handleToggleSelect = (runId: string) => {
    setSelectedRunIds(prev => {
      if (prev.includes(runId)) {
        return prev.filter(id => id !== runId);
      }
      if (prev.length >= 2) {
        // Replace second one
        return [prev[0], runId];
      }
      return [...prev, runId];
    });
  };

  const handleLaunchComparison = () => {
    if (selectedRunIds.length === 2) {
      onNavigateToComparison(selectedRunIds[0], selectedRunIds[1]);
    }
  };

  const handleDelete = (runId: string) => {
    const success = deleteRun(runId);
    if (success) {
      setDeleteConfirmId(null);
      setSelectedRunIds(prev => prev.filter(id => id !== runId));
      refreshRuns();
      showSuccess(`Snapshot ${runId} was removed from history archive.`);
    }
  };

  // Trigger file download helper
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = (runId: string) => {
    try {
      const jsonStr = exportRunAsJSON(runId);
      triggerDownload(jsonStr, `${runId}-outcomeintel-snapshot.json`, 'application/json');
      showSuccess(`Downloaded JSON snapshot for ${runId}.`);
    } catch (err: any) {
      showError(`Export failed: ${err.message}`);
    }
  };

  const handleDownloadCSV = (runId: string) => {
    try {
      const csvStr = exportRunAsCSV(runId);
      triggerDownload(csvStr, `${runId}-outcomeintel-analysis.csv`, 'text/csv;charset=utf-8;');
      showSuccess(`Downloaded CSV analytical dataset for ${runId}.`);
    } catch (err: any) {
      showError(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-md">
              <History className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Analysis Run History & Institutional Archive
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  {runs.length} Saved Snapshots
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Immutable record repository for Course Outcome assessments, risk triage, and longitudinal evaluations.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {selectedRunIds.length === 2 && (
              <button
                type="button"
                onClick={handleLaunchComparison}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer transition"
              >
                <GitCompare className="h-4 w-4" />
                <span>Compare Selected (2)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBackToPipeline}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition"
            >
              <span>Back to Active Pipeline</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 animate-fade-in">

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Run ID, Course ID, Semester, or Dataset..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Course Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-600 shrink-0">Course:</label>
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableCourses.map(c => (
                  <option key={c} value={c}>{c === 'ALL' ? 'All Courses' : c}</option>
                ))}
              </select>
            </div>

            {/* Data Type Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-600 shrink-0">Data Classification:</label>
              <select
                value={selectedDataType}
                onChange={e => setSelectedDataType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Classifications</option>
                <option value="SYNTHETIC_DEMONSTRATION">Synthetic Demonstration</option>
                <option value="UPLOADED">Uploaded / Real Records</option>
              </select>
            </div>
          </div>

          {/* Selection Hint */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>
              Showing {filteredRuns.length} of {runs.length} historical runs
            </span>
            <span className="font-medium text-indigo-600">
              Select any 2 runs using checkboxes to trigger cross-run comparison
            </span>
          </div>
        </div>

        {/* Runs Table */}
        {filteredRuns.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center space-y-3">
            <HelpCircle className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Historical Runs Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {runs.length === 0
                ? 'Generate a report in Module 8 and click "Save Report to History" to create your first immutable snapshot.'
                : 'No historical runs match the current search or filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-10 text-center">Select</th>
                    <th className="py-3 px-4">Run ID</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-3 text-center">Semester</th>
                    <th className="py-3 px-4">Dataset</th>
                    <th className="py-3 px-4">Attainment</th>
                    <th className="py-3 px-4 text-center">Risk</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRuns.map(run => {
                    const isSelected = selectedRunIds.includes(run.runId);
                    const isSynthetic = run.dataType === 'SYNTHETIC_DEMONSTRATION';

                    return (
                      <tr key={run.runId} className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(run.runId)}
                            title="Select for comparison"
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                          />
                        </td>

                        {/* Run ID */}
                        <td className="py-3 px-4 font-mono">
                          <span className="font-bold text-slate-900 text-xs">{run.runId}</span>
                        </td>

                        {/* Course */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 font-mono text-xs">{run.courseId}</span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[140px]">{run.courseName}</span>
                        </td>

                        {/* Semester */}
                        <td className="py-3 px-3 text-center font-mono text-slate-700">
                          Sem {run.semester}
                        </td>

                        {/* Dataset */}
                        <td className="py-3 px-4">
                          <div className="text-xs text-slate-800 truncate max-w-[160px] font-medium">{run.datasetName}</div>
                          {isSynthetic ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 mt-0.5">
                              Synthetic Demonstration
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 mt-0.5">
                              Uploaded Dataset
                            </span>
                          )}
                        </td>

                        {/* Attainment */}
                        <td className="py-3 px-4 font-mono">
                          {run.reportSummary.overallAttainmentPct !== null ? (
                            <div>
                              <span className="font-bold text-slate-900 text-xs">
                                {run.reportSummary.overallAttainmentPct.toFixed(1)}%
                              </span>
                              <span className={`text-[10px] block font-sans ${
                                (run.reportSummary.overallTargetGapPp || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                Gap: {(run.reportSummary.overallTargetGapPp || 0) >= 0 ? '+' : ''}
                                {run.reportSummary.overallTargetGapPp?.toFixed(1)} pp
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Pending</span>
                          )}
                        </td>

                        {/* Risk */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center space-x-1 font-mono text-[11px]">
                            <span className="text-rose-600 font-bold" title="High Risk">H:{run.riskSummary.highRiskCount}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-amber-600 font-medium" title="Medium Risk">M:{run.riskSummary.mediumRiskCount}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-emerald-600 font-medium" title="Low Risk">L:{run.riskSummary.lowRiskCount}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {new Date(run.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {/* View */}
                            <button
                              type="button"
                              onClick={() => onViewRunDetail(run)}
                              title="View"
                              aria-label={`View ${run.runId}`}
                              className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Compare */}
                            <button
                              type="button"
                              onClick={() => {
                                handleToggleSelect(run.runId);
                                if (selectedRunIds.length === 1 && !selectedRunIds.includes(run.runId)) {
                                  onNavigateToComparison(selectedRunIds[0], run.runId);
                                }
                              }}
                              title="Compare"
                              aria-label={`Compare ${run.runId}`}
                              className={`h-8 w-8 rounded-lg inline-flex items-center justify-center transition cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                              }`}
                            >
                              <GitCompare className="h-4 w-4" />
                            </button>

                            {/* Download JSON */}
                            <button
                              type="button"
                              onClick={() => handleDownloadJSON(run.runId)}
                              title="Download JSON"
                              aria-label={`Download JSON for ${run.runId}`}
                              className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                            >
                              <FileCode className="h-4 w-4" />
                            </button>

                            {/* Download CSV */}
                            <button
                              type="button"
                              onClick={() => handleDownloadCSV(run.runId)}
                              title="Download CSV"
                              aria-label={`Download CSV for ${run.runId}`}
                              className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </button>

                            {/* Delete */}
                            {deleteConfirmId === run.runId ? (
                              <div className="inline-flex items-center space-x-1 bg-rose-50 border border-rose-200 p-1 rounded-lg">
                                <span className="text-[10px] text-rose-700 font-bold">Delete?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(run.runId)}
                                  className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold cursor-pointer"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="text-[10px] text-slate-600 px-1 py-0.5 cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(run.runId)}
                                title="Delete"
                                aria-label={`Delete ${run.runId}`}
                                className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
