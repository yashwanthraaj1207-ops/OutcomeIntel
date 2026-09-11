import React from 'react';
import {
  InterventionRecommendation,
  InterventionRecord
} from '../../types/dataTypes';
import { ListChecks, CheckCircle2, ChevronRight, Zap, Clock } from 'lucide-react';

interface InterventionOptionsTableProps {
  options: InterventionRecommendation[];
  selectedOption: InterventionRecommendation | null;
  onSelectOption: (option: InterventionRecommendation) => void;
  activeRecord?: InterventionRecord;
}

export const InterventionOptionsTable: React.FC<InterventionOptionsTableProps> = ({
  options,
  selectedOption,
  onSelectOption,
  activeRecord
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Available Remediation & Instructional Options Catalog
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 6
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Generated from topic diagnosis categories ({options.length} pedagogical intervention options available)
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Select an option below to load into the Faculty Review & Approval panel
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Pedagogical Strategy</th>
              <th className="px-4 py-3">Target Topic & CO</th>
              <th className="px-4 py-3">Targeted Items</th>
              <th className="px-4 py-3">Intensity & Timing</th>
              <th className="px-4 py-3">Academic Focus</th>
              <th className="px-4 py-3 text-right">Review Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {options.map((opt) => {
              const isSelected = selectedOption?.id === opt.id;
              const isApproved = activeRecord?.status === 'Approved' && activeRecord.interventionType === opt.type;

              const intensityStyle =
                opt.intensity === 'HIGH'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : opt.intensity === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';

              return (
                <tr
                  key={opt.id}
                  className={`transition-colors ${
                    isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Strategy */}
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <span>{opt.type}</span>
                      {isApproved && (
                        <span className="p-0.5 rounded-full bg-emerald-100 text-emerald-700" title="Approved">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-normal text-slate-400 mt-0.5 font-mono">
                      {opt.priority} Priority
                    </div>
                  </td>

                  {/* Topic & CO */}
                  <td className="px-4 py-3.5 font-medium text-slate-800">
                    <div>{opt.targetTopic}</div>
                    <div className="text-[11px] text-slate-400">{opt.targetCO}</div>
                  </td>

                  {/* Question items */}
                  <td className="px-4 py-3.5 font-mono">
                    {opt.questionIds && opt.questionIds.length > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
                        {opt.questionIds.join(', ')}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Topic review</span>
                    )}
                  </td>

                  {/* Intensity & Timing */}
                  <td className="px-4 py-3.5 space-y-1">
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1 ${intensityStyle}`}>
                        <Zap className="h-3 w-3" />
                        {opt.intensity}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{opt.timing}</span>
                    </div>
                  </td>

                  {/* Focus */}
                  <td className="px-4 py-3.5 max-w-xs text-[11px] leading-relaxed text-slate-600">
                    {opt.academicFocus}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => onSelectOption(opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      <span>{isSelected ? '✓ Loaded for Review' : 'Load for Review'}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
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

