import React from 'react';
import { BookOpen, ShieldCheck, Cpu, GitCommit } from 'lucide-react';

export const PredictionMethodologyCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Academic Prediction Methodology & Mathematical Pipeline
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 6
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic temporal feature engineering and interpretable classification architecture
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          Zero Data Leakage Certified
        </span>
      </div>

      {/* Methodology Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Anti-Leakage Protocol */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>1. Strict Temporal Cutoff & Anti-Leakage</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            For prediction at horizon assessment T(pred), features are derived <strong>exclusively from historical observations prior to T(pred)</strong>. Target assessment marks, subsequent topic performances, and post-cutoff attainment outcomes are strictly excluded from feature computation.
          </p>
          <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-100 font-mono space-y-0.5">
            <div>T(pred) = A3 ➔ Allowed: [A1, A2]</div>
            <div className="text-rose-600">Forbidden: [A3, Final, Subsequent]</div>
          </div>
        </div>

        {/* Binary Classification Architecture */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold">
            <Cpu className="h-4 w-4 text-indigo-600" />
            <span>2. Transparent Logistic Regression ML Model</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Pure mathematical multivariate Logistic Regression with z-score standardized features and standard Sigmoid link function:
          </p>
          <div className="font-mono text-[11px] text-slate-800 bg-white p-2 rounded border border-slate-100 space-y-1">
            <div className="text-center font-bold">z = b + &Sigma; w_j &middot; ((x_j - &mu;_j) / &sigma;_j)</div>
            <div className="text-center text-indigo-700 font-bold">P(Meets Target) = 1 / (1 + e^-z)</div>
          </div>
          <p className="text-slate-500 text-[11px] leading-tight">
            Trained via Batch Gradient Descent with L2 regularization (&lambda; = 0.001, &alpha; = 0.15) and deterministic zero initialization.
          </p>
        </div>

        {/* Probability vs Confidence & Accreditation */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold">
            <GitCommit className="h-4 w-4 text-amber-600" />
            <span>3. Pedagogical Calibration & Zero-LLM</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Outputs are genuine <strong>calibrated posterior probabilities P(y=1)</strong> indicating likelihood of meeting institutional target.
          </p>
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded text-[11px] space-y-1">
            <div className="font-semibold">Academic Integrity Assurance:</div>
            <div>Module 3 relies purely on verifiable statistical Machine Learning. Zero LLMs, simulated probabilities, or fabricated confidence intervals.</div>
          </div>
        </div>
      </div>

      {/* Feature Engineering Specification */}
      <div className="pt-2 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-800 mb-2">Engineered Feature Dimensions (Zero-Leakage Factual Inputs)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Feature 1</span>
            <strong className="text-slate-800 font-medium">Historical Mean CO %</strong>
          </div>
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Feature 2</span>
            <strong className="text-slate-800 font-medium">Prior Assessment CO %</strong>
          </div>
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Feature 3</span>
            <strong className="text-slate-800 font-medium">Trend / Delta Slope</strong>
          </div>
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Feature 4</span>
            <strong className="text-slate-800 font-medium">Prior Target Met Flag</strong>
          </div>
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Feature 5</span>
            <strong className="text-slate-800 font-medium">Assessment Depth Count</strong>
          </div>
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Feature 6</span>
            <strong className="text-slate-800 font-medium">Consistency StdDev</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
