import React from 'react';
import { BookOpen, ShieldCheck, Scale, Cpu } from 'lucide-react';

export const ReportMethodology: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Statistical Methodology, Governance & Academic Integrity Standards
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 11
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Mathematical definitions, accreditation compliance criteria, and algorithmic disclosure governing all metrics in this report.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-xs text-indigo-700 font-semibold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
          <Cpu className="h-3.5 w-3.5 mr-1" />
          <span>Deterministic Local Engine</span>
        </div>
      </div>

      {/* Methodology Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* 1. CO Attainment Formula */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-slate-900">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <span>Course Outcome Attainment</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Attainment percentage is calculated strictly by summing all validated student marks obtained divided by total possible marks for questions mapped to that CO:
          </p>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-indigo-900">
            Attainment % = ( &Sigma; Marks Obtained / &Sigma; Max Marks ) &times; 100
          </div>
          <p className="text-slate-500 text-[11px]">
            Missing data is never imputed as 0; it remains explicitly pending.
          </p>
        </div>

        {/* 2. Percentage Points Distinction */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-slate-900">
            <Scale className="h-4 w-4 text-indigo-600" />
            <span>Percentage Points (pp) Precision</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            All attainment gaps and post-intervention learning gains are reported in <strong>percentage points (pp)</strong>, not relative percentages, preventing mathematical distortion:
          </p>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-indigo-900">
            Absolute Gain (pp) = Post Attainment % &minus; Pre Attainment %
          </div>
          <p className="text-slate-500 text-[11px]">
            E.g., an increase from 50% to 70% is +20.0 percentage points.
          </p>
        </div>

        {/* 3. Non-Causality & Integrity */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Non-Causal Academic Assertion</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            In compliance with educational measurement standards, this report states that <em>"observed attainment increased by X percentage points"</em>. It makes no speculative claims that an intervention was the exclusive causal factor.
          </p>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
            Zero LLM / Zero External API Dependency
          </div>
          <p className="text-slate-500 text-[11px]">
            100% auditable, local, reproducible algorithms.
          </p>
        </div>
      </div>
    </div>
  );
};
