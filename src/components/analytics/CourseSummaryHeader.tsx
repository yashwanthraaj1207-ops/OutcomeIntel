import React from 'react';
import { BookOpen, Users, Calendar, HelpCircle, Layers, Target, Activity, Award } from 'lucide-react';
import { CourseSummaryMetrics } from '../../types/dataTypes';

interface CourseSummaryHeaderProps {
  summary: CourseSummaryMetrics;
}

export const CourseSummaryHeader: React.FC<CourseSummaryHeaderProps> = ({ summary }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Course Scope & Dataset Summary
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {summary.selectedCourse}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated assessment metrics for active analytic scope
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <Award className="h-4 w-4 text-indigo-600" />
          <span className="text-xs text-slate-600 font-medium">Overall Course Attainment:</span>
          <span className="text-xs font-bold text-indigo-700 font-mono">
            {summary.overallAttainmentPct.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Students */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs mb-1">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            <span>Students</span>
          </div>
          <div className="text-lg font-bold text-slate-800 font-mono">
            {summary.totalStudents.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">Enrolled cohort</div>
        </div>

        {/* Assessments */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs mb-1">
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
            <span>Assessments</span>
          </div>
          <div className="text-lg font-bold text-slate-800 font-mono">
            {summary.totalAssessments}
          </div>
          <div className="text-[11px] text-slate-400">Conducted events</div>
        </div>

        {/* Questions */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs mb-1">
            <HelpCircle className="h-3.5 w-3.5 text-violet-500" />
            <span>Questions</span>
          </div>
          <div className="text-lg font-bold text-slate-800 font-mono">
            {summary.totalQuestions}
          </div>
          <div className="text-[11px] text-slate-400">Evaluated items</div>
        </div>

        {/* Topics */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs mb-1">
            <Layers className="h-3.5 w-3.5 text-emerald-500" />
            <span>Topics</span>
          </div>
          <div className="text-lg font-bold text-slate-800 font-mono">
            {summary.totalTopics}
          </div>
          <div className="text-[11px] text-slate-400">Curriculum units</div>
        </div>

        {/* COs */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs mb-1">
            <Target className="h-3.5 w-3.5 text-amber-500" />
            <span>Course Outcomes</span>
          </div>
          <div className="text-lg font-bold text-slate-800 font-mono">
            {summary.totalCOs}
          </div>
          <div className="text-[11px] text-slate-400">Mapped outcomes</div>
        </div>

        {/* Total Observations */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs mb-1">
            <Activity className="h-3.5 w-3.5 text-rose-500" />
            <span>Observations</span>
          </div>
          <div className="text-lg font-bold text-slate-800 font-mono">
            {summary.totalObservations.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">Validated rows</div>
        </div>
      </div>
    </div>
  );
};

