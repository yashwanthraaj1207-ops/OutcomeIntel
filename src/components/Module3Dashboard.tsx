import React, { useState, useMemo } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import {
  StandardizedAssessmentRecord,
  TargetMappingDictionary,
  CourseMetadata,
  PredictionScopeFilters
} from '../types/dataTypes';
import {
  getChronologicalAssessments,
  getHistoricalAssessments
} from '../services/predictionFeatureEngine';
import {
  trainPredictionModel,
  generateCohortPredictions
} from '../services/coPredictionEngine';

import { PredictionScopeFilter } from './prediction/PredictionScopeFilter';
import { PredictionOverview } from './prediction/PredictionOverview';
import { PredictionTable } from './prediction/PredictionTable';
import { PredictionDetailPanel } from './prediction/PredictionDetailPanel';
import { PredictionEvaluationCard } from './prediction/PredictionEvaluationCard';
import { PredictionMethodologyCard } from './prediction/PredictionMethodologyCard';
import { PredictionDataQualityCard } from './prediction/PredictionDataQualityCard';
import { Module4HandoverCard } from './prediction/Module4HandoverCard';

interface Module3DashboardProps {
  records: StandardizedAssessmentRecord[];
  targetMap: TargetMappingDictionary;
  courseMeta: CourseMetadata;
  onBackToModule2: () => void;
  onBackToModule1?: () => void;
  onNavigateToModule4?: () => void;
}

export const Module3Dashboard: React.FC<Module3DashboardProps> = ({
  records,
  targetMap,
  courseMeta,
  onBackToModule2,
  onBackToModule1,
  onNavigateToModule4
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

  // Default prediction assessment is the latest available in course
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
        setResetSemester: set.add(r.semester.toString());
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

  const [filters, setFilters] = useState<PredictionScopeFilters>({
    courseId,
    semester: availableSemesters[0] || '4',
    predictionAssessment: defaultAssessment,
    coId: availableCOs[0] || 'CO1'
  });

  // Keep filters in sync when course changes
  const handleFilterChange = (newFilters: PredictionScopeFilters) => {
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

  // Historical assessments strictly prior to selected prediction assessment
  const historicalAssessments = useMemo(() => {
    return getHistoricalAssessments(chronologicalAssessments, filters.predictionAssessment);
  }, [chronologicalAssessments, filters.predictionAssessment]);

  // Target threshold from target mapping
  const targetKey = `${filters.courseId.toUpperCase()}|${filters.coId.toUpperCase()}`;
  const targetThreshold = targetMap[targetKey] !== undefined ? targetMap[targetKey] : null;

  // Train prediction model on historical transitions across the course
  const model = useMemo(() => {
    return trainPredictionModel(records, filters.courseId, targetMap);
  }, [records, filters.courseId, targetMap]);

  // Generate cohort predictions
  const { predictions, summary, hasHistoricalData } = useMemo(() => {
    return generateCohortPredictions(
      records,
      filters.courseId,
      filters.coId,
      filters.predictionAssessment,
      targetMap,
      model
    );
  }, [records, filters, targetMap, model]);

  // Selected student for detail evidence inspection
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedPrediction = useMemo(() => {
    if (!selectedStudentId) {
      return predictions.length > 0 ? predictions[0] : null;
    }
    return predictions.find(p => p.studentId === selectedStudentId) || (predictions[0] || null);
  }, [predictions, selectedStudentId]);

  // Cohort students count for active course
  const totalCohortStudents = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (filters.courseId === 'ALL' || r.course_id.toUpperCase() === filters.courseId.toUpperCase()) {
        set.add(r.student_id);
      }
    });
    return set.size;
  }, [records, filters.courseId]);

  // Exclusions and data quality reasons
  const exclusionReasons = useMemo(() => {
    const reasons = [];
    if (!hasHistoricalData) {
      reasons.push({
        reason: 'Baseline Assessment Horizon',
        count: totalCohortStudents,
        description: `Assessment ${filters.predictionAssessment} is the earliest cycle with no chronologically preceding assessment.`
      });
    }
    if (targetThreshold === null) {
      reasons.push({
        reason: 'Target Missing in Mapping',
        count: totalCohortStudents,
        description: `No institutional target percentage configured for ${filters.courseId} + ${filters.coId}.`
      });
    }
    return reasons;
  }, [hasHistoricalData, targetThreshold, totalCohortStudents, filters]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Sticky Header Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToModule2}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              title="Return to Module 2 Course Outcome Analytics"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>CO Analytics</span>
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  Module 3
                </span>
                <span className="text-slate-400 text-xs">/</span>
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Conditional Course Outcome Prediction
                </h1>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Strict Anti-Leakage Active</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Forecast student Course Outcome target attainment using factual historical assessment performance
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-slate-800">
                {filters.courseId} • Sem {filters.semester}
              </div>
              <div className="text-[11px] text-slate-400">
                Predicting {filters.predictionAssessment} ({filters.coId})
              </div>
            </div>

            {onBackToModule1 && (
              <button
                type="button"
                onClick={onBackToModule1}
                className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
              >
                Data Ingestion
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Section 1: Scope & Horizon Selector */}
        <PredictionScopeFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          availableCourses={availableCourses}
          availableSemesters={availableSemesters}
          availableCOs={availableCOs}
          chronologicalAssessments={chronologicalAssessments}
          historicalAssessments={historicalAssessments}
          targetThreshold={targetThreshold}
        />

        {/* Section 2: Cohort Prediction Overview */}
        <PredictionOverview
          totalEvaluated={summary.totalEvaluated}
          predictedMet={summary.predictedMet}
          predictedBelow={summary.predictedBelow}
          avgProbability={summary.avgProbability}
          targetThreshold={targetThreshold}
          hasHistoricalData={hasHistoricalData}
        />

        {/* Section 3: Student Prediction Table */}
        <PredictionTable
          predictions={predictions}
          selectedStudentId={selectedStudentId}
          onSelectStudent={setSelectedStudentId}
          hasHistoricalData={hasHistoricalData}
          targetThreshold={targetThreshold}
        />

        {/* Section 4: Factual Feature Evidence & Prediction Detail */}
        {hasHistoricalData && targetThreshold !== null && (
          <PredictionDetailPanel selectedPrediction={selectedPrediction} />
        )}

        {/* Section 5: Model Evaluation & Test Performance */}
        <PredictionEvaluationCard metrics={model.testMetrics} />

        {/* Section 6: Methodology & Mathematical Pipeline */}
        <PredictionMethodologyCard />

        {/* Section 7: Model Data Quality & Eligibility Audit */}
        <PredictionDataQualityCard
          totalCohortStudents={totalCohortStudents}
          eligiblePredictionCases={predictions.length}
          excludedCasesCount={totalCohortStudents - predictions.length}
          exclusionReasons={exclusionReasons}
          hasHistoricalData={hasHistoricalData}
          targetConfigured={targetThreshold !== null}
          trainSampleCount={model.trainSampleCount}
          testSampleCount={model.testMetrics ? model.testMetrics.testCount : 0}
        />

        {/* Section 8: Module 4 Handover Card */}
        {hasHistoricalData && (
          <Module4HandoverCard
            predictions={predictions}
            courseId={filters.courseId}
            coId={filters.coId}
            predictionAssessment={filters.predictionAssessment}
            onNavigateToModule4={onNavigateToModule4}
          />
        )}
      </main>
    </div>
  );
};
