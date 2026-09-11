import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Target,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Award
} from 'lucide-react';
import { getAllRuns } from '../../services/historyService';
import {
  COAttainmentTrendChart,
  COVsTargetBarChart,
  RiskDistributionTrendChart,
  LearningGainOverviewChart
} from './HistoricalVisualization';

interface HistoricalAnalyticsDashboardProps {
  onBackToPipeline: () => void;
  onNavigateToHistory: () => void;
  onNavigateToComparison?: (runAId: string, runBId: string) => void;
}

export const HistoricalAnalyticsDashboard: React.FC<HistoricalAnalyticsDashboardProps> = ({
  onBackToPipeline,
  onNavigateToHistory,
  onNavigateToComparison
}) => {
  const allRuns = useMemo(() => getAllRuns(), []);
  const [filterScope, setFilterScope] = useState<'LAST_5' | 'ALL'>('LAST_5');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [selectedCO, setSelectedCO] = useState<string>('CO1');

  // Available courses
  const availableCourses = useMemo(() => {
    const courses = Array.from(new Set(allRuns.map(r => r.courseId))).filter(Boolean);
    return ['ALL', ...courses];
  }, [allRuns]);

  // Available COs
  const availableCOs = useMemo(() => {
    const cos = new Set<string>();
    allRuns.forEach(r => r.coSummaries.forEach(c => cos.add(c.coId)));
    return Array.from(cos).sort();
  }, [allRuns]);

  // Filtered runs based on scope and course
  const displayedRuns = useMemo(() => {
    let filtered = [...allRuns];
    if (selectedCourse !== 'ALL') {
      filtered = filtered.filter(r => r.courseId === selectedCourse);
    }
    // Sort chronologically (oldest to newest)
    filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (filterScope === 'LAST_5') {
      filtered = filtered.slice(-5);
    }
    return filtered;
  }, [allRuns, selectedCourse, filterScope]);

  const latestRun = displayedRuns.length > 0 ? displayedRuns[displayedRuns.length - 1] : null;

  // Insight calculations across displayed runs
  const insightMetrics = useMemo(() => {
    if (!latestRun) return null;

    const validCOs = latestRun.coSummaries.filter(c => c.attainmentPct !== null);
    const meetingTargetCOs = validCOs.filter(c => c.gapPct !== null && c.gapPct >= 0);
    const belowTargetCOs = validCOs.filter(c => c.gapPct !== null && c.gapPct < 0);

    const overallAttain = latestRun.reportSummary.overallAttainmentPct;
    const highRiskPct = latestRun.riskSummary.highRiskPct;
    const meanGain = latestRun.reassessmentSummary.meanAbsoluteGainPp;

    return {
      meetingCount: meetingTargetCOs.length,
      belowCount: belowTargetCOs.length,
      belowNames: belowTargetCOs.map(c => c.coId),
      overallAttain,
      highRiskPct,
      meanGain
    };
  }, [latestRun]);

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-md">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Longitudinal Analytics & Accreditation Intelligence
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  {displayedRuns.length} Active Runs
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-cycle Course Outcome progression trends, risk distribution trajectories, and learning gains.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {onNavigateToComparison && displayedRuns.length >= 2 && (
              <button
                type="button"
                onClick={() => onNavigateToComparison(displayedRuns[displayedRuns.length - 2].runId, displayedRuns[displayedRuns.length - 1].runId)}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition"
              >
                <span>Compare Latest 2 Runs</span>
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition"
            >
              <span>View History Archive</span>
            </button>
            <button
              type="button"
              onClick={onBackToPipeline}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer transition"
            >
              <span>Back to Active Pipeline</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 animate-fade-in">
        {/* Scope & Filter Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterScope('LAST_5')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterScope === 'LAST_5' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 5 Runs
              </button>
              <button
                type="button"
                onClick={() => setFilterScope('ALL')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterScope === 'ALL' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Available Runs
              </button>
            </div>

            {/* Course Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-600">Course:</label>
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableCourses.map(c => (
                  <option key={c} value={c}>{c === 'ALL' ? 'All Courses' : c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CO Focus Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-600">Focus CO:</label>
            <div className="flex items-center space-x-1">
              {(availableCOs.length > 0 ? availableCOs : ['CO1', 'CO2', 'CO3', 'CO4', 'CO5']).map(co => (
                <button
                  key={co}
                  type="button"
                  onClick={() => setSelectedCO(co)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                    selectedCO === co
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {co}
                </button>
              ))}
            </div>
          </div>
        </div>

        {allRuns.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Historical Analytics Data</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Save analysis snapshots from Module 8 to populate multi-cycle progression charts, risk triage trends, and institutional learning gains.
            </p>
          </div>
        ) : (
          <>
            {/* Academic Insight Cards */}
            {insightMetrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Latest Attainment */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Latest Mean Attainment</span>
                    <Award className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900">
                    {insightMetrics.overallAttain !== null ? `${insightMetrics.overallAttain.toFixed(1)}%` : 'N/A'}
                  </div>
                  <p className="text-[10px] text-slate-400">Evaluated across all active course outcomes</p>
                </div>

                {/* Target Met vs Below */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Target Attainment Status</span>
                    <Target className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-600">
                    {insightMetrics.meetingCount} Met / <span className="text-rose-600">{insightMetrics.belowCount} Below</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {insightMetrics.belowCount > 0 ? `Attention: ${insightMetrics.belowNames.join(', ')}` : 'All targets achieved'}
                  </p>
                </div>

                {/* High Risk Proportion */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Cohort High Risk Tier</span>
                    <ShieldCheck className="h-4 w-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-black font-mono text-rose-600">
                    {insightMetrics.highRiskPct.toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-slate-400">Flagged by empirical Logistic Regression model</p>
                </div>

                {/* Observed Learning Gain */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Mean Learning Gain</span>
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black font-mono text-indigo-600">
                    {insightMetrics.meanGain !== null ? `+${insightMetrics.meanGain.toFixed(1)} pp` : 'Pending'}
                  </div>
                  <p className="text-[10px] text-slate-400">Measured from post-intervention reassessments</p>
                </div>
              </div>
            )}

            {/* Visual Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: CO Attainment Trend */}
              <COAttainmentTrendChart runs={displayedRuns} selectedCO={selectedCO} />

              {/* Chart 2: Latest Attainment vs Target */}
              {latestRun && <COVsTargetBarChart run={latestRun} />}

              {/* Chart 3: Risk Stratification Trend */}
              <RiskDistributionTrendChart runs={displayedRuns} />

              {/* Chart 4: Learning Gain Overview */}
              {latestRun && <LearningGainOverviewChart run={latestRun} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
