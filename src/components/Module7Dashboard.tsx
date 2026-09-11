import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, BookOpen, RefreshCw, AlertCircle, Database } from 'lucide-react';
import {
  StandardizedAssessmentRecord,
  TargetMappingDictionary,
  CourseMetadata,
  InterventionRecord
} from '../types/dataTypes';
import { parseCSVString } from '../services/csvParser';
import {
  identifyReassessmentAssessment,
  buildStudentLearningProfile,
  buildCohortOutcomeSummary,
  buildModule8HandoverPayload
} from '../services/reassessmentEngine';

import { ReassessmentScopeFilter, ReassessmentFilterState } from './reassessment/ReassessmentScopeFilter';
import { ApprovedInterventionSelector } from './reassessment/ApprovedInterventionSelector';
import { ReassessmentDataStatus } from './reassessment/ReassessmentDataStatus';
import { LearningOutcomeOverview } from './reassessment/LearningOutcomeOverview';
import { BeforeAfterChart } from './reassessment/BeforeAfterChart';
import { TopicLearningGainTable } from './reassessment/TopicLearningGainTable';
import { QuestionLearningGainTable } from './reassessment/QuestionLearningGainTable';
import { TargetAchievementPanel } from './reassessment/TargetAchievementPanel';
import { ReassessmentEvidencePanel } from './reassessment/ReassessmentEvidencePanel';
import { CohortOutcomeSummary } from './reassessment/CohortOutcomeSummary';
import { Module8HandoverCard } from './reassessment/Module8HandoverCard';

interface Module7DashboardProps {
  records: StandardizedAssessmentRecord[];
  targetMap: TargetMappingDictionary;
  courseMeta: CourseMetadata;
  onBackToModule6: () => void;
  onBackToModule5?: () => void;
  onBackToModule4?: () => void;
  onBackToModule3?: () => void;
  onBackToModule2?: () => void;
  onBackToModule1?: () => void;
  onNavigateToModule8?: () => void;
}

const STORAGE_KEY = 'ai_course_outcome_interventions';

export const Module7Dashboard: React.FC<Module7DashboardProps> = ({
  records,
  targetMap,
  courseMeta,
  onBackToModule6,
  onBackToModule5,
  onBackToModule4,
  onBackToModule3,
  onBackToModule2,
  onBackToModule1,
  onNavigateToModule8
}) => {
  // Load approved interventions from Module 6 state/localStorage
  const [interventions] = useState<InterventionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: InterventionRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    // Default sample approved cases if none exist in localStorage
    return [
      {
        interventionId: 'intv-sample-s001',
        studentId: 'S001',
        courseId: 'CS301',
        coId: 'CO1',
        topic: 'Process Scheduling',
        interventionType: 'Concept Reinforcement',
        priority: 'CRITICAL',
        reason: 'Topic attainment is 42.5% (< 50% Critical Weakness). High-intensity concept reinforcement approved.',
        status: 'Approved',
        facultyNotes: 'Scheduled for 1-on-1 clinic session with TA on Thursday.',
        createdAt: new Date().toISOString()
      },
      {
        interventionId: 'intv-sample-s002',
        studentId: 'S002',
        courseId: 'CS301',
        coId: 'CO1',
        topic: 'Process Scheduling',
        interventionType: 'Targeted Question Practice',
        priority: 'HIGH',
        reason: 'Topic attainment is 58.0% (below 70% target). Problem set assigned.',
        status: 'Approved',
        facultyNotes: 'Assigned practice set #4 focusing on turnaround time calculation.',
        createdAt: new Date().toISOString()
      },
      {
        interventionId: 'intv-sample-s003',
        studentId: 'S003',
        courseId: 'CS301',
        coId: 'CO3',
        topic: 'Deadlock Handling',
        interventionType: 'Guided Practice',
        priority: 'CRITICAL',
        reason: 'Deadlock avoidance problem sets deficit. Lab exercise supervised.',
        status: 'Approved',
        facultyNotes: 'Attended supervised lab on Banker algorithm simulation.',
        createdAt: new Date().toISOString()
      }
    ];
  });

  // Synthetic demonstration data state
  const [syntheticRecords, setSyntheticRecords] = useState<StandardizedAssessmentRecord[]>([]);
  const [isSyntheticLoaded, setIsSyntheticLoaded] = useState<boolean>(false);

  // Toggle or load synthetic demonstration dataset (R1)
  const handleToggleSyntheticData = async () => {
    if (isSyntheticLoaded) {
      setSyntheticRecords([]);
      setIsSyntheticLoaded(false);
      return;
    }

    try {
      const resp = await fetch('/sample-data/sample_reassessment.csv');
      if (!resp.ok) throw new Error('File not found');
      const text = await resp.text();
      const parsed = parseCSVString<any>(text);

      const mapped: StandardizedAssessmentRecord[] = parsed.rows.map((r, idx) => ({
        rowNumber: 10000 + idx,
        student_id: (r.student_id || '').trim().toUpperCase(),
        course_id: (r.course_id || '').trim().toUpperCase(),
        semester: parseInt((r.semester || '4').trim(), 10) || 4,
        assessment_id: (r.assessment_id || 'R1').trim().toUpperCase(),
        assessment_type: (r.assessment_type || 'Reassessment').trim(),
        assessment_date: (r.assessment_date || '2026-09-15').trim(),
        question_id: (r.question_id || '').trim().toUpperCase(),
        topic: (r.topic || '').trim(),
        co_id: (r.co_id || '').trim().toUpperCase(),
        marks_obtained: parseFloat((r.marks_obtained || '0').trim()) || 0,
        max_marks: parseFloat((r.max_marks || '10').trim()) || 10
      }));

      setSyntheticRecords(mapped);
      setIsSyntheticLoaded(true);
    } catch (err) {
      console.warn('Could not fetch /sample-data/sample_reassessment.csv, loading fallback demo records:', err);
      // Fallback demo records if fetch fails
      const fallbackDemo: StandardizedAssessmentRecord[] = [
        { rowNumber: 10001, student_id: 'S001', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q01', topic: 'Process Scheduling', co_id: 'CO1', marks_obtained: 8.5, max_marks: 10 },
        { rowNumber: 10002, student_id: 'S001', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q02', topic: 'Process Scheduling', co_id: 'CO1', marks_obtained: 8.0, max_marks: 10 },
        { rowNumber: 10003, student_id: 'S001', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q03', topic: 'CPU Scheduling Algorithms', co_id: 'CO1', marks_obtained: 7.5, max_marks: 10 },
        { rowNumber: 10004, student_id: 'S001', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q04', topic: 'CPU Scheduling Algorithms', co_id: 'CO1', marks_obtained: 8.0, max_marks: 10 },
        { rowNumber: 10005, student_id: 'S001', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q05', topic: 'Deadlocks', co_id: 'CO2', marks_obtained: 8.5, max_marks: 10 },
        { rowNumber: 10006, student_id: 'S001', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q06', topic: 'Deadlock Prevention', co_id: 'CO2', marks_obtained: 8.0, max_marks: 10 },
        { rowNumber: 10007, student_id: 'S001', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q07', topic: 'Deadlocks', co_id: 'CO2', marks_obtained: 8.5, max_marks: 10 },
        { rowNumber: 10008, student_id: 'S001', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q08', topic: 'Deadlock Prevention', co_id: 'CO2', marks_obtained: 9.0, max_marks: 10 },
        { rowNumber: 10009, student_id: 'S002', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q05', topic: 'Deadlocks', co_id: 'CO2', marks_obtained: 7.5, max_marks: 10 },
        { rowNumber: 10010, student_id: 'S002', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q06', topic: 'Deadlock Prevention', co_id: 'CO2', marks_obtained: 7.0, max_marks: 10 },
        { rowNumber: 10011, student_id: 'S002', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q07', topic: 'Deadlocks', co_id: 'CO2', marks_obtained: 7.5, max_marks: 10 },
        { rowNumber: 10012, student_id: 'S002', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q08', topic: 'Deadlock Prevention', co_id: 'CO2', marks_obtained: 8.0, max_marks: 10 },
        { rowNumber: 10013, student_id: 'S001', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q09', topic: 'Deadlock Handling', co_id: 'CO3', marks_obtained: 7.5, max_marks: 10 },
        { rowNumber: 10014, student_id: 'S001', course_id: 'CS301', semester: 4, assessment_id: 'R1', assessment_type: 'Reassessment', assessment_date: '2026-09-15', question_id: 'Q10', topic: 'Resource Allocation Graphs', co_id: 'CO3', marks_obtained: 7.0, max_marks: 10 }
      ];
      setSyntheticRecords(fallbackDemo);
      setIsSyntheticLoaded(true);
    }
  };

  // Auto-load synthetic demonstration data on initial mount if not already present
  useEffect(() => {
    const hasReassessment = records.some(r => r.assessment_id.toUpperCase() === 'R1');
    if (!hasReassessment && !isSyntheticLoaded && syntheticRecords.length === 0) {
      handleToggleSyntheticData();
    }
  }, []);

  // Merged assessment records
  const allRecords = useMemo(() => {
    return isSyntheticLoaded ? [...records, ...syntheticRecords] : records;
  }, [records, syntheticRecords, isSyntheticLoaded]);

  // Approved only interventions
  const approvedInterventions = useMemo(() => {
    return interventions.filter(i => i.status === 'Approved');
  }, [interventions]);

  // Available courses
  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach(r => set.add(r.course_id));
    const list = Array.from(set).sort();
    return list.length > 0 ? list : ['CS301'];
  }, [allRecords]);

  // Available COs
  const availableCOs = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach(r => {
      if (r.course_id.toUpperCase() === (courseMeta.courseId || 'CS301').toUpperCase() || courseMeta.courseId === 'ALL') {
        set.add(r.co_id);
      }
    });
    const list = Array.from(set).sort();
    return list.length > 0 ? list : ['CO1'];
  }, [allRecords, courseMeta.courseId]);

  // Filter state
  const [filters, setFilters] = useState<ReassessmentFilterState>(() => {
    const firstApproved = approvedInterventions[0];
    return {
      courseId: firstApproved?.courseId || availableCourses[0] || 'CS301',
      semester: '4',
      coId: firstApproved?.coId || availableCOs[0] || 'CO1',
      studentId: firstApproved?.studentId || 'S001',
      interventionId: firstApproved?.interventionId || '',
      reassessmentAssessmentId: isSyntheticLoaded ? 'R1' : 'R1'
    };
  });

  // Available reassessments (chronologically subsequent to baseline A2)
  const availableReassessments = useMemo(() => {
    const list = identifyReassessmentAssessment(allRecords, filters.courseId, 'A2');
    if (list.length > 0) return list;
    // If no subsequent assessments exist in original records, check if R1 exists
    const hasR1 = allRecords.some(r => r.assessment_id.toUpperCase() === 'R1');
    if (hasR1) {
      return [{ assessmentId: 'R1', date: '2026-09-15', sequenceIndex: 10 }];
    }
    return [{ assessmentId: 'R1', date: '2026-09-15', sequenceIndex: 10 }];
  }, [allRecords, filters.courseId]);

  // Ensure an approved intervention is active
  const activeIntervention = useMemo(() => {
    if (filters.interventionId) {
      const found = approvedInterventions.find(i => i.interventionId === filters.interventionId);
      if (found) return found;
    }
    // Match by student & course
    const byStudent = approvedInterventions.find(
      i => i.studentId === filters.studentId && i.courseId === filters.courseId
    );
    if (byStudent) return byStudent;

    return approvedInterventions[0];
  }, [approvedInterventions, filters.interventionId, filters.studentId, filters.courseId]);

  // Synchronize filters when active intervention changes
  useEffect(() => {
    if (activeIntervention) {
      if (
        filters.studentId !== activeIntervention.studentId ||
        filters.coId !== activeIntervention.coId ||
        filters.courseId !== activeIntervention.courseId ||
        filters.interventionId !== activeIntervention.interventionId
      ) {
        setFilters(f => ({
          ...f,
          studentId: activeIntervention.studentId,
          courseId: activeIntervention.courseId,
          coId: activeIntervention.coId,
          interventionId: activeIntervention.interventionId
        }));
      }
    }
  }, [activeIntervention]);

  // Institutional target threshold
  const targetThreshold = useMemo(() => {
    const key = `${filters.courseId}|${filters.coId}`;
    return targetMap[key] ?? null;
  }, [targetMap, filters.courseId, filters.coId]);

  // Build complete student learning profile
  const studentProfile = useMemo(() => {
    if (!activeIntervention) return null;

    return buildStudentLearningProfile(
      filters.studentId,
      filters.courseId,
      filters.coId,
      filters.reassessmentAssessmentId || 'R1',
      allRecords,
      targetThreshold,
      activeIntervention
    );
  }, [filters.studentId, filters.courseId, filters.coId, filters.reassessmentAssessmentId, allRecords, targetThreshold, activeIntervention]);

  // Build cohort outcome summary across all approved cases
  const cohortSummary = useMemo(() => {
    const profiles = approvedInterventions.map(intv => {
      return buildStudentLearningProfile(
        intv.studentId,
        intv.courseId,
        intv.coId,
        filters.reassessmentAssessmentId || 'R1',
        allRecords,
        targetThreshold,
        intv
      );
    });

    return buildCohortOutcomeSummary(profiles);
  }, [approvedInterventions, filters.reassessmentAssessmentId, allRecords, targetThreshold]);

  // Module 8 Handover Payload
  const module8Payload = useMemo(() => {
    if (!studentProfile) return null;
    return buildModule8HandoverPayload(studentProfile);
  }, [studentProfile]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToModule6}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Module 6 (Intervention)</span>
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
              {onBackToModule5 && (
                <>
                  <button onClick={onBackToModule5} className="hover:text-indigo-600 font-medium">
                    Module 5: Diagnosis
                  </button>
                  <span>/</span>
                </>
              )}
              <button onClick={onBackToModule6} className="hover:text-indigo-600 font-medium">
                Module 6: Intervention
              </button>
              <span>/</span>
              <span className="font-bold text-slate-900 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Module 7: Reassessment
              </span>
              {onNavigateToModule8 && (
                <>
                  <span>/</span>
                  <button onClick={onNavigateToModule8} className="hover:text-indigo-600 font-medium">
                    Module 8: CO Report
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Active Scope Badge */}
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {filters.courseId} • {filters.coId} • Reassessment [{filters.reassessmentAssessmentId}]
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Synthetic Demonstration Banner (if active) */}
        {isSyntheticLoaded && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-900 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <Database className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>SYNTHETIC DEMONSTRATION DATA ACTIVE:</strong> Post-intervention reassessment records from cycle <code>R1</code> (2026-09-15) are loaded for functional verification. This is synthetic test data and does not represent real institutional records.
              </span>
            </div>
            <button
              onClick={handleToggleSyntheticData}
              className="text-xs font-bold px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 cursor-pointer"
            >
              Unload
            </button>
          </div>
        )}

        {/* Section 1: Scope & Reassessment Filter */}
        <ReassessmentScopeFilter
          filters={filters}
          onChange={setFilters}
          availableCourses={availableCourses}
          availableCOs={availableCOs}
          approvedInterventions={approvedInterventions}
          availableReassessments={availableReassessments}
          isSyntheticLoaded={isSyntheticLoaded}
          onToggleSyntheticData={handleToggleSyntheticData}
        />

        {/* Section 2: Approved Intervention Candidate Selector */}
        <ApprovedInterventionSelector
          interventions={approvedInterventions}
          selectedInterventionId={filters.interventionId}
          onSelectIntervention={(intv) => {
            setFilters(f => ({
              ...f,
              interventionId: intv.interventionId,
              studentId: intv.studentId,
              courseId: intv.courseId,
              coId: intv.coId
            }));
          }}
          onNavigateToModule6={onBackToModule6}
        />

        {studentProfile ? (
          <>
            {/* Section 3: Data Sufficiency Status */}
            <ReassessmentDataStatus
              report={studentProfile.sufficiency}
              reassessmentAssessmentId={filters.reassessmentAssessmentId}
            />

            {/* Section 4: Learning Outcome & Gain Overview */}
            <LearningOutcomeOverview
              metrics={studentProfile.learningGains}
              targetThreshold={targetThreshold}
              effectiveness={studentProfile.effectiveness}
              isSufficient={studentProfile.sufficiency.status !== 'INSUFFICIENT'}
            />

            {/* Section 5: Before vs After Chart */}
            <BeforeAfterChart
              preAttainment={studentProfile.learningGains.preAttainment}
              postAttainment={studentProfile.learningGains.postAttainment}
              targetThreshold={targetThreshold}
              coId={filters.coId}
            />

            {/* Section 6: Topic Learning Gain Table */}
            <TopicLearningGainTable topics={studentProfile.topicComparisons} />

            {/* Section 7: Question Learning Gain Table */}
            <QuestionLearningGainTable
              questions={studentProfile.questionComparisons}
              matchDirectly={studentProfile.questionsMatchDirectly}
            />

            {/* Section 8: Target Achievement Panel */}
            <TargetAchievementPanel
              postAttainment={studentProfile.learningGains.postAttainment}
              targetThreshold={targetThreshold}
              coId={filters.coId}
              studentId={studentProfile.studentId}
            />

            {/* Section 9: Reassessment Evidence Panel */}
            <ReassessmentEvidencePanel profile={studentProfile} />

            {/* Section 10: Cohort Outcome Summary */}
            <CohortOutcomeSummary summary={cohortSummary} />

            {/* Section 11: Module 8 Handover Card */}
            {module8Payload && (
              <Module8HandoverCard
                payload={module8Payload}
                onNavigateToModule8={onNavigateToModule8}
              />
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-2">
            <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">No Approved Case Selected</h3>
            <p>Select an approved intervention candidate from Section 2 to evaluate closed-loop reassessment performance.</p>
          </div>
        )}
      </main>
    </div>
  );
};

