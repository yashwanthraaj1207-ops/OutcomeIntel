import React from 'react';
import { AlertTriangle, Layers, RefreshCw, Play, CheckCircle2, Compass } from 'lucide-react';

interface First30SecondsHeroProps {
  onLaunchDemoScenario: () => void;
  isLoadingSample: boolean;
  hasDataLoaded: boolean;
}

export const First30SecondsHero: React.FC<First30SecondsHeroProps> = ({
  onLaunchDemoScenario,
  isLoadingSample,
  hasDataLoaded
}) => {
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 space-y-6 animate-fade-in">
      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-indigo-400" />
            Hackathon Judge Briefing & Value Proposition
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            • 8-Module Closed-Loop Academic Intelligence Pipeline
          </span>
        </div>

        {/* Demo Scenario Launch CTA */}
        <button
          onClick={onLaunchDemoScenario}
          disabled={isLoadingSample}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
        >
          {isLoadingSample ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-white" />
          )}
          <span>{hasDataLoaded ? 'Restart Judge Demo Scenario (S001 • CO2)' : 'Launch Judge Demo Scenario (S001 • CO2)'}</span>
        </button>
      </div>

      {/* Main Pitch Title */}
      <div className="space-y-2 max-w-4xl">
        <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
          AI-Powered Course Outcome Early-Warning & Instructional Intervention System
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          From early prediction to evidence-based intervention and verified learning gain.
        </p>
      </div>

      {/* The Three Key Pillars (Problem, Solution, Differentiator) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Pillar 1: What is the Problem? */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
            <AlertTriangle className="h-4 w-4" />
            <span>What is the Problem?</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Faculty typically discover weak course outcome attainment only <strong>after</strong> summative examinations or semester ends—when remedial instructional intervention is impossible.
          </p>
        </div>

        {/* Pillar 2: What Does the System Do? */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold uppercase tracking-wider text-[11px]">
            <CheckCircle2 className="h-4 w-4" />
            <span>What Does the System Do?</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Detects emerging Course Outcome deficits <strong>early</strong>, diagnoses the underlying topic weakness, recommends an evidence-linked pedagogical intervention, and verifies outcome through reassessment.
          </p>
        </div>

        {/* Pillar 3: What Makes It Different? */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
            <Layers className="h-4 w-4" />
            <span>What Makes It Different?</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            <strong>It closes the academic loop:</strong>
          </p>
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800 font-mono text-[10px] text-emerald-300 font-bold">
            Prediction → Explanation → Intervention → Reassessment → Verified Outcome
          </div>
          <p className="text-[10px] text-slate-400">
            No black-box hallucinations. Every recommendation is grounded in verified student assessment records.
          </p>
        </div>
      </div>
    </div>
  );
};
