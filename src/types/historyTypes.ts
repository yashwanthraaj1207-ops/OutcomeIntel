/**
 * OutcomeIntel Historical Intelligence & Snapshot Types
 * Immutable cross-run academic history, audit logs, and comparison models.
 */

import { FullCOIntelligenceReport } from './dataTypes';

export type HistoricalDataType = 'LIVE' | 'UPLOADED' | 'SYNTHETIC_DEMONSTRATION';

export interface HistoryCOSummary {
  coId: string;
  courseId: string;
  attainmentPct: number | null;
  targetThreshold: number | null;
  gapPct: number | null; // Attainment - Target (percentage points)
  status: string;
  totalStudents: number;
  totalObservations: number;
}

export interface HistoryRiskSummary {
  totalStudents: number;
  highRiskCount: number;
  highRiskPct: number;
  mediumRiskCount: number;
  mediumRiskPct: number;
  lowRiskCount: number;
  lowRiskPct: number;
  insufficientDataCount: number;
  insufficientDataPct: number;
}

export interface HistoryTopicSummary {
  topic: string;
  coId: string;
  courseId: string;
  attainmentPct: number | null;
  targetThreshold: number | null;
  gapPct: number | null;
  diagnosisStatus: string;
  reassessmentGainPp: number | null;
}

export interface HistoryInterventionSummary {
  totalInterventions: number;
  approvedCount: number;
  reassessedCount: number;
  pendingCount: number;
}

export interface HistoryReassessmentSummary {
  totalEvaluated: number;
  totalWithReassessment: number;
  targetAchievedCount: number;
  positiveGainCount: number;
  noMeasurableGainCount: number;
  negativeChangeCount: number;
  insufficientDataCount: number;
  meanAbsoluteGainPp: number | null;
}

export interface HistoryLearningGainSummary {
  meanAbsoluteLearningGainPp: number | null;
  targetAchievedPct: number;
  positiveGainPct: number;
  noMeasurableGainPct: number;
  negativeChangePct: number;
}

export interface HistoryDataQuality {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  validationStatus: string;
}

export interface HistoryReportSummary {
  overallAttainmentPct: number | null;
  overallTargetGapPp: number | null;
  healthStatus: string;
  academicAttentionCount: number;
}

export interface HistoryRun {
  runId: string; // e.g. "RUN-2026-09-15-001"
  createdAt: string; // ISO 8601
  updatedAt: string;
  generatedAt: string;
  savedBy: string; // e.g., "Dr. Sarah Jenkins (FACULTY)"
  courseId: string;
  courseName: string;
  semester: string;
  section: string;
  academicYear: string;
  datasetName: string;
  datasetSource: string;
  dataType: HistoricalDataType;
  totalStudents: number;
  validRecords: number;
  invalidRecords: number;
  coSummaries: HistoryCOSummary[];
  riskSummary: HistoryRiskSummary;
  topicSummaries: HistoryTopicSummary[];
  interventionSummary: HistoryInterventionSummary;
  reassessmentSummary: HistoryReassessmentSummary;
  learningGainSummary: HistoryLearningGainSummary;
  reportSummary: HistoryReportSummary;
  dataQuality: HistoryDataQuality;
  anonymizedStudentIds: string[]; // Only anonymized IDs like S001, S002. Zero PII.
  fullReportSnapshot: FullCOIntelligenceReport; // Complete immutable snapshot
}

export interface HistoryStore {
  schemaVersion: number;
  lastUpdated: string;
  runs: HistoryRun[];
}

export interface HistoryFilterCriteria {
  courseId: string;
  semester: string;
  dataType: 'ALL' | HistoricalDataType;
  searchQuery: string;
  startDate?: string;
  endDate?: string;
  riskTier?: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

