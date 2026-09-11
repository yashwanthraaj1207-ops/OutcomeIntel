import React from 'react';
import { BookOpen, ShieldCheck, CheckSquare, Sliders } from 'lucide-react';

export const RiskMethodologyCard: React.FC = () => {
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
              Risk Detection Methodology & Priority Scoring Policy
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 6
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Transparent multi-signal rule matrix and empirical priority triage formulation
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          Deterministic Rule Engine Active
        </span>
      </div>

      {/* 3 Columns: Policy, Priority Formula, Data Sufficiency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Risk Classification Policy */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
            <CheckSquare className="h-4 w-4 text-rose-600" />
            <span>1. Deterministic Precedence Rules</span>
          </div>

          <p className="text-slate-600 leading-relaxed">
            Mutually exclusive categories applied in strict sequential priority order:
          </p>

          <div className="space-y-1.5 text-[11px] font-mono pt-1">
            <div className="p-1.5 bg-slate-100 border border-slate-200 rounded text-slate-800">
              <strong>1. INSUFFICIENT DATA:</strong> Required prediction, target, or historical evidence unavailable
            </div>
            <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-rose-900">
              <strong>2. HIGH RISK:</strong> P &lt; 40.0% OR (Gap &lt; -10.0% AND Trend = Declining)
            </div>
            <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900">
              <strong>3. LOW RISK:</strong> P &ge; 70.0% AND Gap &ge; -5.0% AND Trend != Declining
            </div>
            <div className="p-1.5 bg-amber-50 border border-amber-200 rounded text-amber-900">
              <strong>4. MEDIUM RISK:</strong> All remaining eligible cases
            </div>
          </div>

          <p className="text-[10px] text-slate-500 pt-1 leading-normal">
            <strong>Boundary rules:</strong> P = 40.0% is not High Risk on probability alone; P = 70.0% qualifies for Low Risk (if gap &ge; -5% and non-declining); Gap = -10.0% is not High Risk on gap alone; Gap = -5.0% qualifies for Low Risk.
          </p>
        </div>

        {/* Priority Score Formula */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
            <Sliders className="h-4 w-4 text-indigo-600" />
            <span>2. Priority Score Formulation</span>
          </div>

          <p className="text-slate-600 leading-relaxed">
            Orders students by triage urgency using a bounded 0–100 weighted index:
          </p>

          <div className="space-y-1 text-[11px] bg-white p-2 rounded border border-slate-100 font-mono text-slate-700">
            <div>• P(Failure) Risk [40%]: (1 - P/100) * 40</div>
            <div>• Target Deficit [25%]: (min(30, |gap|) / 30) * 25</div>
            <div>• Trend Penalty [20%]: Declining=20, Stable=8, Improving=0</div>
            <div>• Historical Volatility [15%]: min(15, (&sigma; / 20) * 15)</div>
          </div>

          <p className="text-[10px] text-slate-400">
            Labeled strictly as "Prototype Risk Priority Score", not "Probability of Failure".
          </p>
        </div>

        {/* Data Sufficiency Guard */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>3. Data Sufficiency Principle</span>
          </div>

          <p className="text-slate-600 leading-relaxed">
            In accordance with academic safety, <strong>absence of evidence is never treated as low risk</strong>.
          </p>

          <div className="p-2 bg-white rounded border border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div>• Earliest baseline cycles (e.g. A1) lacking historical predecessor ➔ <strong>INSUFFICIENT DATA</strong></div>
            <div>• Missing institutional target threshold ➔ <strong>INSUFFICIENT DATA</strong></div>
            <div>• Missing predictive model inputs ➔ <strong>INSUFFICIENT DATA</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

