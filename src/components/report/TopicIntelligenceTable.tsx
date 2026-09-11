import React, { useState } from 'react';
import { TopicIntelligenceItem } from '../../types/dataTypes';
import { BookOpen, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, Filter } from 'lucide-react';

interface TopicIntelligenceTableProps {
  topics: TopicIntelligenceItem[];
  selectedCO: string;
}

export const TopicIntelligenceTable: React.FC<TopicIntelligenceTableProps> = ({
  topics,
  selectedCO
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'ATTENTION' | 'STRONG'>('ALL');

  const filtered = topics.filter(t => {
    if (selectedCO !== 'ALL' && t.coId.toUpperCase() !== selectedCO.toUpperCase()) return false;
    if (statusFilter === 'CRITICAL' && t.diagnosisStatus !== 'Critical Deficiency') return false;
    if (statusFilter === 'ATTENTION' && t.diagnosisStatus !== 'Needs Attention') return false;
    if (statusFilter === 'STRONG' && t.diagnosisStatus !== 'Strong') return false;
    return true;
  });

  const getDiagnosisBadge = (status: TopicIntelligenceItem['diagnosisStatus']) => {
    switch (status) {
      case 'Strong':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
            Strong (&ge;80%)
          </span>
        );
      case 'Satisfactory':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Satisfactory (60-79%)
          </span>
        );
      case 'Needs Attention':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />
            Needs Attention (40-59%)
          </span>
        );
      case 'Critical Deficiency':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3 w-3 mr-1 text-rose-600" />
            Critical Deficiency (&lt;40%)
          </span>
        );
    }
  };

  const getTrendBadge = (trend: TopicIntelligenceItem['historicalTrend']) => {
    switch (trend) {
      case 'Improving':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5 mr-1" />
            Improving (&ge;+3 pp)
          </span>
        );
      case 'Declining':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-rose-600">
            <TrendingDown className="h-3.5 w-3.5 mr-1" />
            Declining (&le;-3 pp)
          </span>
        );
      case 'Stable':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-slate-600">
            <Minus className="h-3.5 w-3.5 mr-1" />
            Stable
          </span>
        );
      case 'Insufficient Data':
      default:
        return (
          <span className="text-xs text-slate-400">
            Insufficient History
          </span>
        );
    }
  };

  const getReassessmentBadge = (item: TopicIntelligenceItem) => {
    if (item.reassessmentGainPp === null) {
      return (
        <span className="text-[11px] text-slate-400 italic">
          Pending Reassessment
        </span>
      );
    }

    const isPositive = item.reassessmentGainPp > 0;
    const isNegative = item.reassessmentGainPp < 0;

    return (
      <span
        className={`inline-flex items-center text-xs font-bold font-mono px-2 py-0.5 rounded ${
          isPositive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : isNegative
            ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : 'bg-slate-100 text-slate-700 border border-slate-200'
        }`}
      >
        {isPositive ? '+' : ''}
        {item.reassessmentGainPp.toFixed(1)} pp
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Topic-Level Diagnostic Intelligence & Learning Gain Matrix
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 4
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Granular topic diagnosis tracking attainment deficits, historical learning trajectories, and closed-loop post-reassessment deltas.
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center space-x-1.5 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400 mr-1" />
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({topics.length})
          </button>
          <button
            onClick={() => setStatusFilter('CRITICAL')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              statusFilter === 'CRITICAL'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Critical Deficiency
          </button>
          <button
            onClick={() => setStatusFilter('ATTENTION')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              statusFilter === 'ATTENTION'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Needs Attention
          </button>
          <button
            onClick={() => setStatusFilter('STRONG')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              statusFilter === 'STRONG'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Strong
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Curricular Topic</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3 text-right">Attainment %</th>
                <th className="px-4 py-3 text-right">Target %</th>
                <th className="px-4 py-3 text-right">Gap (pp)</th>
                <th className="px-4 py-3">Diagnostic Status</th>
                <th className="px-4 py-3">Historical Trajectory</th>
                <th className="px-4 py-3 text-right">Observed Reassessment Gain</th>
                <th className="px-4 py-3 text-right">Questions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No curricular topics match the current filter selection.
                  </td>
                </tr>
              ) : (
                filtered.map(t => {
                  const isGapNegative = t.gapPct !== null && t.gapPct < 0;

                  return (
                    <tr key={`${t.coId}__${t.topic}`} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {t.topic}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 font-semibold">
                        {t.coId}
                      </td>
                      <td className="px-4 py-3 text-right font-black font-mono text-slate-900">
                        {t.attainmentPct !== null ? `${t.attainmentPct.toFixed(1)}%` : 'Pending'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {t.targetThreshold !== null ? `${t.targetThreshold}%` : 'Not Set'}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold font-mono ${
                          t.gapPct === null
                            ? 'text-slate-400'
                            : isGapNegative
                            ? 'text-rose-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {t.gapPct !== null ? `${t.gapPct >= 0 ? '+' : ''}${t.gapPct.toFixed(1)} pp` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {getDiagnosisBadge(t.diagnosisStatus)}
                      </td>
                      <td className="px-4 py-3">
                        {getTrendBadge(t.historicalTrend)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {getReassessmentBadge(t)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {t.questionCount}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

