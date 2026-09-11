import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import {
  StandardizedAssessmentRecord,
  TargetMappingDictionary,
  CourseMetadata,
  ExplainabilityScopeFilters
} from '../types/dataTypes';
import {
  getChronologicalAssessments,
  getHistoricalAssessments
} from '../services/predictionFeatureEngine';
import {
  trainPredictionModel,
  generateCohortPredictions
} from '../services/coPredictionEngine';
import {
  evaluateCohortRisk
} from '../services/riskDetectionEngine';
import {
  buildStudentExplanation
} from '../services/explainabilityEngine';

import { ExplainabilityScopeFilter } from './explainability/ExplainabilityScopeFilter';
import { StudentExplanationOverview } from './explainability/StudentExplanationOverview';
import { EvidenceSummary } from './explainability/EvidenceSummary';
import { COEvidenceCard } from './explainability/COEvidenceCard';
import { TopicDiagnosisTable } from './explainability/TopicDiagnosisTable';
import { QuestionDiagnosisTable } from './explainability/QuestionDiagnosisTable';
import { AssessmentEvidenceChart } from './explainability/AssessmentEvidenceChart';
import { EvidenceFactorsPanel } from './explainability/EvidenceFactorsPanel';
import { DiagnosisSummaryCard } from './explainability/DiagnosisSummaryCard';
import { Module6HandoverCard } from './explainability/Module6HandoverCard';

interface Module5DashboardProps {
  records: StandardizedAssessmentRecord[];
  targetMap: TargetMappingDictionary;
  courseMeta: CourseMetadata;
  onBackToModule4: () => void;
  onBackToModule3?: () => void;
  onBackToModule2?: () => void;
  onBackToModule1?: () => void;
  onNavigateToModule6?: () => void;
}

export const Module5Dashboard: React.FC<Module5DashboardProps> = ({
  records,
  targetMap,
  courseMeta,
  onBackToModule4,
  onBackToModule3,
  onBackToModule2,
  onBackToModule1,
  onNavigateToModule6
}) => {
  // Extract available courses dynamically
  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.course_id));
    const list = Array.from(set).sort();
    return list.length > 0 ? list : ['CS301'];
  }, [records]);

  // Initial course selection
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

  const [filters, setFilters] = useState<ExplainabilityScopeFilters>({
    courseId,
    semester: availableSemesters[0] || '4',
    predictionAssessment: defaultAssessment,
    coId: availableCOs[0] || 'CO1',
    riskFilter: 'ALL',
    studentId: ''
  });

  // Target threshold lookup (null if not configured)
  const targetThreshold = useMemo(() => {
    const key = `${filters.courseId}|${filters.coId}`;
    return targetMap[key] ?? null;
  }, [targetMap, filters.courseId, filters.coId]);

  // Historical assessments strictly preceding prediction horizon
  const historicalAssessments = useMemo(() => {
    return getHistoricalAssessments(chronologicalAssessments, filters.predictionAssessment);
  }, [chronologicalAssessments, filters.predictionAssessment]);

  // Train prediction model for this course
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

  // Evaluate cohort risk from Module 4
  const { assessments } = useMemo(() => {
    return evaluateCohortRisk(
      predictions,
      allCohortStudentIds,
      filters.courseId,
      filters.coId,
      filters.predictionAssessment,
      targetThreshold,
      hasHistoricalData
    );
  }, [predictions, allCohortStudentIds, filters.courseId, filters.coId, filters.predictionAssessment, targetThreshold, hasHistoricalData]);

  // Dynamically extract students belonging to filtered scope
  const availableStudents = useMemo(() => {
    let list = assessments.map(ra => ({
      studentId: ra.studentId,
      riskLevel: ra.riskLevel,
      priorityRank: ra.priorityRank
    }));

    if (filters.riskFilter !== 'ALL') {
      const targetLevel =
        filters.riskFilter === 'HIGH' ? 'HIGH RISK' :
        filters.riskFilter === 'MEDIUM' ? 'MEDIUM RISK' :
        filters.riskFilter === 'LOW' ? 'LOW RISK' : 'INSUFFICIENT DATA';
      list = list.filter(s => s.riskLevel === targetLevel);
    }

    return list;
  }, [assessments, filters.riskFilter]);

  // Synchronize selected student ID when available students change
  useEffect(() => {
    if (availableStudents.length > 0) {
      const exists = availableStudents.some(s => s.studentId === filters.studentId);
      if (!exists) {
        setFilters(f => ({ ...f, studentId: availableStudents[0].studentId }));
      }
    } else {
      setFilters(f => ({ ...f, studentId: '' }));
    }
  }, [availableStudents, filters.studentId]);

  // Handle course change synchronization
  const handleFilterChange = (newFilters: ExplainabilityScopeFilters) => {
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
        coId: newCOs[0] || 'CO1',
        studentId: ''
      });
    } else {
      setFilters(newFilters);
    }
  };

  // Build the complete student explanation payload
  const studentExplanation = useMemo(() => {
    if (!filters.studentId) return null;
    const matchingPred = predictions.find(p => p.studentId === filters.studentId) || null;
    const matchingRisk = assessments.find(a => a.studentId === filters.studentId) || null;

    return buildStudentExplanation(
      filters.studentId,
      filters.courseId,
      filters.coId,
      filters.predictionAssessment,
      records,
      targetThreshold,
      matchingPred,
      matchingRisk
    );
  }, [filters.studentId, filters.courseId, filters.coId, filters.predictionAssessment, records, targetThreshold, predictions, assessments]);

  return (
    <div className="min-h-screen bg-slate-100/60 pb-20">
      {/* Top Header / Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToModule4}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Module 4 (Risk Detection)</span>
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center space-x-1.5 text-xs text-slate-500">
              {onBackToModule1 && (
                <>
                  <button onClick={onBackToModule1} className="hover:text-indigo-600 font-medium">
                    Module 1: Ingestion
                  </button>
                  <span>/</span>
                </>
              )}
              {onBackToModule2 && (
                <>
                  <button onClick={onBackToModule2} className="hover:text-indigo-600 font-medium">
                    Module 2: Analytics
                  </button>
                  <span>/</span>
                </>
              )}
              {onBackToModule3 && (
                <>
                  <button onClick={onBackToModule3} className="hover:text-indigo-600 font-medium">
                    Module 3: Prediction
                  </button>
                  <span>/</span>
                </>
              )}
              <button onClick={onBackToModule4} className="hover:text-indigo-600 font-medium">
                Module 4: Risk
              </button>
              <span>/</span>
              <span className="font-bold text-slate-900 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                Module 5: Explainability
              </span>
            </nav>
          </div>

          {/* Active Scope Badge */}
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {filters.courseId} • {filters.coId} • Horizon [{filters.predictionAssessment}]
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Section 1: Scope & Diagnostic Filter */}
        <ExplainabilityScopeFilter
          filters={filters}
          onChange={handleFilterChange}
          availableCourses={availableCourses}
          availableAssessments={chronologicalAssessments.map(a => a.assessmentId)}
          availableCOs={availableCOs}
          availableStudents={availableStudents}
          historicalAssessments={historicalAssessments}
          targetThreshold={targetThreshold}
        />

        {studentExplanation ? (
          <>
            {/* Section 2: Student Diagnostic Case Overview */}
            <StudentExplanationOverview payload={studentExplanation} />

            {/* Section 3: Key Evidence Summary */}
            <EvidenceSummary payload={studentExplanation} />

            {/* Section 4: CO Evidence Deep-Dive */}
            <COEvidenceCard
              coEvidence={studentExplanation.coEvidence}
              predictionAssessment={filters.predictionAssessment}
            />

            {/* Section 5: Topic Diagnosis Table */}
            <TopicDiagnosisTable
              topics={studentExplanation.topics}
              targetThreshold={targetThreshold}
            />

            {/* Section 6: Question Diagnosis Table */}
            <QuestionDiagnosisTable questions={studentExplanation.questions} />

            {/* Section 7: Assessment Evidence Chart */}
            <AssessmentEvidenceChart
              coProgression={studentExplanation.coEvidence.progression}
              topics={studentExplanation.topics}
              predictionAssessment={filters.predictionAssessment}
              historicalAssessments={historicalAssessments}
              targetThreshold={targetThreshold}
            />

            {/* Section 8: Traceable Evidence Factors */}
            <EvidenceFactorsPanel factors={studentExplanation.evidenceFactors} />

            {/* Section 9: Faculty Diagnostic Synthesis Summary */}
            <DiagnosisSummaryCard
              summary={studentExplanation.diagnosisSummary}
              studentId={studentExplanation.studentId}
              coId={studentExplanation.coId}
            />

            {/* Section 10: Module 6 Handover Card */}
            <Module6HandoverCard
              payload={studentExplanation}
              onNavigateToModule6={onNavigateToModule6}
            />
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-2">
            <h3 className="font-bold text-slate-700 text-sm">No Student Record Selected</h3>
            <p>Select a student from the dropdown above to view the root-cause diagnosis and evidence attribution.</p>
          </div>
        )}
      </main>
    </div>
  );
};
