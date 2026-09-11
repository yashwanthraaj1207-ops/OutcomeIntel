/**
 * OutcomeIntel Historical Visualization Suite
 *
 * Lightweight, high-fidelity responsive SVG and Tailwind visual charts.
 * Supports tooltips, legends, clear axis labels, percentage formatting,
 * and explicit missing-data handling ("Data not available" — never 0%).
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  PieChart,
  Target,
  HelpCircle,
  Activity
} from 'lucide-react';
import { HistoryRun } from '../../types/historyTypes';

interface ChartProps {
  runs: HistoryRun[];
  selectedCO?: string;
}

/**
 * 1. CO Attainment Trend (Timeline across historical runs)
 */
export const COAttainmentTrendChart: React.FC<ChartProps> = ({ runs, selectedCO = 'CO1' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Chronological order (oldest to newest)
  const sortedRuns = [...runs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (sortedRuns.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <HelpCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-600">No historical runs available for trend visualization</p>
      </div>
    );
  }

  // Extract points for selected CO
  const dataPoints = sortedRuns.map(r => {
    const co = r.coSummaries.find(c => c.coId === selectedCO);
    return {
      runId: r.runId,
      date: new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      attainment: co?.attainmentPct ?? null,
      target: co?.targetThreshold ?? 70.0
    };
  });

  const chartHeight = 180;
  const chartWidth = 500;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const validPoints = dataPoints.filter(d => d.attainment !== null);

  const getX = (index: number) => {
    if (dataPoints.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (dataPoints.length - 1)) * innerWidth;
  };

  const getY = (val: number | null) => {
    if (val === null) return padding.top + innerHeight;
    const clamped = Math.max(0, Math.min(100, val));
    return padding.top + innerHeight - (clamped / 100) * innerHeight;
  };

  // Build SVG path
  let pathD = '';
  validPoints.forEach((p, idx) => {
    const origIdx = dataPoints.findIndex(dp => dp.runId === p.runId);
    const x = getX(origIdx);
    const y = getY(p.attainment);
    if (idx === 0) pathD += `M ${x} ${y}`;
    else pathD += ` L ${x} ${y}`;
  });

  const targetY = getY(dataPoints[0]?.target ?? 70);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              Longitudinal Attainment Trend: <span className="text-indigo-600">{selectedCO}</span>
            </h4>
            <p className="text-[11px] text-slate-500">Historical performance trajectory across saved analysis runs</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <div className="flex items-center space-x-1 text-indigo-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
            <span>Observed Attainment</span>
          </div>
          <div className="flex items-center space-x-1 text-rose-500 font-semibold">
            <span className="w-3 h-0.5 border-t border-dashed border-rose-500 inline-block" />
            <span>Target Benchmark ({dataPoints[0]?.target ?? 70}%)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(val => {
            const y = getY(val);
            return (
              <g key={val}>
                <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Benchmark Target Line */}
          <line
            x1={padding.left}
            y1={targetY}
            x2={chartWidth - padding.right}
            y2={targetY}
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Trend Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points & Hover targets */}
          {dataPoints.map((dp, idx) => {
            const x = getX(idx);
            const y = getY(dp.attainment);
            const isHovered = hoveredIdx === idx;

            if (dp.attainment === null) {
              return (
                <g key={dp.runId}>
                  <circle cx={x} cy={padding.top + innerHeight} r="3" fill="#cbd5e1" />
                  <text x={x} y={padding.top + innerHeight - 6} textAnchor="middle" fontSize="8" fill="#94a3b8">
                    N/A
                  </text>
                  <text x={x} y={chartHeight - padding.bottom + 15} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">
                    {dp.date}
                  </text>
                </g>
              );
            }

            return (
              <g key={dp.runId} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke="#4f46e5"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all"
                />
                <text x={x} y={chartHeight - padding.bottom + 15} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">
                  {dp.date}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && dataPoints[hoveredIdx] && (
          <div
            className="absolute top-2 right-4 bg-slate-900 text-white text-[11px] rounded-lg p-2.5 shadow-xl border border-slate-800 pointer-events-none z-10 space-y-1"
          >
            <div className="font-mono text-indigo-300 font-bold">{dataPoints[hoveredIdx].runId}</div>
            <div>Date: <span className="text-slate-300">{dataPoints[hoveredIdx].date}</span></div>
            <div>
              Attainment: {' '}
              {dataPoints[hoveredIdx].attainment !== null ? (
                <span className="font-bold text-emerald-400">{dataPoints[hoveredIdx].attainment?.toFixed(1)}%</span>
              ) : (
                <span className="text-amber-400 font-medium">Data not available</span>
              )}
            </div>
            <div>Target Benchmark: <span className="font-mono text-slate-300">{dataPoints[hoveredIdx].target}%</span></div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 2. CO Attainment vs Target Comparison (Bar Chart)
 */
export const COVsTargetBarChart: React.FC<{ run: HistoryRun }> = ({ run }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Course Outcome Attainment vs Target</h4>
            <p className="text-[11px] text-slate-500">Run: {run.runId} • {run.courseId}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {run.coSummaries.map(co => {
          const hasAttainment = co.attainmentPct !== null;
          const target = co.targetThreshold ?? 70.0;
          const attain = hasAttainment ? co.attainmentPct! : 0;
          const isMet = hasAttainment && attain >= target;

          return (
            <div key={co.coId} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 font-mono">{co.coId}</span>
                <div className="flex items-center space-x-2 text-[11px]">
                  {hasAttainment ? (
                    <>
                      <span className={`font-bold ${isMet ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {attain.toFixed(1)}%
                      </span>
                      <span className="text-slate-400 font-mono">/ Target: {target}%</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        isMet ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {co.gapPct !== null ? `${co.gapPct >= 0 ? '+' : ''}${co.gapPct.toFixed(1)} pp` : ''}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 italic">Data not available</span>
                  )}
                </div>
              </div>

              {hasAttainment ? (
                <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/60">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isMet ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(Math.max(attain, 0), 100)}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                    style={{ left: `${Math.min(Math.max(target, 0), 100)}%` }}
                    title={`Target: ${target}%`}
                  />
                </div>
              ) : (
                <div className="h-3.5 w-full bg-slate-50 border border-dashed border-slate-200 rounded-full flex items-center justify-center text-[10px] text-slate-400">
                  Pending evaluation
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 3. Risk Stratification Distribution (Stacked Cohort Bar)
 */
export const RiskDistributionTrendChart: React.FC<{ runs: HistoryRun[] }> = ({ runs }) => {
  const sortedRuns = [...runs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).slice(-6);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
            <PieChart className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Cohort Risk Distribution Proportions</h4>
            <p className="text-[11px] text-slate-500">Longitudinal triage breakdown across recent historical runs</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-rose-600"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> High</span>
          <span className="flex items-center gap-1 text-amber-600"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> Medium</span>
          <span className="flex items-center gap-1 text-emerald-600"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Low</span>
        </div>
      </div>

      <div className="space-y-3">
        {sortedRuns.map(run => {
          const r = run.riskSummary;
          const total = r.totalStudents || 1;
          const highW = (r.highRiskCount / total) * 100;
          const medW = (r.mediumRiskCount / total) * 100;
          const lowW = (r.lowRiskCount / total) * 100;

          return (
            <div key={run.runId} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="font-mono font-bold text-slate-700">{run.runId}</span>
                <span className="text-slate-500 text-[10px]">
                  N = {r.totalStudents} ({run.courseId})
                </span>
              </div>
              <div className="h-5 w-full bg-slate-100 rounded-lg overflow-hidden flex border border-slate-200/60 shadow-inner">
                {highW > 0 && (
                  <div
                    style={{ width: `${highW}%` }}
                    className="bg-rose-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                    title={`High Risk: ${r.highRiskCount} (${highW.toFixed(1)}%)`}
                  >
                    {highW >= 12 ? `${r.highRiskCount}` : ''}
                  </div>
                )}
                {medW > 0 && (
                  <div
                    style={{ width: `${medW}%` }}
                    className="bg-amber-400 h-full flex items-center justify-center text-[10px] font-bold text-slate-900 transition-all"
                    title={`Medium Risk: ${r.mediumRiskCount} (${medW.toFixed(1)}%)`}
                  >
                    {medW >= 12 ? `${r.mediumRiskCount}` : ''}
                  </div>
                )}
                {lowW > 0 && (
                  <div
                    style={{ width: `${lowW}%` }}
                    className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                    title={`Low Risk: ${r.lowRiskCount} (${lowW.toFixed(1)}%)`}
                  >
                    {lowW >= 12 ? `${r.lowRiskCount}` : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 4. Learning Gain & Closed-Loop Outcomes Chart
 */
export const LearningGainOverviewChart: React.FC<{ run: HistoryRun }> = ({ run }) => {
  const g = run.reassessmentSummary;
  const hasReassessment = g.totalWithReassessment > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Observed Learning Gain Distribution</h4>
            <p className="text-[11px] text-slate-500">Run: {run.runId} • Post-Intervention Reassessment</p>
          </div>
        </div>
      </div>

      {!hasReassessment ? (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-xs font-semibold text-slate-600">No post-intervention reassessment records in this snapshot</p>
          <p className="text-[11px] text-slate-400 mt-1">Reassessment evaluation occurs in Module 7 before snapshot archiving.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div className="text-base font-black text-emerald-700">{g.targetAchievedCount}</div>
            <div className="text-[10px] uppercase font-bold text-emerald-800 mt-0.5">Target Achieved</div>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
            <div className="text-base font-black text-indigo-700">{g.positiveGainCount}</div>
            <div className="text-[10px] uppercase font-bold text-indigo-800 mt-0.5">Positive Gain</div>
          </div>
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl">
            <div className="text-base font-black text-slate-700">{g.noMeasurableGainCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-600 mt-0.5">No Gain</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="text-base font-black text-amber-700">{g.negativeChangeCount}</div>
            <div className="text-[10px] uppercase font-bold text-amber-800 mt-0.5">Negative Change</div>
          </div>
        </div>
      )}
    </div>
  );
};
