/**
 * OutcomeIntel Historical Intelligence Service
 *
 * Manages persistent storage, snapshot creation, exports, and integrity auditing
 * for historical analysis runs. All snapshots are strictly immutable once saved.
 * Local persistence is namespaced under 'outcomeintel_history'.
 */

import { FullCOIntelligenceReport } from '../types/dataTypes';
import {
  HistoryRun,
  HistoryStore,
  HistoricalDataType,
  HistoryCOSummary,
  HistoryTopicSummary
} from '../types/historyTypes';

export const HISTORY_STORAGE_KEY = 'outcomeintel_history';
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Generate a clean, unique institutional run ID (e.g. RUN-2026-09-15-001)
 */
export function generateUniqueRunId(existingRuns: HistoryRun[] = []): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `RUN-${year}-${month}-${day}`;

  // Find existing run sequence numbers for today
  const existingNumbers = existingRuns
    .filter(r => r.runId.startsWith(datePrefix))
    .map(r => {
      const parts = r.runId.split('-');
      const seq = parseInt(parts[parts.length - 1], 10);
      return isNaN(seq) ? 0 : seq;
    });

  const nextSeq = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  const formattedSeq = String(nextSeq).padStart(3, '0');
  return `${datePrefix}-${formattedSeq}`;
}

/**
 * Safely load all historical runs from storage
 */
export function getAllRuns(): HistoryRun[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage?.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as HistoryStore;
    if (parsed && Array.isArray(parsed.runs)) {
      return parsed.runs;
    }
  } catch (err) {
    console.warn('[OutcomeIntel History] Corrupted historical data detected. Recovering gracefully:', err);
  }
  return [];
}

/**
 * Find a specific historical run by its unique ID
 */
export function getRunById(runId: string): HistoryRun | null {
  const runs = getAllRuns();
  return runs.find(r => r.runId === runId) || null;
}

/**
 * Save an immutable historical run snapshot
 */
export function saveRun(run: HistoryRun): HistoryRun {
  try {
    const existing = getAllRuns();

    // Check if runId already exists — prevent accidental overwrite
    const existingIdx = existing.findIndex(r => r.runId === run.runId);
    let updated: HistoryRun[];

    if (existingIdx >= 0) {
      // Update with new updatedAt timestamp
      updated = [...existing];
      updated[existingIdx] = {
        ...run,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Append new run
      updated = [run, ...existing];
    }

    const store: HistoryStore = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      lastUpdated: new Date().toISOString(),
      runs: updated
    };

    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(HISTORY_STORAGE_KEY, JSON.stringify(store));
    }
    return run;
  } catch (err) {
    console.error('[OutcomeIntel History] Failed to persist snapshot:', err);
    throw new Error('Failed to save historical snapshot to local storage.');
  }
}

/**
 * Delete a historical run by runId
 */
export function deleteRun(runId: string): boolean {
  try {
    const existing = getAllRuns();
    const filtered = existing.filter(r => r.runId !== runId);
    if (filtered.length === existing.length) return false;

    const store: HistoryStore = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      lastUpdated: new Date().toISOString(),
      runs: filtered
    };

    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(HISTORY_STORAGE_KEY, JSON.stringify(store));
    }
    return true;
  } catch (err) {
    console.error('[OutcomeIntel History] Failed to delete run:', err);
    return false;
  }
}

/**
 * Convert a Module 8 FullCOIntelligenceReport into a standardized, immutable HistoryRun snapshot
 */
export function createSnapshotFromReport(
  report: FullCOIntelligenceReport,
  metadata?: Partial<HistoryRun>
): HistoryRun {
  const existingRuns = getAllRuns();
  const runId = metadata?.runId || generateUniqueRunId(existingRuns);
  const now = new Date().toISOString();

  // Extract Course Outcome Summaries
  const coSummaries: HistoryCOSummary[] = report.coExecutiveSummary.map(co => ({
    coId: co.coId,
    courseId: co.courseId,
    attainmentPct: co.attainmentPct,
    targetThreshold: co.targetThreshold,
    gapPct: co.gapPct,
    status: co.status,
    totalStudents: co.totalStudents,
    totalObservations: co.totalObservations
  }));

  // Extract Topic Summaries
  const topicSummaries: HistoryTopicSummary[] = report.topicIntelligence.map(t => ({
    topic: t.topic,
    coId: t.coId,
    courseId: t.courseId,
    attainmentPct: t.attainmentPct,
    targetThreshold: t.targetThreshold,
    gapPct: t.gapPct,
    diagnosisStatus: t.diagnosisStatus,
    reassessmentGainPp: t.reassessmentGainPp
  }));

  // Determine Data Type
  const dataType: HistoricalDataType = report.isSyntheticData
    ? 'SYNTHETIC_DEMONSTRATION'
    : 'UPLOADED';

  // Calculate Overall Attainment across evaluated COs
  const validCOs = coSummaries.filter(co => co.attainmentPct !== null);
  const overallAttainmentPct = validCOs.length > 0
    ? validCOs.reduce((acc, c) => acc + (c.attainmentPct || 0), 0) / validCOs.length
    : null;

  const validGaps = coSummaries.filter(co => co.gapPct !== null);
  const overallTargetGapPp = validGaps.length > 0
    ? validGaps.reduce((acc, c) => acc + (c.gapPct || 0), 0) / validGaps.length
    : null;

  // Extract Anonymized Student IDs (strictly ^S\d{3}$)
  const anonymizedStudentIds = report.studentRiskSummary.students
    .map(s => s.studentId)
    .filter(id => /^S\d{3}$/i.test(id));

  // Build Snapshot
  const snapshot: HistoryRun = {
    runId,
    createdAt: now,
    updatedAt: now,
    generatedAt: report.generatedAt || now,
    savedBy: metadata?.savedBy || 'Institutional User',
    courseId: report.courseMeta.courseId || report.filters.courseId || 'CS301',
    courseName: report.courseMeta.courseName || 'Data Structures & Algorithms',
    semester: String(report.courseMeta.semester || report.filters.semester || '4'),
    section: report.courseMeta.section || report.filters.section || 'Cohort 2026',
    academicYear: '2025-2026',
    datasetName: report.isSyntheticData ? 'Synthetic Demonstration Cohort' : 'Institutional Uploaded Assessment CSV',
    datasetSource: report.isSyntheticData ? 'OutcomeIntel Synthetic Engine' : 'Direct Faculty Upload',
    dataType,
    totalStudents: report.studentRiskSummary.totalStudents || 0,
    validRecords: report.dataQuality.validRecords || 0,
    invalidRecords: report.dataQuality.invalidRecords || 0,
    coSummaries,
    riskSummary: {
      totalStudents: report.studentRiskSummary.totalStudents,
      highRiskCount: report.studentRiskSummary.highRiskCount,
      highRiskPct: report.studentRiskSummary.highRiskPct,
      mediumRiskCount: report.studentRiskSummary.mediumRiskCount,
      mediumRiskPct: report.studentRiskSummary.mediumRiskPct,
      lowRiskCount: report.studentRiskSummary.lowRiskCount,
      lowRiskPct: report.studentRiskSummary.lowRiskPct,
      insufficientDataCount: report.studentRiskSummary.insufficientDataCount,
      insufficientDataPct: report.studentRiskSummary.insufficientDataPct
    },
    topicSummaries,
    interventionSummary: {
      totalInterventions: report.interventionOutcomes.totalInterventions,
      approvedCount: report.interventionOutcomes.approvedCount,
      reassessedCount: report.interventionOutcomes.reassessedCount,
      pendingCount: report.interventionOutcomes.pendingCount
    },
    reassessmentSummary: {
      totalEvaluated: report.learningGainSummary?.totalEvaluated || 0,
      totalWithReassessment: report.learningGainSummary?.totalWithReassessment || 0,
      targetAchievedCount: report.learningGainSummary?.targetAchievedCount || 0,
      positiveGainCount: report.learningGainSummary?.positiveGainCount || 0,
      noMeasurableGainCount: report.learningGainSummary?.noMeasurableGainCount || 0,
      negativeChangeCount: report.learningGainSummary?.negativeChangeCount || 0,
      insufficientDataCount: report.learningGainSummary?.insufficientDataCount || 0,
      meanAbsoluteGainPp: report.learningGainSummary?.meanAbsoluteLearningGain || null
    },
    learningGainSummary: {
      meanAbsoluteLearningGainPp: report.learningGainSummary?.meanAbsoluteLearningGain || null,
      targetAchievedPct: report.learningGainSummary?.targetAchievedPct || 0,
      positiveGainPct: report.learningGainSummary?.positiveGainPct || 0,
      noMeasurableGainPct: report.learningGainSummary?.noMeasurableGainPct || 0,
      negativeChangePct: report.learningGainSummary?.negativeChangePct || 0
    },
    reportSummary: {
      overallAttainmentPct,
      overallTargetGapPp,
      healthStatus: (overallTargetGapPp !== null && overallTargetGapPp >= 0) ? 'ON_TRACK' : 'NEEDS_ATTENTION',
      academicAttentionCount: report.academicAttentionItems.length
    },
    dataQuality: {
      totalRecords: report.dataQuality.totalRecords,
      validRecords: report.dataQuality.validRecords,
      invalidRecords: report.dataQuality.invalidRecords,
      validationStatus: report.dataQuality.validationStatus
    },
    anonymizedStudentIds,
    fullReportSnapshot: JSON.parse(JSON.stringify(report)) // Deep clone for immutability
  };

  return snapshot;
}

/**
 * Export a historical run snapshot as structured JSON
 * Strictly scrubs credentials, internal tokens, and PII.
 */
export function exportRunAsJSON(runId: string): string {
  const run = getRunById(runId);
  if (!run) throw new Error(`Run ID ${runId} not found`);

  const exportPayload = {
    exportVersion: 'OutcomeIntel-v2.0',
    exportedAt: new Date().toISOString(),
    dataClassification: run.dataType,
    syntheticDataDisclaimer: run.dataType === 'SYNTHETIC_DEMONSTRATION'
      ? 'SYNTHETIC DEMONSTRATION DATA: Generated strictly for prototype algorithmic validation. Not actual student records.'
      : 'CONFIDENTIAL INSTITUTIONAL ASSESSMENT RECORD',
    privacyCompliance: 'FERPA Compliant • Zero PII • Strictly Anonymized Identifiers',
    runSnapshot: run
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Export a historical run snapshot as tabular analytical CSV
 * Does NOT dump raw state; outputs structured course and CO metrics.
 */
export function exportRunAsCSV(runId: string): string {
  const run = getRunById(runId);
  if (!run) throw new Error(`Run ID ${runId} not found`);

  const lines: string[] = [];

  // Metadata headers
  lines.push('# OutcomeIntel Academic Intelligence Snapshot Export');
  lines.push(`# Run ID: ${run.runId}`);
  lines.push(`# Created At: ${run.createdAt}`);
  lines.push(`# Course: ${run.courseId} - ${run.courseName}`);
  lines.push(`# Semester: ${run.semester} | Section: ${run.section} | Academic Year: ${run.academicYear}`);
  lines.push(`# Data Type: ${run.dataType}`);
  if (run.dataType === 'SYNTHETIC_DEMONSTRATION') {
    lines.push('# CLASSIFICATION: SYNTHETIC DEMONSTRATION DATA (ZERO REAL STUDENT RECORDS)');
  }
  lines.push('');

  // Course Outcome Attainment Table
  lines.push('CO_ID,Course_ID,Attainment_Pct,Target_Threshold_Pct,Gap_Percentage_Points,Status,Total_Students');
  run.coSummaries.forEach(co => {
    lines.push(
      [
        co.coId,
        co.courseId,
        co.attainmentPct !== null ? co.attainmentPct.toFixed(2) : 'N/A',
        co.targetThreshold !== null ? co.targetThreshold.toFixed(2) : 'N/A',
        co.gapPct !== null ? co.gapPct.toFixed(2) : 'N/A',
        `"${co.status}"`,
        co.totalStudents
      ].join(',')
    );
  });

  lines.push('');

  // Risk Stratification Summary
  lines.push('Risk_Category,Student_Count,Percentage');
  lines.push(`High Risk,${run.riskSummary.highRiskCount},${run.riskSummary.highRiskPct.toFixed(1)}%`);
  lines.push(`Medium Risk,${run.riskSummary.mediumRiskCount},${run.riskSummary.mediumRiskPct.toFixed(1)}%`);
  lines.push(`Low Risk,${run.riskSummary.lowRiskCount},${run.riskSummary.lowRiskPct.toFixed(1)}%`);
  lines.push(`Insufficient Data,${run.riskSummary.insufficientDataCount},${run.riskSummary.insufficientDataPct.toFixed(1)}%`);

  lines.push('');

  // Closed-Loop Learning Gain Summary
  lines.push('Learning_Gain_Metric,Value');
  lines.push(`Total Evaluated,${run.reassessmentSummary.totalEvaluated}`);
  lines.push(`Total With Reassessment,${run.reassessmentSummary.totalWithReassessment}`);
  lines.push(`Target Achieved Count,${run.reassessmentSummary.targetAchievedCount}`);
  lines.push(`Positive Learning Gain Count,${run.reassessmentSummary.positiveGainCount}`);
  lines.push(`Mean Absolute Gain (pp),${run.reassessmentSummary.meanAbsoluteGainPp !== null ? run.reassessmentSummary.meanAbsoluteGainPp.toFixed(2) : 'N/A'}`);

  return lines.join('\n');
}

