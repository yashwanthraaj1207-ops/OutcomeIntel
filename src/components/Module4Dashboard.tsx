import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ShieldAlert
} from 'lucide-react';
import {
  StandardizedAssessmentRecord,
  TargetMappingDictionary,
  CourseMetadata,
  RiskScopeFilters
} from '../types/dataTypes';
import {
  getChronologicalAssessments
} from '../services/predictionFeatureEngine';
import {
  trainPredictionModel,
  generateCohortPredictions
} from '../services/coPredictionEngine';
import {
  evaluateCohortRisk
} from '../services/riskDetectionEngine';

import { RiskScopeFilter } from './risk/RiskScopeFilter';
import { RiskOverview } from './risk/RiskOverview';
import { RiskDistributionChart } from './risk/RiskDistributionChart';
import { RiskStudentTable } from './risk/RiskStudentTable';
import { RiskDetailPanel } from './risk/RiskDetailPanel';
import { RiskMethodologyCard } from './risk/RiskMethodologyCard';
import { Module5HandoverCard } from './risk/Module5HandoverCard';

interface Module4DashboardProps {
  records: StandardizedAssessmentRecord[];
  targetMap: TargetMappingDictionary;
  courseMeta: CourseMetadata;
  onBackToModule3: () => void;
  onBackToModule2?: () => void;
  onBackToModule1?: () => void;
  onNavigateToModule5?: () => void;
}

export const Module4Dashboard: React.FC<Module4DashboardProps> = ({
  records,
  targetMap,
  courseMeta,
  onBackToModule3,
  onBackToModule2,
  onBackToModule1,
  onNavigateToModule5
}) => {
  // Extract available courses
  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.course_id));
    const list = Array.from(set).sort();
    return list.length > 0 ? list : ['CS301'];
  }, [records]);

  // Initial course
  const initialCourse = useMemo(() => {
    if (courseMeta.courseId && courseMeta.courseId !== 'ALL' && availableCourses.includes(courseMeta.courseId)) {
      return courseMeta.courseId;
    }
    return availableCourses[0];
  }, [courseMeta.courseId, availableCourses]);

  const [courseId, setCourseId] = useState<string>(initialCourse);

  // Chronological assessment ordering for active course
  const chronologicalAssessments = useMemo(() => {
    return getChronologicalAssessments(records, courseId);
  }, [records, courseId]);

  // Default prediction assessment is latest available
  const defaultAssessment = useMemo(() => {
    if (chronologicalAssessments.length > 0) {
      return chronologicalAssessments[chronologicalAssessments.length - 1].assessmentId;
    }
    return 'A3';
  }, [chronologicalAssessments]);

  // Available semesters for active course
  const availableSemesters = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.course_id.toUpperCase() === courseId.toUpperCase()) {
        set.add(r.semester.toString());
      }
    });
    const list = Array.from(set).sort();
    return list.length > 0 ? list : ['4'];
  }, [records, courseId]);

  // Available COs for active course
  const availableCOs = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.course_id.toUpperCase() === courseId.toUpperCase()) {
        set.add(r.co_id);
      }
    });
    const list = Array.from(set).sort();
    return list.length > 0 ? list : ['CO1'];
  }, [records, courseId]);

  const [filters, setFilters] = useState<RiskScopeFilters>({
    courseId,
    semester: availableSemesters[0] || '4',
    predictionAssessment: defaultAssessment,
    coId: availableCOs[0] || 'CO1',
    riskFilter: 'ALL'
  });

  // Handle course change synchronization
  const handleFilterChange = (newFilters: RiskScopeFilters) => {
    if (newFilters.courseId !== courseId) {
      setCourseId(newFilters.courseId);
      const newChronological = getChronologicalAssessments(records, newFilters.courseId);
      const newLatestAssessment =
        newChronological.length > 0
          ? newChronological[newChronological.length - 1].assessmentId
          : 'A3';

      const newCOs = Array.from(
        new Set(
          records
            .filter(r => r.course_id.toUpperCase() === newFilters.courseId.toUpperCase())
            .map(r => r.co_id)
        )
      ).sort();

      setFilters({
        ...newFilters,
        predictionAssessment: newLatestAssessment,
        coId: newCOs.length > 0 ? newCOs[0] : 'CO1'
      });
    } else {
      setFilters(newFilters);
    }
  };

  // Target threshold from target mapping
  const targetKey = `${filters.courseId.toUpperCase()}|${filters.coId.toUpperCase()}`;
  const targetThreshold = targetMap[targetKey] !== undefined ? targetMap[targetKey] : null;

  // Train prediction model on historical transitions across the course
  const model = useMemo(() => {
    return trainPredictionModel(records, filters.courseId, targetMap);
  }, [records, filters.courseId, targetMap]);

  // Generate cohort predictions from Module 3
  const { predictions, hasHistoricalData } = useMemo(() => {
    return generateCohortPredictions(
      records,
      filters.courseId,
      filters.coId,
      filters.predictionAssessment,
      targetMap,
      model
    );
  }, [records, filters.courseId, filters.coId, filters.predictionAssessment, targetMap, model]);

  // All distinct cohort students in course
  const allCohortStudentIds = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (filters.courseId === 'ALL' || r.course_id.toUpperCase() === filters.courseId.toUpperCase()) {
        set.add(r.student_id);
      }
    });
    return Array.from(set).sort();
  }, [records, filters.courseId]);

  // Evaluate risk detection on cohort
  const { assessments, summary } = useMemo(() => {
    return evaluateCohortRisk(
      predictions,
      allCohortStudentIds,
      filters.courseId,
      filters.coId,
      filters.predictionAssessment,
      targetThreshold,
      hasHistoricalData
    );
  }, [
    predictions,
    allCohortStudentIds,
    filters.courseId,
    filters.coId,
    filters.predictionAssessment,
    targetThreshold,
    hasHistoricalData
  ]);

  // Selected student for detail inspection
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedAssessment = useMemo(() => {
    if (!selectedStudentId) {
      return assessments.length > 0 ? assessments[0] : null;
    }
    return assessments.find(a => a.studentId === selectedStudentId) || (assessments[0] || null);
  }, [assessments, selectedStudentId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Sticky Header Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToModule3}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              title="Return to Module 3 Conditional CO Prediction"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>CO Prediction</span>
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  Module 4
                </span>
                <span className="text-slate-400 text-xs">/</span>
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Early-Warning Risk Detection
                </h1>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                  <ShieldAlert className="h-3 w-3" />
                  <span>Multi-Signal Rule Engine Active</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic triage synthesizing predictive probability, attainment gap, and trajectory trends
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-slate-800">
                {filters.courseId} • Sem {filters.semester}
              </div>
              <div className="text-[11px] text-slate-400">
                Horizon: {filters.predictionAssessment} ({filters.coId})
              </div>
            </div>

            {onBackToModule2 && (
              <button
                type="button"
                onClick={onBackToModule2}
                className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
              >
                Analytics
              </button>
            )}

            {onBackToModule1 && (
              <button
                type="button"
                onClick={onBackToModule1}
                className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
              >
                Ingestion
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Section 1: Scope & Multi-Signal Filter */}
        <RiskScopeFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          availableCourses={availableCourses}
          availableSemesters={availableSemesters}
          availableCOs={availableCOs}
          chronologicalAssessments={chronologicalAssessments}
          targetThreshold={targetThreshold}
          highCount={summary.highRiskCount}
          mediumCount={summary.mediumRiskCount}
          lowCount={summary.lowRiskCount}
          insufficientCount={summary.insufficientDataCount}
        />

        {/* Section 2: Cohort Early-Warning Overview */}
        <RiskOverview
          summary={summary}
          targetThreshold={targetThreshold}
          hasHistoricalData={hasHistoricalData}
        />

        {/* Section 3: Risk Proportion & Cohort Distribution */}
        <RiskDistributionChart summary={summary} />

        {/* Section 4: Student Risk Roster Table */}
        <RiskStudentTable
          assessments={assessments}
          selectedStudentId={selectedStudentId}
          onSelectStudent={setSelectedStudentId}
          activeRiskFilter={filters.riskFilter}
        />

        {/* Section 5: Multi-Signal Risk Evidence Detail Panel */}
        <RiskDetailPanel selectedAssessment={selectedAssessment} />

        {/* Section 6: Methodology & Priority Scoring Policy */}
        <RiskMethodologyCard />

        {/* Section 7: Module 5 Handover Card */}
        <Module5HandoverCard
          assessments={assessments}
          courseId={filters.courseId}
          coId={filters.coId}
          predictionAssessment={filters.predictionAssessment}
          onNavigateToModule5={onNavigateToModule5}
        />
      </main>
    </div>
  );
};
