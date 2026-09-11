import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, BookOpen, FileText, Database } from 'lucide-react';
import {
  StandardizedAssessmentRecord,
  TargetMappingDictionary,
  CourseMetadata,
  InterventionRecord,
  ReportScopeFilters,
  StudentLearningProfile
} from '../types/dataTypes';
import { FullValidationResult } from '../services/validationEngine';
import { parseCSVString } from '../services/csvParser';
import {
  buildStudentLearningProfile,
  buildCohortOutcomeSummary
} from '../services/reassessmentEngine';
import {
  buildFinalCOReport,
  getTargetThreshold
} from '../services/reportEngine';

import { ReportScopeFilter } from './report/ReportScopeFilter';
import { ReportHeader } from './report/ReportHeader';
import { ExecutiveHealthSummary } from './report/ExecutiveHealthSummary';
import { EvidenceChainBanner } from './common/EvidenceChainBanner';
import { CourseOutcomeExecutiveSummary } from './report/CourseOutcomeExecutiveSummary';
import { COProgressionReport } from './report/COProgressionReport';
import { TopicIntelligenceTable } from './report/TopicIntelligenceTable';
import { StudentRiskSummary } from './report/StudentRiskSummary';
import { InterventionOutcomeTable } from './report/InterventionOutcomeTable';
import { LearningGainSummary } from './report/LearningGainSummary';
import { EvidenceTraceabilityPanel } from './report/EvidenceTraceabilityPanel';
import { AcademicAttentionPanel } from './report/AcademicAttentionPanel';
import { DataQualityReport } from './report/DataQualityReport';
import { ReportMethodology } from './report/ReportMethodology';
import { ReportExportPanel } from './report/ReportExportPanel';
import { History, BookmarkCheck, GitCompare, CheckCircle2 } from 'lucide-react';
import { createSnapshotFromReport, saveRun, getAllRuns } from '../services/historyService';
import { getCurrentUser } from '../services/authService';
import { useToast } from './common/Toast';

interface Module8DashboardProps {
  records: StandardizedAssessmentRecord[];
  targetMap: TargetMappingDictionary;
  courseMeta: CourseMetadata;
  validationResult: FullValidationResult;
  onBackToModule7: () => void;
  onBackToModule6?: () => void;
  onBackToModule5?: () => void;
  onBackToModule4?: () => void;
  onBackToModule3?: () => void;
  onBackToModule2?: () => void;
  onBackToModule1?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToComparison?: (runAId: string, runBId: string) => void;
}

const STORAGE_KEY = 'ai_course_outcome_interventions';

export const Module8Dashboard: React.FC<Module8DashboardProps> = ({
  records,
  targetMap,
  courseMeta,
  validationResult,
  onBackToModule7,
  onBackToModule6,
  onBackToModule5,
  onBackToModule4,
  onBackToModule3,
  onBackToModule2,
  onBackToModule1,
  onNavigateToHistory,
  onNavigateToComparison
}) => {
  // Load approved interventions from Module 6
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
      // Fallback below
    }

    return [
      {
        interventionId: 'intv-sample-s001',
        studentId: 'S001',
        courseId: 'CS301',
        coId: 'CO2',
        topic: 'Virtual Memory & Paging',
        interventionType: 'Peer Learning',
        priority: 'CRITICAL',
        reason: 'Severe diagnostic deficit on page table translation questions (28.0% attainment).',
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

  // Synthetic demonstration records (Cycle R1)
  const [syntheticRecords, setSyntheticRecords] = useState<StandardizedAssessmentRecord[]>([]);
  const [isSyntheticLoaded, setIsSyntheticLoaded] = useState<boolean>(false);

  // Automatically check if cycle R1 is already loaded in primary records
  const hasExistingReassessment = useMemo(() => {
    return records.some(r => r.assessment_id.toUpperCase().startsWith('R'));
  }, [records]);

  // Combined dataset (Primary + Synthetic if loaded)
  const effectiveRecords = useMemo(() => {
    if (syntheticRecords.length === 0) return records;
    return [...records, ...syntheticRecords];
  }, [records, syntheticRecords]);

  // Available courses
  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    effectiveRecords.forEach(r => set.add(r.course_id));
    return Array.from(set).sort();
  }, [effectiveRecords]);

  // Default course selection
  const initialCourse = useMemo(() => {
    if (courseMeta.courseId !== 'ALL' && courseMeta.courseId.trim().length > 0) {
      return courseMeta.courseId;
    }
    return availableCourses[0] || 'CS301';
  }, [courseMeta.courseId, availableCourses]);

  // Filter state
  const [filters, setFilters] = useState<ReportScopeFilters>({
    courseId: initialCourse,
    semester: courseMeta.semester || '4',
    section: courseMeta.section || 'Cohort 2026',
    coId: 'ALL',
    riskFilter: 'ALL',
    priorityFilter: 'ALL',
    reassessmentStatus: 'ALL'
  });

  // Keep filters in sync if initialCourse updates
  useEffect(() => {
    if (filters.courseId === 'ALL' && initialCourse) {
      setFilters(prev => ({ ...prev, courseId: initialCourse }));
    }
  }, [initialCourse]);

  // Available COs for selected course
  const availableCOs = useMemo(() => {
    const set = new Set<string>();
    effectiveRecords.forEach(r => {
      if (filters.courseId === 'ALL' || r.course_id.toUpperCase() === filters.courseId.toUpperCase()) {
        set.add(r.co_id);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [effectiveRecords, filters.courseId]);

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
      const parsed = parseCSVString<Record<string, string>>(text);

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
        marks_obtained: parseFloat(r.marks_obtained) || 0,
        max_marks: parseFloat(r.max_marks) || 10
      }));

      setSyntheticRecords(mapped);
      setIsSyntheticLoaded(true);
    } catch {
      // If fetch fails (e.g. In non-browser testing), toggle off
      setIsSyntheticLoaded(false);
    }
  };

  // Evaluate StudentLearningProfiles for approved interventions across reassessment records
  const reassessmentProfiles = useMemo(() => {
    const profiles: StudentLearningProfile[] = [];
    const reassessmentAssessmentId = 'R1';

    interventions.forEach(intv => {
      const targetThreshold = getTargetThreshold(targetMap, intv.courseId, intv.coId);
      const profile = buildStudentLearningProfile(
        intv.studentId,
        intv.courseId,
        intv.coId,
        reassessmentAssessmentId,
        effectiveRecords,
        targetThreshold,
        intv
      );
      profiles.push(profile);
    });

    return profiles;
  }, [interventions, effectiveRecords, targetMap]);

  // Cohort Outcome Summary from Module 7
  const cohortOutcomeSummary = useMemo(() => {
    if (reassessmentProfiles.length === 0) return null;
    return buildCohortOutcomeSummary(reassessmentProfiles);
  }, [reassessmentProfiles]);

  // Generate complete unified CO Intelligence Report via Module 8 Engine
  const fullReport = useMemo(() => {
    const isSynthetic = isSyntheticLoaded || hasExistingReassessment;
    return buildFinalCOReport(
      effectiveRecords,
      targetMap,
      courseMeta,
      filters,
      validationResult,
      interventions,
      reassessmentProfiles,
      cohortOutcomeSummary,
      isSynthetic
    );
  }, [
    effectiveRecords,
    targetMap,
    courseMeta,
    filters,
    validationResult,
    interventions,
    reassessmentProfiles,
    cohortOutcomeSummary,
    isSyntheticLoaded,
    hasExistingReassessment
  ]);

  const handleResetFilters = () => {
    setFilters({
      courseId: initialCourse,
      semester: courseMeta.semester || '4',
      section: courseMeta.section || 'Cohort 2026',
      coId: 'ALL',
      riskFilter: 'ALL',
      priorityFilter: 'ALL',
      reassessmentStatus: 'ALL'
    });
  };

  const { showSuccess, showError } = useToast();
  const [savedSnapshotRunId, setSavedSnapshotRunId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleSaveToHistory = () => {
    try {
      const user = getCurrentUser();
      const savedBy = user ? `${user.displayName} (${user.role})` : 'Faculty / Institutional User';
      const snapshot = createSnapshotFromReport(fullReport, { savedBy });
      saveRun(snapshot);
      setSavedSnapshotRunId(snapshot.runId);
      const msg = `Report successfully archived as ${snapshot.runId}`;
      setSaveSuccessMsg(msg);
      showSuccess(msg, 'Snapshot Archived');
      setTimeout(() => setSaveSuccessMsg(null), 6000);
    } catch (err: any) {
      showError(`Failed to save report to history: ${err?.message || 'Storage error'}`, 'Storage Error');
    }
  };

  const handleCompareWithPrevious = () => {
    const runs = getAllRuns();
    if (runs.length >= 2) {
      if (onNavigateToComparison) {
        onNavigateToComparison(runs[1].runId, runs[0].runId);
      }
    } else if (onNavigateToHistory) {
      onNavigateToHistory();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20">
      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToModule7}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Reassessment (M7)</span>
            </button>

            <span className="text-slate-300">|</span>

            {/* Breadcrumb Navigation Chain */}
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
              {onBackToModule6 && (
                <>
                  <button onClick={onBackToModule6} className="hover:text-indigo-600 font-medium">
                    Module 6: Intervention
                  </button>
                  <span>/</span>
                </>
              )}
              <button onClick={onBackToModule7} className="hover:text-indigo-600 font-medium">
                Module 7: Reassessment
              </button>
              <span>/</span>
              <span className="font-bold text-slate-900 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                <FileText className="h-3 w-3" /> Module 8: CO Report
              </span>
            </nav>
          </div>

          {/* Active Scope Badge & Demo Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleSyntheticData}
              className={`text-xs font-bold px-2.5 py-1 rounded-md border transition cursor-pointer flex items-center gap-1.5 ${
                isSyntheticLoaded
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Database className="h-3.5 w-3.5 text-amber-600" />
              <span>{isSyntheticLoaded ? 'Synthetic R1 Active' : 'Load Demo R1'}</span>
            </button>

            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {filters.courseId} • {filters.coId}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 animate-fade-in">
        {/* HISTORICAL ARCHIVE ACTION PANEL */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Historical Intelligence & Institutional Archiving
                </h3>
                {savedSnapshotRunId && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Saved: {savedSnapshotRunId}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {saveSuccessMsg || 'Archive this finalized report as an immutable snapshot for longitudinal tracking and accreditation.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSaveToHistory}
              disabled={savedSnapshotRunId !== null}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                savedSnapshotRunId !== null
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-200'
              }`}
            >
              <BookmarkCheck className="h-4 w-4" />
              <span>{savedSnapshotRunId ? 'Snapshot Saved' : 'Save Report to History'}</span>
            </button>

            {onNavigateToHistory && (
              <button
                type="button"
                onClick={onNavigateToHistory}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
              >
                <History className="h-4 w-4 text-slate-500" />
                <span>View History</span>
              </button>
            )}

            {onNavigateToComparison && (
              <button
                type="button"
                onClick={handleCompareWithPrevious}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
              >
                <GitCompare className="h-4 w-4 text-indigo-600" />
                <span>Compare with Previous</span>
              </button>
            )}
          </div>
        </div>

        {/* Synthetic Demonstration Banner (if active) */}
        {(isSyntheticLoaded || hasExistingReassessment) && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-900 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <Database className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>SYNTHETIC DEMONSTRATION DATA INCLUDED:</strong> Post-intervention reassessment records from cycle <code>R1</code> (2026-09-15) are integrated for closed-loop demonstration. This data is labeled synthetic and does not represent live institutional records.
              </span>
            </div>
            {isSyntheticLoaded && (
              <button
                onClick={handleToggleSyntheticData}
                className="text-xs font-bold px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 cursor-pointer"
              >
                Unload Demo R1
              </button>
            )}
          </div>
        )}

        {/* SECTION 1: REPORT SCOPE & FILTER CONFIGURATION */}
        <ReportScopeFilter
          filters={filters}
          onChange={setFilters}
          availableCourses={availableCourses}
          availableCOs={availableCOs}
          onReset={handleResetFilters}
        />

        {/* REPORT HEADER & METADATA */}
        <ReportHeader
          courseMeta={courseMeta}
          generatedAt={fullReport.generatedAt}
          reportId={fullReport.reportId}
          isSyntheticData={fullReport.isSyntheticData}
          totalStudentsCount={fullReport.studentRiskSummary.totalStudents}
          totalRecordsCount={effectiveRecords.length}
        />

        {/* EVIDENCE CHAIN HIGHLIGHT */}
        <EvidenceChainBanner />

        {/* EXECUTIVE COURSE HEALTH SUMMARY (CULMINATION SECTION) */}
        <ExecutiveHealthSummary report={fullReport} />

        {/* SECTION 2: COURSE OUTCOME EXECUTIVE SUMMARY */}
        <CourseOutcomeExecutiveSummary
          coSummary={fullReport.coExecutiveSummary}
          selectedCO={filters.coId}
          onSelectCO={coId => setFilters(f => ({ ...f, coId }))}
        />

        {/* SECTION 3: CHRONOLOGICAL CO PROGRESSION TIMELINE */}
        <COProgressionReport
          progression={fullReport.coProgressionTimeline}
          availableCOs={availableCOs}
        />

        {/* SECTION 4: TOPIC INTELLIGENCE & REASSESSMENT DELTA MATRIX */}
        <TopicIntelligenceTable
          topics={fullReport.topicIntelligence}
          selectedCO={filters.coId}
        />

        {/* SECTION 5: STUDENT RISK STRATIFICATION */}
        <StudentRiskSummary
          riskSummary={fullReport.studentRiskSummary}
          selectedRiskFilter={filters.riskFilter}
        />

        {/* SECTION 6: INSTRUCTIONAL INTERVENTION APPROVALS & OUTCOMES */}
        <InterventionOutcomeTable
          outcomes={fullReport.interventionOutcomes}
        />

        {/* SECTION 7: COHORT-LEVEL LEARNING GAIN & CLOSED-LOOP EFFECTIVENESS */}
        <LearningGainSummary
          summary={fullReport.learningGainSummary}
        />

        {/* SECTION 8: END-TO-END EVIDENCE TRACEABILITY CHAIN */}
        <EvidenceTraceabilityPanel
          stages={fullReport.traceabilityStages}
        />

        {/* SECTION 9: ACTIONABLE ACADEMIC ATTENTION TRIGGERS */}
        <AcademicAttentionPanel
          items={fullReport.academicAttentionItems}
        />

        {/* SECTION 10: DATA INGESTION INTEGRITY & QUALITY AUDIT */}
        <DataQualityReport
          dataQuality={fullReport.dataQuality}
        />

        {/* SECTION 11: STATISTICAL METHODOLOGY & GOVERNANCE */}
        <ReportMethodology />

        {/* SECTION 12: ACCREDITATION EXPORT & ARTIFACT GENERATION */}
        <ReportExportPanel
          report={fullReport}
        />
      </main>
    </div>
  );
};
