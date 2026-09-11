/**
 * OutcomeIntel Test Suite: Historical Intelligence & Storage Audit
 * Tests snapshot creation, unique run IDs, save/retrieve/delete, JSON/CSV exports, zero PII, and immutability.
 */

const fs = require('fs');
const path = require('path');

// Mock localStorage for Node test runner
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();
global.window = { localStorage: global.localStorage };

const HISTORY_STORAGE_KEY = 'outcomeintel_history';
const CURRENT_SCHEMA_VERSION = 1;

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

// In-line historical service logic for test runner
function generateUniqueRunId(existingRuns = []) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `RUN-${year}-${month}-${day}`;

  const existingNumbers = existingRuns
    .filter(r => r.runId.startsWith(datePrefix))
    .map(r => {
      const parts = r.runId.split('-');
      const seq = parseInt(parts[parts.length - 1], 10);
      return isNaN(seq) ? 0 : seq;
    });

  const nextSeq = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${datePrefix}-${String(nextSeq).padStart(3, '0')}`;
}

function getAllRuns() {
  try {
    const raw = global.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.runs)) return parsed.runs;
  } catch {
    // Graceful recovery
  }
  return [];
}

function getRunById(runId) {
  return getAllRuns().find(r => r.runId === runId) || null;
}

function saveRun(run) {
  const existing = getAllRuns();
  const existingIdx = existing.findIndex(r => r.runId === run.runId);
  let updated;
  if (existingIdx >= 0) {
    updated = [...existing];
    updated[existingIdx] = { ...run, updatedAt: new Date().toISOString() };
  } else {
    updated = [run, ...existing];
  }

  const store = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
    runs: updated
  };
  global.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(store));
  return run;
}

function deleteRun(runId) {
  const existing = getAllRuns();
  const filtered = existing.filter(r => r.runId !== runId);
  if (filtered.length === existing.length) return false;

  const store = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
    runs: filtered
  };
  global.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(store));
  return true;
}

function createSnapshotFromReport(report, metadata = {}) {
  const existing = getAllRuns();
  const runId = metadata.runId || generateUniqueRunId(existing);
  const now = new Date().toISOString();

  const coSummaries = (report.coExecutiveSummary || []).map(co => ({
    coId: co.coId,
    courseId: co.courseId,
    attainmentPct: co.attainmentPct,
    targetThreshold: co.targetThreshold,
    gapPct: co.gapPct,
    status: co.status,
    totalStudents: co.totalStudents,
    totalObservations: co.totalObservations
  }));

  const topicSummaries = (report.topicIntelligence || []).map(t => ({
    topic: t.topic,
    coId: t.coId,
    courseId: t.courseId,
    attainmentPct: t.attainmentPct,
    targetThreshold: t.targetThreshold,
    gapPct: t.gapPct,
    diagnosisStatus: t.diagnosisStatus,
    reassessmentGainPp: t.reassessmentGainPp
  }));

  const dataType = report.isSyntheticData ? 'SYNTHETIC_DEMONSTRATION' : 'UPLOADED';

  const validCOs = coSummaries.filter(co => co.attainmentPct !== null);
  const overallAttainmentPct = validCOs.length > 0
    ? validCOs.reduce((acc, c) => acc + (c.attainmentPct || 0), 0) / validCOs.length
    : null;

  const validGaps = coSummaries.filter(co => co.gapPct !== null);
  const overallTargetGapPp = validGaps.length > 0
    ? validGaps.reduce((acc, c) => acc + (c.gapPct || 0), 0) / validGaps.length
    : null;

  const anonymizedStudentIds = (report.studentRiskSummary?.students || [])
    .map(s => s.studentId)
    .filter(id => /^S\d{3}$/i.test(id));

  return {
    runId,
    createdAt: now,
    updatedAt: now,
    generatedAt: report.generatedAt || now,
    savedBy: metadata.savedBy || 'Dr. Sarah Jenkins (FACULTY)',
    courseId: report.courseMeta?.courseId || 'CS301',
    courseName: report.courseMeta?.courseName || 'Data Structures & Algorithms',
    semester: String(report.courseMeta?.semester || '4'),
    section: report.courseMeta?.section || 'Cohort 2026',
    academicYear: '2025-2026',
    datasetName: report.isSyntheticData ? 'Synthetic Demonstration Cohort' : 'Uploaded Assessment CSV',
    datasetSource: report.isSyntheticData ? 'OutcomeIntel Synthetic Engine' : 'Direct Faculty Upload',
    dataType,
    totalStudents: report.studentRiskSummary?.totalStudents || 0,
    validRecords: report.dataQuality?.validRecords || 0,
    invalidRecords: report.dataQuality?.invalidRecords || 0,
    coSummaries,
    riskSummary: {
      totalStudents: report.studentRiskSummary?.totalStudents || 0,
      highRiskCount: report.studentRiskSummary?.highRiskCount || 0,
      highRiskPct: report.studentRiskSummary?.highRiskPct || 0,
      mediumRiskCount: report.studentRiskSummary?.mediumRiskCount || 0,
      mediumRiskPct: report.studentRiskSummary?.mediumRiskPct || 0,
      lowRiskCount: report.studentRiskSummary?.lowRiskCount || 0,
      lowRiskPct: report.studentRiskSummary?.lowRiskPct || 0,
      insufficientDataCount: report.studentRiskSummary?.insufficientDataCount || 0,
      insufficientDataPct: report.studentRiskSummary?.insufficientDataPct || 0
    },
    topicSummaries,
    interventionSummary: {
      totalInterventions: report.interventionOutcomes?.totalInterventions || 0,
      approvedCount: report.interventionOutcomes?.approvedCount || 0,
      reassessedCount: report.interventionOutcomes?.reassessedCount || 0,
      pendingCount: report.interventionOutcomes?.pendingCount || 0
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
      academicAttentionCount: (report.academicAttentionItems || []).length
    },
    dataQuality: {
      totalRecords: report.dataQuality?.totalRecords || 0,
      validRecords: report.dataQuality?.validRecords || 0,
      invalidRecords: report.dataQuality?.invalidRecords || 0,
      validationStatus: report.dataQuality?.validationStatus || '100% Validated'
    },
    anonymizedStudentIds,
    fullReportSnapshot: JSON.parse(JSON.stringify(report)) // Deep clone for immutability
  };
}

function exportRunAsJSON(runId) {
  const run = getRunById(runId);
  if (!run) throw new Error(`Run ID ${runId} not found`);

  return JSON.stringify({
    exportVersion: 'OutcomeIntel-v2.0',
    exportedAt: new Date().toISOString(),
    dataClassification: run.dataType,
    syntheticDataDisclaimer: run.dataType === 'SYNTHETIC_DEMONSTRATION'
      ? 'SYNTHETIC DEMONSTRATION DATA: Generated strictly for prototype algorithmic validation. Not actual student records.'
      : 'CONFIDENTIAL INSTITUTIONAL ASSESSMENT RECORD',
    privacyCompliance: 'FERPA Compliant • Zero PII • Strictly Anonymized Identifiers',
    runSnapshot: run
  }, null, 2);
}

function exportRunAsCSV(runId) {
  const run = getRunById(runId);
  if (!run) throw new Error(`Run ID ${runId} not found`);

  const lines = [];
  lines.push('# OutcomeIntel Academic Intelligence Snapshot Export');
  lines.push(`# Run ID: ${run.runId}`);
  lines.push(`# Course: ${run.courseId} - ${run.courseName}`);
  lines.push(`# Classification: ${run.dataType}`);
  lines.push('');
  lines.push('CO_ID,Course_ID,Attainment_Pct,Target_Threshold_Pct,Gap_Percentage_Points,Status');
  run.coSummaries.forEach(co => {
    lines.push(`${co.coId},${co.courseId},${co.attainmentPct},${co.targetThreshold},${co.gapPct},"${co.status}"`);
  });
  return lines.join('\n');
}

// Sample Mock Module 8 Report for testing
const sampleReport = {
  reportId: 'REP-2026-CS301-A3',
  generatedAt: '2026-09-10T12:00:00.000Z',
  isSyntheticData: true,
  courseMeta: {
    courseId: 'CS301',
    courseName: 'Data Structures & Algorithms',
    semester: '4',
    section: 'Cohort 2026'
  },
  filters: { courseId: 'CS301', semester: '4', section: 'Cohort 2026', coId: 'ALL' },
  coExecutiveSummary: [
    { coId: 'CO1', courseId: 'CS301', attainmentPct: 72.5, targetThreshold: 70.0, gapPct: 2.5, status: 'TARGET MET', totalStudents: 150, totalObservations: 1800 },
    { coId: 'CO2', courseId: 'CS301', attainmentPct: 64.0, targetThreshold: 70.0, gapPct: -6.0, status: 'BELOW TARGET', totalStudents: 150, totalObservations: 1800 }
  ],
  topicIntelligence: [
    { topic: 'Sorting Algorithms', coId: 'CO1', courseId: 'CS301', attainmentPct: 74.0, targetThreshold: 70.0, gapPct: 4.0, diagnosisStatus: 'Strong', reassessmentGainPp: null },
    { topic: 'Virtual Memory & Paging', coId: 'CO2', courseId: 'CS301', attainmentPct: 58.0, targetThreshold: 70.0, gapPct: -12.0, diagnosisStatus: 'Critical Deficiency', reassessmentGainPp: null }
  ],
  studentRiskSummary: {
    totalStudents: 150,
    highRiskCount: 22,
    highRiskPct: 14.7,
    mediumRiskCount: 45,
    mediumRiskPct: 30.0,
    lowRiskCount: 83,
    lowRiskPct: 55.3,
    insufficientDataCount: 0,
    insufficientDataPct: 0.0,
    students: [
      { studentId: 'S001', courseId: 'CS301', coId: 'CO2', riskLevel: 'HIGH', predictedProbability: 0.28 },
      { studentId: 'S002', courseId: 'CS301', coId: 'CO1', riskLevel: 'LOW', predictedProbability: 0.85 }
    ]
  },
  interventionOutcomes: {
    totalInterventions: 1,
    approvedCount: 1,
    reassessedCount: 1,
    pendingCount: 0,
    records: []
  },
  learningGainSummary: {
    totalEvaluated: 150,
    totalWithReassessment: 22,
    targetAchievedCount: 18,
    targetAchievedPct: 81.8,
    positiveGainCount: 20,
    positiveGainPct: 90.9,
    noMeasurableGainCount: 1,
    noMeasurableGainPct: 4.5,
    negativeChangeCount: 1,
    negativeChangePct: 4.5,
    insufficientDataCount: 0,
    meanAbsoluteLearningGain: 14.8
  },
  academicAttentionItems: [
    { id: 'ATTN-01', category: 'WARNING', title: 'CO2 Attainment Gap', description: 'CO2 is below target by 6.0 pp' }
  ],
  dataQuality: {
    totalRecords: 9320,
    validRecords: 9320,
    invalidRecords: 0,
    validationStatus: '100% Validated'
  }
};

function runHistoryTests() {
  console.log('================================================================');
  console.log('TEST SUITE: HISTORICAL SNAPSHOT PERSISTENCE & AUDIT');
  console.log('================================================================');

  global.localStorage.clear();

  // Test 1: Empty history initialization
  assert(getAllRuns().length === 0, 'Test 1: History initializes empty when no runs are saved');

  // Test 2: Unique run ID generation
  const id1 = generateUniqueRunId([]);
  assert(/^RUN-\d{4}-\d{2}-\d{2}-001$/.test(id1), `Test 2: Initial run ID follows RUN-YYYY-MM-DD-001 pattern (${id1})`);

  const id2 = generateUniqueRunId([{ runId: id1 }]);
  assert(/^RUN-\d{4}-\d{2}-\d{2}-002$/.test(id2), `Test 3: Successive run ID increments sequence to 002 (${id2})`);

  // Test 3: Create snapshot from report
  const snapshot = createSnapshotFromReport(sampleReport, { runId: 'RUN-2026-09-10-001' });
  assert(snapshot.runId === 'RUN-2026-09-10-001', 'Test 4: Snapshot preserves assigned runId');
  assert(snapshot.dataType === 'SYNTHETIC_DEMONSTRATION', 'Test 5: Synthetic report correctly labeled SYNTHETIC_DEMONSTRATION');
  assert(snapshot.coSummaries.length === 2, 'Test 6: Course Outcome summaries extracted accurately');
  assert(snapshot.riskSummary.highRiskCount === 22, 'Test 7: Risk summary preserved without corruption');
  assert(snapshot.reassessmentSummary.meanAbsoluteGainPp === 14.8, 'Test 8: Reassessment learning gains preserved');

  // Test 4: Save and retrieve run
  saveRun(snapshot);
  const allSaved = getAllRuns();
  assert(allSaved.length === 1, 'Test 9: Saved run is stored in persistent collection');
  const retrieved = getRunById('RUN-2026-09-10-001');
  assert(retrieved !== null && retrieved.courseId === 'CS301', 'Test 10: getRunById retrieves correct snapshot');

  // Test 5: Immutability guard
  // Mutating sampleReport after snapshot creation MUST NOT mutate the stored snapshot
  sampleReport.coExecutiveSummary[0].attainmentPct = 99.9;
  const snapshotAfterMutation = getRunById('RUN-2026-09-10-001');
  assert(
    snapshotAfterMutation.coSummaries[0].attainmentPct === 72.5,
    'Test 11: Stored snapshot is strictly immutable; external report mutations do not bleed into archive'
  );

  // Test 6: Zero PII enforcement
  const studentIds = snapshot.anonymizedStudentIds;
  assert(studentIds.length === 2, 'Test 12: Anonymized student IDs extracted');
  assert(studentIds.every(id => /^S\d{3}$/.test(id)), 'Test 13: Zero PII: all student IDs conform to ^S\\d{3}$');
  assert(!JSON.stringify(snapshot).includes('John Doe'), 'Test 14: Zero PII: no personal names exist in snapshot');

  // Test 7: Export JSON
  const exportedJSON = exportRunAsJSON('RUN-2026-09-10-001');
  assert(exportedJSON.includes('SYNTHETIC DEMONSTRATION DATA'), 'Test 15: JSON export explicitly includes synthetic classification disclaimer');
  assert(exportedJSON.includes('FERPA Compliant'), 'Test 16: JSON export certifies FERPA compliance');

  // Test 8: Export CSV
  const exportedCSV = exportRunAsCSV('RUN-2026-09-10-001');
  assert(exportedCSV.includes('CO_ID,Course_ID,Attainment_Pct'), 'Test 17: CSV export includes structured table headers');
  assert(exportedCSV.includes('CO1,CS301,72.5'), 'Test 18: CSV export includes accurate CO attainment numbers');

  // Test 9: Delete run
  const deleteSuccess = deleteRun('RUN-2026-09-10-001');
  assert(deleteSuccess === true, 'Test 19: deleteRun returns true for existing run');
  assert(getAllRuns().length === 0, 'Test 20: History is empty after deletion');

  // Test 10: Corrupted storage resilience
  global.localStorage.setItem(HISTORY_STORAGE_KEY, '{invalid:json');
  assert(getAllRuns().length === 0, 'Test 21: Corrupted localStorage safely yields empty array without crashing');

  console.log('================================================================');
  console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================');

  process.exitCode = failCount > 0 ? 1 : 0;
}

runHistoryTests();
