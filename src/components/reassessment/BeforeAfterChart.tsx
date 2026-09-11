import React from 'react';
import { BarChart2 } from 'lucide-react';

interface BeforeAfterChartProps {
  preAttainment: number | null;
  postAttainment: number | null;
  targetThreshold: number | null;
  coId: string;
}

export const BeforeAfterChart: React.FC<BeforeAfterChartProps> = ({
  preAttainment,
  postAttainment,
  targetThreshold,
  coId
}) => {
  const target = targetThreshold !== null ? targetThreshold : 70.0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Attainment Trajectory Visualization (Pre vs Post)
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 5
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Visual comparison of {coId} attainment against institutional target threshold
            </p>
          </div>
        </div>

        {targetThreshold !== null && (
          <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 inline-block border-t border-dashed"></span>
            <span>Target Benchmark: {targetThreshold}%</span>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      {preAttainment === null && postAttainment === null ? (
        <div className="py-12 px-6 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 space-y-2.5">
          <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
            <BarChart2 className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Awaiting post-intervention reassessment</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Learning-gain visualization will appear once assessment results are available for {coId}.
          </p>
        </div>
      ) : (
        <div className="space-y-6 pt-4">
          {/* Delta Pill (when both are available) */}
          {preAttainment !== null && postAttainment !== null && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-medium text-slate-600">Measured Trajectory Delta:</span>
              <div className="flex items-center space-x-2">
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                    postAttainment - preAttainment > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : postAttainment - preAttainment === 0
                      ? 'bg-slate-200 text-slate-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {postAttainment - preAttainment >= 0 ? '+' : ''}
                  {(postAttainment - preAttainment).toFixed(1)} pp
                </span>
                <span className="text-slate-500">
                  {postAttainment >= target ? '(Target Achieved)' : '(Below Target)'}
                </span>
              </div>
            </div>
          )}

          {/* Bar comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pre-Intervention Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600">Pre-Intervention Baseline</span>
                <span className="font-mono text-slate-900">
                  {preAttainment !== null ? `${preAttainment.toFixed(1)}%` : 'Pending'}
                </span>
              </div>
              <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden relative">
                {preAttainment !== null ? (
                  <div
                    className="h-full bg-slate-500 rounded-lg transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(preAttainment, 0), 100)}%` }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-400">
                    Baseline Data Pending
                  </div>
                )}
                {/* Target benchmark vertical line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 border-l border-dashed border-rose-500 z-10"
                  style={{ left: `${Math.min(Math.max(target, 0), 100)}%` }}
                  title={`Target: ${target}%`}
                />
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>0%</span>
                <span>Target: {target}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Post-Reassessment Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-indigo-800">Post-Intervention Reassessment</span>
                {postAttainment !== null ? (
                  <span className="font-mono text-indigo-900">{postAttainment.toFixed(1)}%</span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Awaiting Post-Intervention (R1)
                  </span>
                )}
              </div>
              <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden relative">
                {postAttainment !== null ? (
                  <div
                    className={`h-full rounded-lg transition-all duration-500 ${
                      postAttainment >= target
                        ? 'bg-emerald-500'
                        : preAttainment !== null && postAttainment > preAttainment
                        ? 'bg-indigo-600'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(Math.max(postAttainment, 0), 100)}%` }}
                  />
                ) : (
                  <div className="h-full w-full bg-slate-50 border border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                    <span className="text-[11px] font-medium text-slate-400">
                      Reassessment Cycle R1 Pending
                    </span>
                  </div>
                )}
                {/* Target benchmark vertical line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 border-l border-dashed border-rose-500 z-10"
                  style={{ left: `${Math.min(Math.max(target, 0), 100)}%` }}
                  title={`Target: ${target}%`}
                />
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>0%</span>
                <span>Target: {target}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

