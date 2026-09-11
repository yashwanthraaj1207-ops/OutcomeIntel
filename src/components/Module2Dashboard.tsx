import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import {
  StandardizedAssessmentRecord,
  TargetMappingDictionary,
  AnalyticsFilters,
  CourseMetadata
} from '../types/dataTypes';
import {
  filterRecords,
  getAvailableFilterOptions,
  computeCourseSummary,
  computeCOAttainmentSummary,
  computeAssessmentBreakdown,
  computeTopicPerformance,
  computeStudentDistribution,
  computeQuestionMatrix
} from '../services/coAnalyticsEngine';

import { CourseSummaryHeader } from './analytics/CourseSummaryHeader';
import { AnalyticsScopeFilter } from './analytics/AnalyticsScopeFilter';
import { COAttainmentOverview } from './analytics/COAttainmentOverview';
import { COAssessmentBreakdown } from './analytics/COAssessmentBreakdown';
import { TopicPerformanceBreakdown } from './analytics/TopicPerformanceBreakdown';
import { StudentAttainmentDist } from './analytics/StudentAttainmentDist';
import { QuestionPerformanceMatrix } from './analytics/QuestionPerformanceMatrix';
import { Module3HandoverCard } from './analytics/Module3HandoverCard';

interface Module2DashboardProps {
  records: StandardizedAssessmentRecord[];
  targetMap: TargetMappingDictionary;
  courseMeta: CourseMetadata;
  onBackToModule1?: () => void;
  onNavigateToModule3?: () => void;
}

export const Module2Dashboard: React.FC<Module2DashboardProps> = ({
  records,
  targetMap,
  courseMeta,
  onBackToModule1,
  onNavigateToModule3
}) => {
  // Available filter options dynamically extracted from the dataset
  const availableOptions = useMemo(() => getAvailableFilterOptions(records), [records]);

  // Initial filter state defaults to the selected course from Module 1 if available, otherwise ALL or first course
  const defaultCourse = useMemo(() => {
    if (courseMeta.courseId && availableOptions.courses.includes(courseMeta.courseId)) {
      return courseMeta.courseId;
    }
    return availableOptions.courses.length > 0 ? availableOptions.courses[0] : 'ALL';
  }, [courseMeta.courseId, availableOptions.courses]);

  const [filters, setFilters] = useState<AnalyticsFilters>({
    courseId: defaultCourse,
    semester: 'ALL',
    assessmentId: 'ALL',
    coId: 'ALL'
  });

  const handleResetFilters = () => {
    setFilters({
      courseId: defaultCourse,
      semester: 'ALL',
      assessmentId: 'ALL',
      coId: 'ALL'
    });
  };

  // Filter dataset based on active scope
  const filteredRecords = useMemo(
    () => filterRecords(records, filters),
    [records, filters]
  );

  // Compute metrics purely and deterministically
  const courseSummary = useMemo(
    () => computeCourseSummary(filteredRecords, filters),
    [filteredRecords, filters]
  );

  const coAttainment = useMemo(
    () => computeCOAttainmentSummary(filteredRecords, targetMap),
    [filteredRecords, targetMap]
  );

  const assessmentBreakdown = useMemo(
    () => computeAssessmentBreakdown(filteredRecords),
    [filteredRecords]
  );

  const topicPerformance = useMemo(
    () => computeTopicPerformance(filteredRecords, targetMap),
    [filteredRecords, targetMap]
  );

  const studentDistributions = useMemo(
    () => computeStudentDistribution(filteredRecords, targetMap),
    [filteredRecords, targetMap]
  );

  const questionPerformance = useMemo(
    () => computeQuestionMatrix(filteredRecords, targetMap),
    [filteredRecords, targetMap]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            {onBackToModule1 && (
              <button
                type="button"
                onClick={onBackToModule1}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                title="Return to Module 1 Data Ingestion & Validation"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Data Ingestion</span>
              </button>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  Module 2
                </span>
                <span className="text-slate-400 text-xs">/</span>
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Course Outcome Analytics
                </h1>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Validated Dataset Connected</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic attainment evaluation, topic drill-down, and assessment progression
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-slate-800">
                {records.length.toLocaleString()} Standardized Records
              </div>
              <div className="text-[11px] text-slate-400">
                {availableOptions.courses.join(', ')} | Sem {availableOptions.semesters.join(', ')}
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
              title="Reset all filters"
            >
              <RefreshCw className="h-3 w-3 text-slate-400" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Section 7: Course Scope & Dataset Summary Header */}
        <CourseSummaryHeader summary={courseSummary} />

        {/* Section 1: Analytics Scope Filter */}
        <AnalyticsScopeFilter
          filters={filters}
          availableOptions={availableOptions}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          filteredObservationsCount={filteredRecords.length}
          totalObservationsCount={records.length}
        />

        {/* Section 2: Course Outcome Attainment Overview */}
        <COAttainmentOverview coItems={coAttainment} />

        {/* Section 3: CO Assessment Breakdown Matrix */}
        <COAssessmentBreakdown matrix={assessmentBreakdown} />

        {/* Section 4: Topic-Level Performance Breakdown */}
        <TopicPerformanceBreakdown topicItems={topicPerformance} />

        {/* Section 5: Student Attainment Distribution */}
        <StudentAttainmentDist distributionItems={studentDistributions} />

        {/* Section 6: Question Performance Matrix */}
        <QuestionPerformanceMatrix questionItems={questionPerformance} />

        {/* Section 8: Module 3 Handover Card */}
        <Module3HandoverCard
          summary={courseSummary}
          coItems={coAttainment}
          onNavigateToModule3={onNavigateToModule3}
        />
      </main>
    </div>
  );
};
