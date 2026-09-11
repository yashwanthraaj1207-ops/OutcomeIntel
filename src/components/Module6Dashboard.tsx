import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, BookOpen, Stethoscope } from 'lucide-react';
import {
  StandardizedAssessmentRecord,
  TargetMappingDictionary,
  CourseMetadata,
  InterventionScopeFilters,
  InterventionRecommendation,
  InterventionRecord,
  InterventionStatus,
  InterventionPriority
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
import {
  buildStudentExplanation
} from '../services/explainabilityEngine';
import {
  classifyInterventionPriority,
  generateInterventionOptions,
  createInterventionRecord
} from '../services/interventionEngine';

import { InterventionScopeFilter, InterventionStudentOption } from './intervention/InterventionScopeFilter';
import { InterventionOverview } from './intervention/InterventionOverview';
import { PrioritySummary, PriorityCounts } from './intervention/PrioritySummary';
import { InterventionRecommendationCard } from './intervention/InterventionRecommendationCard';
import { InterventionEvidencePanel } from './intervention/InterventionEvidencePanel';
import { InterventionOptionsTable } from './intervention/InterventionOptionsTable';
import { FacultyApprovalPanel } from './intervention/FacultyApprovalPanel';
import { InterventionLog } from './intervention/InterventionLog';
import { Module7HandoverCard } from './intervention/Module7HandoverCard';

interface Module6DashboardProps {
  records: StandardizedAssessmentRecord[];
  targetMap: TargetMappingDictionary;
  courseMeta: CourseMetadata;
  onBackToModule5: () => void;
  onBackToModule4?: () => void;
  onBackToModule3?: () => void;
  onBackToModule2?: () => void;
  onBackToModule1?: () => void;
  onNavigateToModule7?: () => void;
}

const STORAGE_KEY = 'ai_course_outcome_interventions';

export const Module6Dashboard: React.FC<Module6DashboardProps> = ({
  records,
  targetMap,
  courseMeta,
  onBackToModule5,
  onBackToModule4,
  onBackToModule3,
  onBackToModule2,
  onBackToModule1,
  onNavigateToModule7
}) => {
  // Available courses
  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.course_id));
    const list = Array.from(set).sort();
    return list.length > 0 ? list : ['CS301'];
  }, [records]);

  const initialCourse = useMemo(() => {
    if (courseMeta.courseId && courseMeta.courseId !== 'ALL' && availableCourses.includes(courseMeta.courseId)) {
      return courseMeta.courseId;
    }
    return availableCourses[0];
  }, [courseMeta.courseId, availableCourses]);

  const [courseId, setCourseId] = useState<string>(initialCourse);

  // Chronological assessments
  const chronologicalAssessments = useMemo(() => {
    return getChronologicalAssessments(records, courseId);
  }, [records, courseId]);

  const defaultAssessment = useMemo(() => {
    if (chronologicalAssessments.length > 0) {
      return chronologicalAssessments[chronologicalAssessments.length - 1].assessmentId;
    }
    return 'A3';
  }, [chronologicalAssessments]);

  // Available COs
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

  const [filters, setFilters] = useState<InterventionScopeFilters>({
    courseId,
    semester: '4',
    predictionAssessment: defaultAssessment,
    coId: availableCOs[0] || 'CO1',
    riskFilter: 'ALL',
    priorityFilter: 'ALL',
    studentId: ''
  });

  // Target threshold
  const targetThreshold = useMemo(() => {
    const key = `${filters.courseId}|${filters.coId}`;
    return targetMap[key] ?? null;
  }, [targetMap, filters.courseId, filters.coId]);

  // Train prediction model
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

  // Quick risk lookup by student ID
  const riskByStudent = useMemo(() => {
    const map = new Map<string, typeof assessments[0]>();
    assessments.forEach(r => map.set(r.studentId, r));
    return map;
  }, [assessments]);

  // Full cohort explanations & priority classifications
  const cohortDiagnoses = useMemo(() => {
    return predictions.map(pred => {
      const risk = riskByStudent.get(pred.studentId) || null;
      const explanation = buildStudentExplanation(
        pred.studentId,
        filters.courseId,
        filters.coId,
        filters.predictionAssessment,
        records,
        targetThreshold,
        pred,
        risk
      );
      const priority = classifyInterventionPriority(explanation);
      return {
        studentId: pred.studentId,
        riskLevel: risk ? risk.riskLevel : 'LOW RISK',
        priority,
        explanation
      };
    });
  }, [predictions, riskByStudent, filters.courseId, filters.coId, filters.predictionAssessment, records, targetThreshold]);

  // Cohort priority distribution summary
  const priorityCounts: PriorityCounts = useMemo(() => {
    let critical = 0;
    let high = 0;
    let moderate = 0;
    let low = 0;
    cohortDiagnoses.forEach(c => {
      if (c.priority === 'CRITICAL') critical++;
      else if (c.priority === 'HIGH') high++;
      else if (c.priority === 'MODERATE') moderate++;
      else if (c.priority === 'LOW') low++;
    });
    return {
      critical,
      high,
      moderate,
      low,
      total: cohortDiagnoses.length
    };
  }, [cohortDiagnoses]);

  // Available students for selector (filtered by risk and priority)
  const availableStudents: InterventionStudentOption[] = useMemo(() => {
    const targetRiskLevel =
      filters.riskFilter === 'HIGH' ? 'HIGH RISK' :
      filters.riskFilter === 'MEDIUM' ? 'MEDIUM RISK' :
      filters.riskFilter === 'LOW' ? 'LOW RISK' :
      filters.riskFilter === 'INSUFFICIENT' ? 'INSUFFICIENT DATA' : null;

    return cohortDiagnoses
      .filter(item => {
        const matchesRisk = targetRiskLevel === null || item.riskLevel === targetRiskLevel;
        const matchesPriority = filters.priorityFilter === 'ALL' || item.priority === filters.priorityFilter;
        return matchesRisk && matchesPriority;
      })
      .map(item => ({
        studentId: item.studentId,
        riskLevel: item.riskLevel,
        priority: item.priority
      }));
  }, [cohortDiagnoses, filters.riskFilter, filters.priorityFilter]);

  // Ensure an active student is selected
  useEffect(() => {
    if (availableStudents.length > 0) {
      const currentSelected = availableStudents.find(s => s.studentId === filters.studentId);
      if (!currentSelected) {
        setFilters(f => ({ ...f, studentId: availableStudents[0].studentId }));
      }
    } else {
      setFilters(f => ({ ...f, studentId: '' }));
    }
  }, [availableStudents, filters.studentId]);

  // Explanation for the currently selected student
  const activeStudentCase = useMemo(() => {
    if (!filters.studentId) return null;
    return cohortDiagnoses.find(c => c.studentId === filters.studentId) || null;
  }, [cohortDiagnoses, filters.studentId]);

  // Intervention options for the active student
  const interventionOptions = useMemo(() => {
    if (!activeStudentCase) return [];
    return generateInterventionOptions(activeStudentCase.explanation);
  }, [activeStudentCase]);

  // Currently selected recommendation for review
  const [selectedRecommendation, setSelectedRecommendation] = useState<InterventionRecommendation | null>(null);

  // Auto-select primary option when active student changes
  useEffect(() => {
    if (interventionOptions.length > 0) {
      setSelectedRecommendation(interventionOptions[0]);
    } else {
      setSelectedRecommendation(null);
    }
  }, [activeStudentCase?.studentId]);

  // Auditable Session Intervention Log (persisted to localStorage)
  const [interventionLog, setInterventionLog] = useState<InterventionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const saveInterventionLog = (updated: InterventionRecord[]) => {
    setInterventionLog(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearLog = () => {
    saveInterventionLog([]);
  };

  // Find active record for current student (if any)
  const activeStudentRecord = useMemo(() => {
    if (!filters.studentId) return undefined;
    return interventionLog.find(r => r.studentId === filters.studentId && r.courseId === filters.courseId && r.coId === filters.coId);
  }, [interventionLog, filters.studentId, filters.courseId, filters.coId]);

  // Handle Faculty Decision (Approve or Reject)
  const handleSaveDecision = (
    recommendation: InterventionRecommendation,
    status: InterventionStatus,
    notes: string
  ) => {
    if (!activeStudentCase) return;

    const newRecord = createInterventionRecord(
      activeStudentCase.explanation,
      recommendation,
      status,
      notes
    );

    // Replace previous record for same student/course/co or append
    const filtered = interventionLog.filter(
      r => !(r.studentId === newRecord.studentId && r.courseId === newRecord.courseId && r.coId === newRecord.coId)
    );
    saveInterventionLog([...filtered, newRecord]);
  };

  // Count approved interventions for Module 7 handover
  const approvedRecords = useMemo(() => {
    return interventionLog.filter(r => r.status === 'Approved');
  }, [interventionLog]);

  const handleFilterChange = (updated: InterventionScopeFilters) => {
    if (updated.courseId !== courseId) {
      setCourseId(updated.courseId);
    }
    setFilters(updated);
  };

  const handlePriorityFilterSelect = (p: 'ALL' | InterventionPriority) => {
    setFilters(f => ({ ...f, priorityFilter: p }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToModule5}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Module 5 (Diagnosis)</span>
            </button>

            {/* Breadcrumb Navigation */}
            <nav className="hidden md:flex items-center space-x-2 text-xs text-slate-400">
              <span>/</span>
              {onBackToModule1 && (
                <>
                  <button onClick={onBackToModule1} className="hover:text-indigo-600 font-medium">
                    Module 1: Upload
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
              {onBackToModule4 && (
                <>
                  <button onClick={onBackToModule4} className="hover:text-indigo-600 font-medium">
                    Module 4: Risk
                  </button>
                  <span>/</span>
                </>
              )}
              <button onClick={onBackToModule5} className="hover:text-indigo-600 font-medium">
                Module 5: Diagnosis
              </button>
              <span>/</span>
              <span className="font-bold text-slate-900 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                <Stethoscope className="h-3 w-3" /> Module 6: Intervention
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
        {/* Section 1: Scope & Filter Controls */}
        <InterventionScopeFilter
          filters={filters}
          onChange={handleFilterChange}
          availableCourses={availableCourses}
          availableAssessments={chronologicalAssessments.map(a => a.assessmentId)}
          availableCOs={availableCOs}
          availableStudents={availableStudents}
          targetThreshold={targetThreshold}
        />

        {/* Section 3: Cohort Priority Distribution Summary */}
        <PrioritySummary
          counts={priorityCounts}
          selectedPriority={filters.priorityFilter}
          onSelectPriority={handlePriorityFilterSelect}
        />

        {activeStudentCase ? (
          <>
            {/* Section 2: Student Diagnostic Case Overview */}
            <InterventionOverview
              explanation={activeStudentCase.explanation}
              priority={activeStudentCase.priority}
              activeRecord={activeStudentRecord}
            />

            {/* Section 4: Primary Recommended Action Card */}
            {selectedRecommendation && (
              <InterventionRecommendationCard
                recommendation={selectedRecommendation}
                isSelected={true}
                onSelect={(rec) => setSelectedRecommendation(rec)}
                activeRecord={activeStudentRecord}
                explanation={activeStudentCase.explanation}
                priority={activeStudentCase.priority}
                onSaveDecision={handleSaveDecision}
              />
            )}

            {/* Section 5: Pedagogical Evidence Traceability Chain */}
            <InterventionEvidencePanel
              explanation={activeStudentCase.explanation}
              selectedIntervention={selectedRecommendation}
            />

            {/* Section 6: Available Remediation Options Catalog */}
            <InterventionOptionsTable
              options={interventionOptions}
              selectedOption={selectedRecommendation}
              onSelectOption={(opt) => setSelectedRecommendation(opt)}
              activeRecord={activeStudentRecord}
            />

            {/* Section 7: Faculty Review & Approval Workflow */}
            <FacultyApprovalPanel
              studentId={activeStudentCase.studentId}
              selectedRecommendation={selectedRecommendation}
              activeRecord={activeStudentRecord}
              onSaveDecision={handleSaveDecision}
            />

            {/* Section 8: Auditable Session Intervention Log */}
            <InterventionLog
              records={interventionLog}
              onClearLog={handleClearLog}
            />

            {/* Section 9: Handover to Module 7 (Reassessment) */}
            <Module7HandoverCard
              approvedCount={approvedRecords.length}
              approvedRecords={approvedRecords}
              onNavigateToModule7={onNavigateToModule7}
            />
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-2">
            <h3 className="font-bold text-slate-700 text-sm">No Student Selected Matching Current Filters</h3>
            <p>Adjust your Risk or Priority filter in Section 1 to select an eligible student case for intervention planning.</p>
          </div>
        )}
      </main>
    </div>
  );
};
