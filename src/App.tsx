import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { CourseInfoSection } from './components/CourseInfoSection';
import { DatasetUploadSection } from './components/DatasetUploadSection';
import { DataPreviewTable } from './components/DataPreviewTable';
import { DatasetStatistics } from './components/DatasetStatistics';
import { ValidationSummary } from './components/ValidationSummary';
import { ValidationDetailsList } from './components/ValidationDetailsList';
import { Module2Dashboard } from './components/Module2Dashboard';
import { Module3Dashboard } from './components/Module3Dashboard';
import { Module4Dashboard } from './components/Module4Dashboard';
import { Module5Dashboard } from './components/Module5Dashboard';
import { Module6Dashboard } from './components/Module6Dashboard';
import { Module7Dashboard } from './components/Module7Dashboard';
import { Module8Dashboard } from './components/Module8Dashboard';
import { DemoJourneyBar, AppView } from './components/common/DemoJourneyBar';
import { ModuleTransitionHeader } from './components/common/ModuleTransitionHeader';
import { AIMLTransparencyModal } from './components/common/AIMLTransparencyModal';
import { First30SecondsHero } from './components/common/First30SecondsHero';
import { EvidenceChainBanner } from './components/common/EvidenceChainBanner';
import { LoginPage } from './components/auth/LoginPage';
import { HistoryDashboard } from './components/HistoryDashboard';
import { HistoryComparison } from './components/HistoryComparison';
import { HistoricalAnalyticsDashboard } from './components/analytics/HistoricalAnalyticsDashboard';
import { getCurrentUser, logout } from './services/authService';
import { AuthenticatedUser } from './types/authTypes';
import { ToastProvider, useToast } from './components/common/Toast';

import { parseCSVString } from './services/csvParser';
import { validateDatasets, FullValidationResult } from './services/validationEngine';
import { standardizeAssessmentData, computeDatasetStats } from './services/standardizer';

import {
  RawAssessmentRow,
  RawMappingRow,
  RawTargetRow,
  StandardizedAssessmentRecord,
  DatasetStats,
  CourseMetadata,
  UploadedFileState,
  TargetMappingDictionary
} from './types/dataTypes';

import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(() => getCurrentUser());
  const [currentView, setCurrentView] = useState<AppView>(() => getCurrentUser() ? 'module1' : 'login');
  const [comparisonPair, setComparisonPair] = useState<{ runA?: string; runB?: string }>({});
  const [isAIMLModalOpen, setIsAIMLModalOpen] = useState<boolean>(false);

  const handleLoginSuccess = (user: AuthenticatedUser) => {
    setCurrentUser(user);
    setCurrentView('module1');
    showSuccess(`Welcome, ${user.displayName} (${user.role})`, 'Signed In');
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setCurrentView('login');
    showInfo('Signed out of OutcomeIntel.', 'Session Ended');
  };

  const handleNavigateToComparison = (runAId: string, runBId: string) => {
    setComparisonPair({ runA: runAId, runB: runBId });
    setCurrentView('comparison');
  };

  // Centralized scroll-to-top handler on module navigation
  useEffect(() => {
    const scrollToTop = () => {
      try {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      } catch {
        window.scrollTo(0, 0);
      }
      if (typeof document !== 'undefined') {
        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
        }
        if (document.body) {
          document.body.scrollTop = 0;
        }
      }
    };

    // Execute immediately and on next animation frame after new module DOM paints
    scrollToTop();
    const rafId = requestAnimationFrame(scrollToTop);
    return () => cancelAnimationFrame(rafId);
  }, [currentView]);

  // Course Metadata — default to ALL so complete dataset is visible
  const [courseMeta, setCourseMeta] = useState<CourseMetadata>({
    courseId: 'ALL',
    courseName: 'All Uploaded Courses',
    semester: '4',
    section: 'Cohort 2026'
  });

  // Upload States
  const [assessmentState, setAssessmentState] = useState<UploadedFileState<RawAssessmentRow>>({
    file: null,
    fileName: '',
    fileSize: 0,
    status: 'empty',
    rawRows: [],
    headers: [],
    errorCount: 0,
    warningCount: 0
  });

  const [mappingState, setMappingState] = useState<UploadedFileState<RawMappingRow>>({
    file: null,
    fileName: '',
    fileSize: 0,
    status: 'empty',
    rawRows: [],
    headers: [],
    errorCount: 0,
    warningCount: 0
  });

  const [targetState, setTargetState] = useState<UploadedFileState<RawTargetRow>>({
    file: null,
    fileName: '',
    fileSize: 0,
    status: 'empty',
    rawRows: [],
    headers: [],
    errorCount: 0,
    warningCount: 0
  });

  // Validation Result across complete dataset
  const [validationResult, setValidationResult] = useState<FullValidationResult>({
    errors: [],
    summary: {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      missingRequiredValues: 0,
      invalidMarks: 0,
      duplicateRecords: 0,
      missingTopicMappings: 0,
      missingCOMappings: 0,
      structuralErrors: 0,
      warnings: 0
    },
    canProceed: false
  });

  // Overall (Complete) Standardized Dataset
  const [allStandardizedRecords, setAllStandardizedRecords] = useState<StandardizedAssessmentRecord[]>([]);
  const [overallStats, setOverallStats] = useState<DatasetStats>({
    totalRecords: 0,
    uniqueStudents: 0,
    uniqueCourses: [],
    uniqueAssessments: [],
    uniqueQuestions: 0,
    uniqueTopics: 0,
    uniqueCOs: [],
    averageMarksRatio: 0,
    cohort: 'N/A'
  });

  // Filtered Records & Stats (for current course selection)
  const [displayRecords, setDisplayRecords] = useState<StandardizedAssessmentRecord[]>([]);
  const [activeStats, setActiveStats] = useState<DatasetStats>({
    totalRecords: 0,
    uniqueStudents: 0,
    uniqueCourses: [],
    uniqueAssessments: [],
    uniqueQuestions: 0,
    uniqueTopics: 0,
    uniqueCOs: [],
    averageMarksRatio: 0,
    cohort: 'N/A'
  });

  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);

  // Validate entire dataset whenever any dataset file changes
  useEffect(() => {
    // Run validation across ALL rows to verify global integrity
    const result = validateDatasets(
      assessmentState.rawRows,
      assessmentState.headers,
      mappingState.rawRows,
      mappingState.headers,
      targetState.rawRows,
      targetState.headers
    );

    setValidationResult(result);

    // Update individual card status badges
    const assessErrors = result.errors.filter(e => e.file === 'assessment');
    const mapErrors = result.errors.filter(e => e.file === 'mapping');
    const targetErrors = result.errors.filter(e => e.file === 'target');

    if (assessmentState.rawRows.length > 0) {
      const blockCount = assessErrors.filter(e => e.severity === 'blocking').length;
      const warnCount = assessErrors.filter(e => e.severity === 'warning').length;
      setAssessmentState(prev => ({
        ...prev,
        status: blockCount > 0 ? 'invalid' : warnCount > 0 ? 'warning' : 'loaded',
        errorCount: blockCount,
        warningCount: warnCount
      }));
    }

    if (mappingState.rawRows.length > 0) {
      const blockCount = mapErrors.filter(e => e.severity === 'blocking').length;
      const warnCount = mapErrors.filter(e => e.severity === 'warning').length;
      setMappingState(prev => ({
        ...prev,
        status: blockCount > 0 ? 'invalid' : warnCount > 0 ? 'warning' : 'loaded',
        errorCount: blockCount,
        warningCount: warnCount
      }));
    }

    if (targetState.rawRows.length > 0) {
      const blockCount = targetErrors.filter(e => e.severity === 'blocking').length;
      const warnCount = targetErrors.filter(e => e.severity === 'warning').length;
      setTargetState(prev => ({
        ...prev,
        status: blockCount > 0 ? 'invalid' : warnCount > 0 ? 'warning' : 'loaded',
        errorCount: blockCount,
        warningCount: warnCount
      }));
    }

    // Standardize all valid rows
    if (assessmentState.rawRows.length > 0) {
      const stdAll = standardizeAssessmentData(assessmentState.rawRows);
      setAllStandardizedRecords(stdAll);
      const ovStats = computeDatasetStats(stdAll);
      setOverallStats(ovStats);
    } else {
      setAllStandardizedRecords([]);
      setOverallStats({
        totalRecords: 0,
        uniqueStudents: 0,
        uniqueCourses: [],
        uniqueAssessments: [],
        uniqueQuestions: 0,
        uniqueTopics: 0,
        uniqueCOs: [],
        averageMarksRatio: 0,
        cohort: 'N/A'
      });
    }
  }, [
    assessmentState.rawRows,
    mappingState.rawRows,
    targetState.rawRows
  ]);

  // Update display records and active stats whenever course filter or all records change
  useEffect(() => {
    if (allStandardizedRecords.length === 0) {
      setDisplayRecords([]);
      setActiveStats({
        totalRecords: 0,
        uniqueStudents: 0,
        uniqueCourses: [],
        uniqueAssessments: [],
        uniqueQuestions: 0,
        uniqueTopics: 0,
        uniqueCOs: [],
        averageMarksRatio: 0,
        cohort: 'N/A'
      });
      return;
    }

    if (courseMeta.courseId === 'ALL') {
      setDisplayRecords(allStandardizedRecords);
      setActiveStats(overallStats);
    } else {
      const filtered = allStandardizedRecords.filter(
        r => r.course_id.toUpperCase() === courseMeta.courseId.toUpperCase()
      );
      setDisplayRecords(filtered);
      setActiveStats(computeDatasetStats(filtered));
    }
  }, [courseMeta.courseId, allStandardizedRecords, overallStats]);

  // Handle single file upload
  const handleFileUpload = (type: 'assessment' | 'mapping' | 'target', file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      if (!text) return;

      if (type === 'assessment') {
        const { headers, rows } = parseCSVString<RawAssessmentRow>(text);
        setAssessmentState({
          file,
          fileName: file.name,
          fileSize: file.size,
          status: 'loaded',
          rawRows: rows,
          headers,
          errorCount: 0,
          warningCount: 0
        });

        // Set default course filter to ALL
        setCourseMeta(prev => ({
          ...prev,
          courseId: 'ALL',
          courseName: 'All Uploaded Courses'
        }));
      } else if (type === 'mapping') {
        const { headers, rows } = parseCSVString<RawMappingRow>(text);
        setMappingState({
          file,
          fileName: file.name,
          fileSize: file.size,
          status: 'loaded',
          rawRows: rows,
          headers,
          errorCount: 0,
          warningCount: 0
        });
      } else if (type === 'target') {
        const { headers, rows } = parseCSVString<RawTargetRow>(text);
        setTargetState({
          file,
          fileName: file.name,
          fileSize: file.size,
          status: 'loaded',
          rawRows: rows,
          headers,
          errorCount: 0,
          warningCount: 0
        });
      }
    };
    reader.readAsText(file);
  };

  // Load the 3 prototype datasets
  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      const [assessRes, mapRes, targetRes] = await Promise.all([
        fetch('/sample-data/sample_co_assessment_v2.csv'),
        fetch('/sample-data/question_topic_co_mapping_v2.csv'),
        fetch('/sample-data/co_target_mapping.csv')
      ]);

      const assessText = await assessRes.text();
      const mapText = await mapRes.text();
      const targetText = await targetRes.text();

      const assessParsed = parseCSVString<RawAssessmentRow>(assessText);
      const mapParsed = parseCSVString<RawMappingRow>(mapText);
      const targetParsed = parseCSVString<RawTargetRow>(targetText);

      setAssessmentState({
        file: null,
        fileName: 'sample_co_assessment_v2.csv',
        fileSize: assessText.length,
        status: 'loaded',
        rawRows: assessParsed.rows,
        headers: assessParsed.headers,
        errorCount: 0,
        warningCount: 0
      });

      setMappingState({
        file: null,
        fileName: 'question_topic_co_mapping_v2.csv',
        fileSize: mapText.length,
        status: 'loaded',
        rawRows: mapParsed.rows,
        headers: mapParsed.headers,
        errorCount: 0,
        warningCount: 0
      });

      setTargetState({
        file: null,
        fileName: 'co_target_mapping.csv',
        fileSize: targetText.length,
        status: 'loaded',
        rawRows: targetParsed.rows,
        headers: targetParsed.headers,
        errorCount: 0,
        warningCount: 0
      });

      // Default to ALL courses so the entire 9,320 rows are immediately visible
      setCourseMeta({
        courseId: 'ALL',
        courseName: 'All Uploaded Courses (CS301 & CS302)',
        semester: '4',
        section: 'Cohort 2026'
      });
      showSuccess('Loaded complete demonstration dataset (9,320 observations across CS301 & CS302).', 'Datasets Ingested');
    } catch (err) {
      console.error('Failed to load sample dataset:', err);
      showError('Error loading sample dataset from public/sample-data/', 'Ingestion Error');
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Launch Recommended Demo Scenario (Student S001 • CS301 CO2 • Virtual Memory & Paging)
  const handleLaunchDemoScenario = async () => {
    if (assessmentState.rawRows.length === 0) {
      await handleLoadSample();
    }

    setCourseMeta({
      courseId: 'CS301',
      courseName: 'Operating Systems',
      semester: '4',
      section: 'Cohort 2026'
    });

    try {
      const demoInterventions = [
        {
          interventionId: 'intv-sample-s001',
          studentId: 'S001',
          courseId: 'CS301',
          coId: 'CO2',
          topic: 'Virtual Memory & Paging',
          interventionType: 'Peer Learning',
          priority: 'CRITICAL',
          reason: 'Severe diagnostic deficit on page table translation questions (28.0% attainment vs 70% target).',
          status: 'Approved',
          facultyNotes: 'Approved 1-on-1 clinic session with TA on Thursday.',
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
          reason: 'Topic attainment is 58.0% (below 70% target). Practice set assigned.',
          status: 'Approved',
          facultyNotes: 'Assigned practice set #4 focusing on turnaround time calculation.',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ai_course_outcome_interventions', JSON.stringify(demoInterventions));
      showInfo('Loaded judge briefing scenario: Student S001 • CS301 CO2.', 'Demo Scenario Loaded');
    } catch (e) {
      console.error('Error seeding demo interventions', e);
    }
  };

  const handleResetAll = () => {
    setAssessmentState({
      file: null,
      fileName: '',
      fileSize: 0,
      status: 'empty',
      rawRows: [],
      headers: [],
      errorCount: 0,
      warningCount: 0
    });
    setMappingState({
      file: null,
      fileName: '',
      fileSize: 0,
      status: 'empty',
      rawRows: [],
      headers: [],
      errorCount: 0,
      warningCount: 0
    });
    setTargetState({
      file: null,
      fileName: '',
      fileSize: 0,
      status: 'empty',
      rawRows: [],
      headers: [],
      errorCount: 0,
      warningCount: 0
    });
    setAllStandardizedRecords([]);
    setDisplayRecords([]);
    showInfo('Dataset state cleared.', 'Workspace Reset');
  };

  // Detected courses in uploaded data
  const detectedCourses = Array.from(
    new Set(assessmentState.rawRows.map(r => (r.course_id || '').trim().toUpperCase()).filter(Boolean))
  ).sort();

  // Target mapping dictionary for pure deterministic calculations
  const targetMap: TargetMappingDictionary = useMemo(() => {
    const map: TargetMappingDictionary = {};
    targetState.rawRows.forEach(r => {
      const courseId = (r.course_id || '').trim().toUpperCase();
      const coId = (r.co_id || '').trim().toUpperCase();
      const targetVal = parseFloat(r.target_attainment_percentage || '');
      if (courseId && coId && !isNaN(targetVal)) {
        map[`${courseId}|${coId}`] = targetVal;
      }
    });
    return map;
  }, [targetState.rawRows]);

  // Authentication Guard
  if (!currentUser || currentView === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Common Navbar Renderer for consistency across views
  const renderNavbar = (title: string, step?: number) => (
    <Navbar
      moduleTitle={title}
      stepNumber={step}
      onOpenAIMLModal={() => setIsAIMLModalOpen(true)}
      currentUser={currentUser}
      onNavigateToHistory={() => setCurrentView('history')}
      onNavigateToAnalytics={() => setCurrentView('analytics')}
      onNavigateToModule1={() => setCurrentView('module1')}
      onLogout={handleLogout}
      currentView={currentView}
    />
  );

  // Historical Archive View
  if (currentView === 'history') {
    return (
      <div className="min-h-screen bg-slate-100/70 animate-fade-in">
        <AIMLTransparencyModal isOpen={isAIMLModalOpen} onClose={() => setIsAIMLModalOpen(false)} />
        {renderNavbar('Historical Analysis Archive')}
        <HistoryDashboard
          onNavigateToComparison={handleNavigateToComparison}
          onViewRunDetail={run => handleNavigateToComparison(run.runId, run.runId)}
          onBackToPipeline={() => setCurrentView('module1')}
        />
      </div>
    );
  }

  // Longitudinal Analytics View
  if (currentView === 'analytics') {
    return (
      <div className="min-h-screen bg-slate-100/70 animate-fade-in">
        <AIMLTransparencyModal isOpen={isAIMLModalOpen} onClose={() => setIsAIMLModalOpen(false)} />
        {renderNavbar('Longitudinal Analytics')}
        <HistoricalAnalyticsDashboard
          onBackToPipeline={() => setCurrentView('module1')}
          onNavigateToHistory={() => setCurrentView('history')}
          onNavigateToComparison={handleNavigateToComparison}
        />
      </div>
    );
  }

  // Cross-Run Comparison View
  if (currentView === 'comparison') {
    return (
      <div className="min-h-screen bg-slate-100/70 animate-fade-in">
        <AIMLTransparencyModal isOpen={isAIMLModalOpen} onClose={() => setIsAIMLModalOpen(false)} />
        {renderNavbar('Cross-Run Comparison')}
        <HistoryComparison
          initialRunAId={comparisonPair.runA}
          initialRunBId={comparisonPair.runB}
          onBackToHistory={() => setCurrentView('history')}
        />
      </div>
    );
  }

  if (currentView === 'module2') {
    return (
      <div className="min-h-screen bg-slate-100/70 animate-fade-in">
        <AIMLTransparencyModal isOpen={isAIMLModalOpen} onClose={() => setIsAIMLModalOpen(false)} />
        {renderNavbar('Module 2: Course Outcome Analytics', 2)}
        <DemoJourneyBar currentView={currentView} onNavigate={setCurrentView} canNavigate={validationResult.canProceed} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <ModuleTransitionHeader currentModule="module2" />
        </div>
        <Module2Dashboard
          records={allStandardizedRecords}
          targetMap={targetMap}
          courseMeta={courseMeta}
          onBackToModule1={() => setCurrentView('module1')}
          onNavigateToModule3={() => setCurrentView('module3')}
        />
      </div>
    );
  }

  if (currentView === 'module3') {
    return (
      <div className="min-h-screen bg-slate-100/70 animate-fade-in">
        <AIMLTransparencyModal isOpen={isAIMLModalOpen} onClose={() => setIsAIMLModalOpen(false)} />
        {renderNavbar('Module 3: Conditional Prediction', 3)}
        <DemoJourneyBar currentView={currentView} onNavigate={setCurrentView} canNavigate={validationResult.canProceed} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <ModuleTransitionHeader currentModule="module3" />
        </div>
        <Module3Dashboard
          records={allStandardizedRecords}
          targetMap={targetMap}
          courseMeta={courseMeta}
          onBackToModule2={() => setCurrentView('module2')}
          onBackToModule1={() => setCurrentView('module1')}
          onNavigateToModule4={() => setCurrentView('module4')}
        />
      </div>
    );
  }

  if (currentView === 'module4') {
    return (
      <div className="min-h-screen bg-slate-100/70 animate-fade-in">
        <AIMLTransparencyModal isOpen={isAIMLModalOpen} onClose={() => setIsAIMLModalOpen(false)} />
        {renderNavbar('Module 4: Early-Warning Risk Detection', 4)}
        <DemoJourneyBar currentView={currentView} onNavigate={setCurrentView} canNavigate={validationResult.canProceed} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <ModuleTransitionHeader currentModule="module4" />
        </div>
        <Module4Dashboard
          records={allStandardizedRecords}
          targetMap={targetMap}
          courseMeta={courseMeta}
          onBackToModule3={() => setCurrentView('module3')}
          onBackToModule2={() => setCurrentView('module2')}
          onBackToModule1={() => setCurrentView('module1')}
          onNavigateToModule5={() => setCurrentView('module5')}
        />
      </div>
    );
  }

  if (currentView === 'module5') {
    return (
      <div className="min-h-screen bg-slate-100/70 animate-fade-in">
        <AIMLTransparencyModal isOpen={isAIMLModalOpen} onClose={() => setIsAIMLModalOpen(false)} />
        {renderNavbar('Module 5: Explainability & Diagnosis', 5)}
        <DemoJourneyBar currentView={currentView} onNavigate={setCurrentView} canNavigate={validationResult.canProceed} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <ModuleTransitionHeader currentModule="module5" />
        </div>
        <Module5Dashboard
          records={allStandardizedRecords}
          targetMap={targetMap}
          courseMeta={courseMeta}
          onBackToModule4={() => setCurrentView('module4')}
          onBackToModule3={() => setCurrentView('module3')}
          onBackToModule2={() => setCurrentView('module2')}
          onBackToModule1={() => setCurrentView('module1')}
          onNavigateToModule6={() => setCurrentView('module6')}
        />
      </div>
    );
  }

  if (currentView === 'module6') {
    return (
      <div className="min-h-screen bg-slate-100/70 animate-fade-in">
        <AIMLTransparencyModal isOpen={isAIMLModalOpen} onClose={() => setIsAIMLModalOpen(false)} />
        {renderNavbar('Module 6: Instructional Intervention', 6)}
        <DemoJourneyBar currentView={currentView} onNavigate={setCurrentView} canNavigate={validationResult.canProceed} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <ModuleTransitionHeader currentModule="module6" />
        </div>
        <Module6Dashboard
          records={allStandardizedRecords}
          targetMap={targetMap}
          courseMeta={courseMeta}
          onBackToModule5={() => setCurrentView('module5')}
          onBackToModule4={() => setCurrentView('module4')}
          onBackToModule3={() => setCurrentView('module3')}
          onBackToModule2={() => setCurrentView('module2')}
          onBackToModule1={() => setCurrentView('module1')}
          onNavigateToModule7={() => setCurrentView('module7')}
        />
      </div>
    );
  }

  if (currentView === 'module7') {
    return (
      <div className="min-h-screen bg-slate-100/70 animate-fade-in">
        <AIMLTransparencyModal isOpen={isAIMLModalOpen} onClose={() => setIsAIMLModalOpen(false)} />
        {renderNavbar('Module 7: Reassessment & Learning Gain', 7)}
        <DemoJourneyBar currentView={currentView} onNavigate={setCurrentView} canNavigate={validationResult.canProceed} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <ModuleTransitionHeader currentModule="module7" />
        </div>
        <Module7Dashboard
          records={allStandardizedRecords}
          targetMap={targetMap}
          courseMeta={courseMeta}
          onBackToModule6={() => setCurrentView('module6')}
          onBackToModule5={() => setCurrentView('module5')}
          onBackToModule4={() => setCurrentView('module4')}
          onBackToModule3={() => setCurrentView('module3')}
          onBackToModule2={() => setCurrentView('module2')}
          onBackToModule1={() => setCurrentView('module1')}
          onNavigateToModule8={() => setCurrentView('module8')}
        />
      </div>
    );
  }

  if (currentView === 'module8') {
    return (
      <div className="min-h-screen bg-slate-100/70 animate-fade-in">
        <AIMLTransparencyModal isOpen={isAIMLModalOpen} onClose={() => setIsAIMLModalOpen(false)} />
        {renderNavbar('Module 8: CO Intelligence Report', 8)}
        <DemoJourneyBar currentView={currentView} onNavigate={setCurrentView} canNavigate={validationResult.canProceed} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <ModuleTransitionHeader currentModule="module8" />
        </div>
        <Module8Dashboard
          records={allStandardizedRecords}
          targetMap={targetMap}
          courseMeta={courseMeta}
          validationResult={validationResult}
          onBackToModule7={() => setCurrentView('module7')}
          onBackToModule6={() => setCurrentView('module6')}
          onBackToModule5={() => setCurrentView('module5')}
          onBackToModule4={() => setCurrentView('module4')}
          onBackToModule3={() => setCurrentView('module3')}
          onBackToModule2={() => setCurrentView('module2')}
          onBackToModule1={() => setCurrentView('module1')}
          onNavigateToHistory={() => setCurrentView('history')}
          onNavigateToComparison={handleNavigateToComparison}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20 animate-fade-in">
      <AIMLTransparencyModal isOpen={isAIMLModalOpen} onClose={() => setIsAIMLModalOpen(false)} />
      {renderNavbar('Module 1: Ingestion & Validation', 1)}
      <DemoJourneyBar currentView={currentView} onNavigate={setCurrentView} canNavigate={validationResult.canProceed} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* FIRST 30 SECONDS HERO PITCH & VALUE PROPOSITION */}
        <First30SecondsHero
          onLaunchDemoScenario={handleLaunchDemoScenario}
          isLoadingSample={isLoadingSample}
          hasDataLoaded={assessmentState.rawRows.length > 0}
        />

        {/* EVIDENCE CHAIN HIGHLIGHT */}
        <EvidenceChainBanner />

        {/* MODULE 1 ARCHITECTURE TRANSITION FLOW */}
        <ModuleTransitionHeader currentModule="module1" />

        {/* SECTION 1 — COURSE INFORMATION */}
        <CourseInfoSection
          courseMeta={courseMeta}
          onChange={setCourseMeta}
          detectedCourses={detectedCourses}
        />

        {/* SECTION 2 — DATASET UPLOAD & SECTION 3 — DATASET STATUS */}
        <DatasetUploadSection
          assessmentState={assessmentState}
          mappingState={mappingState}
          targetState={targetState}
          onFileUpload={handleFileUpload}
          onLoadSample={handleLoadSample}
          onResetAll={handleResetAll}
          isLoadingSample={isLoadingSample}
        />

        {/* SECTION 4 — ASSESSMENT DATA PREVIEW */}
        <DataPreviewTable
          records={displayRecords}
          totalRecordsCount={overallStats.totalRecords}
          selectedCourse={courseMeta.courseId}
          uniqueStudentsCount={activeStats.uniqueStudents}
          uniqueAssessmentsCount={activeStats.uniqueAssessments.length}
          uniqueQuestionsCount={activeStats.uniqueQuestions}
          uniqueTopicsCount={activeStats.uniqueTopics}
          uniqueCOsCount={activeStats.uniqueCOs.length}
        />

        {/* SECTION 5 — DYNAMIC DATASET STATISTICS */}
        {assessmentState.rawRows.length > 0 && (
          <DatasetStatistics
            stats={activeStats}
            overallStats={overallStats}
            selectedCourse={courseMeta.courseId}
            onSelectCourse={c => setCourseMeta(prev => ({ ...prev, courseId: c }))}
          />
        )}

        {/* SECTION 6 — VALIDATION SUMMARY */}
        {assessmentState.rawRows.length > 0 && (
          <ValidationSummary
            summary={validationResult.summary}
            canProceed={validationResult.canProceed}
          />
        )}

        {/* SECTION 7 — VALIDATION DETAILS & ANOMALY INSPECTOR */}
        {assessmentState.rawRows.length > 0 && (
          <ValidationDetailsList errors={validationResult.errors} />
        )}

        {/* SECTION 8 — CONTINUE TO CO ANALYTICS (GATEKEEPER) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase tracking-wider">
                Section 8
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Continue to CO Analytics (Module 2 Handover Gatekeeper)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {validationResult.canProceed
                ? `Dataset validation passed across all ${overallStats.totalRecords.toLocaleString()} uploaded observations. Handover payload ready.`
                : 'Gatekeeper locked: Resolve all blocking structural & cross-file validation errors to proceed.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {!validationResult.canProceed ? (
              <span className="text-xs text-rose-600 font-medium inline-flex items-center bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                <AlertCircle className="h-4 w-4 mr-1 text-rose-500 flex-shrink-0" />
                Gatekeeper Locked: Blocking Issues
              </span>
            ) : (
              <span className="text-xs text-emerald-700 font-medium inline-flex items-center bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-600 flex-shrink-0" />
                Validation Gate Passed (100% Valid)
              </span>
            )}

            <button
              type="button"
              disabled={!validationResult.canProceed}
              onClick={() => setCurrentView('module2')}
              className={`inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm ${
                validationResult.canProceed
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white cursor-pointer shadow-indigo-200 shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60'
              }`}
            >
              <span>Continue to CO Analytics</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};
