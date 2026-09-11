import React, { useState, useMemo } from 'react';
import {
  GitCompare,
  ArrowLeft,
  ShieldAlert,
  Target,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { getAllRuns } from '../services/historyService';
import {
  buildHistoricalComparison,
  HistoricalComparisonReport
} from '../services/comparisonEngine';

interface HistoryComparisonProps {
  initialRunAId?: string;
  initialRunBId?: string;
  onBackToHistory: () => void;
}

export const HistoryComparison: React.FC<HistoryComparisonProps> = ({
  initialRunAId,
  initialRunBId,
  onBackToHistory
}) => {
  const runs = useMemo(() => getAllRuns(), []);

  const [baselineRunId, setBaselineRunId] = useState<string>(
    initialRunAId || (runs.length >= 2 ? runs[1].runId : runs[0]?.runId || '')
  );
  const [comparisonRunId, setComparisonRunId] = useState<string>(
    initialRunBId || (runs.length >= 1 ? runs[0].runId : '')
  );

  const baselineRun = useMemo(() => runs.find(r => r.runId === baselineRunId), [runs, baselineRunId]);
  const comparisonRun = useMemo(() => runs.find(r => r.runId === comparisonRunId), [runs, comparisonRunId]);

  const comparisonReport: HistoricalComparisonReport | null = useMemo(() => {
    if (!baselineRun || !comparisonRun) return null;
    return buildHistoricalComparison(baselineRun, comparisonRun);
  }, [baselineRun, comparisonRun]);

  if (runs.length < 2) {
    return (
      <div className="min-h-screen bg-slate-100/70 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-md space-y-4">
          <GitCompare className="h-12 w-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Insufficient Snapshots for Comparison</h2>
          <p className="text-xs text-slate-500">
            At least two historical analysis runs are required to perform a cross-run longitudinal comparison.
          </p>
          <button
            type="button"
            onClick={onBackToHistory}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Back to History Archive
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20">
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToHistory}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Back to History"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Cross-Run Longitudinal Comparison
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Deterministic Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mathematical delta analysis comparing baseline and comparison analysis cycles.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300">
            <Info className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>Deltas strictly distinguish percentage points (pp) from percentage change (%).</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 animate-fade-in">
        {/* Run Selector Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Comparison Runs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline Run Selector */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
                <span>Baseline Run (Earlier Milestone)</span>
              </label>
              <select
                value={baselineRunId}
                onChange={e => setBaselineRunId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {runs.map(r => (
                  <option key={r.runId} value={r.runId}>
                    {r.runId} • {r.courseId} (Sem {r.semester}) • {new Date(r.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {baselineRun && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Classification: {baselineRun.dataType === 'SYNTHETIC_DEMONSTRATION' ? 'Synthetic Demo' : 'Uploaded'}</span>
                  <span>Cohort: N = {baselineRun.totalStudents}</span>
                </div>
              )}
            </div>

            {/* Comparison Run Selector */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
              <label className="text-xs font-bold text-indigo-900 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                <span>Comparison Run (Later Milestone / Reassessment)</span>
              </label>
              <select
                value={comparisonRunId}
                onChange={e => setComparisonRunId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {runs.map(r => (
                  <option key={r.runId} value={r.runId}>
                    {r.runId} • {r.courseId} (Sem {r.semester}) • {new Date(r.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {comparisonRun && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Classification: {comparisonRun.dataType === 'SYNTHETIC_DEMONSTRATION' ? 'Synthetic Demo' : 'Uploaded'}</span>
                  <span>Cohort: N = {comparisonRun.totalStudents}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {comparisonReport && (
          <>
            {/* Deterministic Insights Banner */}
            {comparisonReport.observations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-3">
                <div className="flex items-center space-x-2">
                  <GitCompare className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Deterministic Longitudinal Observations
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {comparisonReport.observations.map(obs => (
                    <div
                      key={obs.id}
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 ${
                        obs.category === 'POSITIVE'
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        {obs.category === 'POSITIVE' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        )}
                        <span>{obs.title}</span>
                      </div>
                      <p className="text-[11px] font-medium">{obs.statement}</p>
                      <div className="text-[10px] text-slate-500 font-mono">Basis: {obs.metricBasis}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* High-Level Delta Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Mean Attainment Shift
                </div>
                <div className="text-2xl font-black font-mono flex items-center space-x-2">
                  <span className={
                    (comparisonReport.summary.meanAttainmentDeltaPp || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }>
                    {(comparisonReport.summary.meanAttainmentDeltaPp || 0) >= 0 ? '+' : ''}
                    {comparisonReport.summary.meanAttainmentDeltaPp?.toFixed(1) ?? 'N/A'} pp
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Mean percentage-point delta across all evaluated COs</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  High-Risk Cohort Delta
                </div>
                <div className="text-2xl font-black font-mono flex items-center space-x-2">
                  <span className={
                    comparisonReport.summary.highRiskStudentDelta <= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }>
                    {comparisonReport.summary.highRiskStudentDelta > 0 ? '+' : ''}
                    {comparisonReport.summary.highRiskStudentDelta} Students
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {comparisonReport.summary.highRiskStudentDelta <= 0 ? 'Contraction in high-risk count' : 'Increase in high-risk students'}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  CO Attainment Trajectory
                </div>
                <div className="text-2xl font-black font-mono text-indigo-600">
                  {comparisonReport.summary.improvingCOCount} Improving / {comparisonReport.summary.decliningCOCount} Declining
                </div>
                <p className="text-[10px] text-slate-400">
                  {comparisonReport.summary.stableCOCount} COs remained stable (within ±0.1 pp)
                </p>
              </div>
            </div>

            {/* Course Outcome Detailed Delta Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Course Outcome Attainment & Benchmark Deltas
                  </h3>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {baselineRun?.runId} vs {comparisonRun?.runId}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">CO ID</th>
                      <th className="py-3 px-4 text-right">Target</th>
                      <th className="py-3 px-4 text-right">Baseline Attain</th>
                      <th className="py-3 px-4 text-right">Comparison Attain</th>
                      <th className="py-3 px-4 text-right">Delta (pp)</th>
                      <th className="py-3 px-4 text-right">% Change</th>
                      <th className="py-3 px-4">Status Shift</th>
                      <th className="py-3 px-4">Factual Observation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {comparisonReport.coComparisons.map(co => {
                      const pp = co.attainment.deltaPercentagePoints;
                      const pctChange = co.attainment.percentageChange;
                      const isPositive = pp !== null && pp > 0;
                      const isZero = pp !== null && Math.abs(pp) < 0.05;

                      return (
                        <tr key={co.coId} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{co.coId}</td>
                          <td className="py-3 px-4 text-right text-slate-500">
                            {co.targetThreshold !== null ? `${co.targetThreshold}%` : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700">
                            {co.attainment.baselineValue !== null ? `${co.attainment.baselineValue.toFixed(1)}%` : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {co.attainment.comparisonValue !== null ? `${co.attainment.comparisonValue.toFixed(1)}%` : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            {pp !== null ? (
                              <span className={isZero ? 'text-slate-600' : isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                                {pp >= 0 ? '+' : ''}{pp.toFixed(1)} pp
                              </span>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                            {pctChange !== null ? (
                              <span>{pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%</span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              co.statusChange === 'MET_TARGET' || co.statusChange === 'MAINTAINED_TARGET'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {co.statusChange.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-600 text-[11px] max-w-xs">
                            {co.observation}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk Stratification Delta Matrix */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Risk Stratification Cohort Shifts</h3>
                  <p className="text-xs text-slate-500">{comparisonReport.riskComparison.overallShiftObservation}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-center">
                <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-rose-800">High Risk Tier</div>
                  <div className="text-lg font-bold text-rose-900">
                    {comparisonReport.riskComparison.highRiskCount.baselineValue} → {comparisonReport.riskComparison.highRiskCount.comparisonValue}
                  </div>
                  <div className="text-xs font-bold text-rose-700">
                    Delta: {comparisonReport.riskComparison.highRiskCount.deltaAbsolute && comparisonReport.riskComparison.highRiskCount.deltaAbsolute > 0 ? '+' : ''}
                    {comparisonReport.riskComparison.highRiskCount.deltaAbsolute} students ({comparisonReport.riskComparison.highRiskPct.deltaPercentagePoints && comparisonReport.riskComparison.highRiskPct.deltaPercentagePoints > 0 ? '+' : ''}
                    {comparisonReport.riskComparison.highRiskPct.deltaPercentagePoints?.toFixed(1)} pp)
                  </div>
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-800">Medium Risk Tier</div>
                  <div className="text-lg font-bold text-amber-900">
                    {comparisonReport.riskComparison.mediumRiskCount.baselineValue} → {comparisonReport.riskComparison.mediumRiskCount.comparisonValue}
                  </div>
                  <div className="text-xs font-bold text-amber-700">
                    Delta: {comparisonReport.riskComparison.mediumRiskCount.deltaAbsolute && comparisonReport.riskComparison.mediumRiskCount.deltaAbsolute > 0 ? '+' : ''}
                    {comparisonReport.riskComparison.mediumRiskCount.deltaAbsolute} students ({comparisonReport.riskComparison.mediumRiskPct.deltaPercentagePoints && comparisonReport.riskComparison.mediumRiskPct.deltaPercentagePoints > 0 ? '+' : ''}
                    {comparisonReport.riskComparison.mediumRiskPct.deltaPercentagePoints?.toFixed(1)} pp)
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">Low Risk Tier</div>
                  <div className="text-lg font-bold text-emerald-900">
                    {comparisonReport.riskComparison.lowRiskCount.baselineValue} → {comparisonReport.riskComparison.lowRiskCount.comparisonValue}
                  </div>
                  <div className="text-xs font-bold text-emerald-700">
                    Delta: {comparisonReport.riskComparison.lowRiskCount.deltaAbsolute && comparisonReport.riskComparison.lowRiskCount.deltaAbsolute > 0 ? '+' : ''}
                    {comparisonReport.riskComparison.lowRiskCount.deltaAbsolute} students ({comparisonReport.riskComparison.lowRiskPct.deltaPercentagePoints && comparisonReport.riskComparison.lowRiskPct.deltaPercentagePoints > 0 ? '+' : ''}
                    {comparisonReport.riskComparison.lowRiskPct.deltaPercentagePoints?.toFixed(1)} pp)
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
