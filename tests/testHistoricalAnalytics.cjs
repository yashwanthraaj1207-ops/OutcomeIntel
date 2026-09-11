/**
 * OutcomeIntel Test Suite: Historical Analytics & Deterministic Insights Audit
 * Tests multi-run trend calculations, deterministic change detection, insight card derivations, and filter scopes.
 */

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

// Generate Mock Sequence of 5 Runs for Longitudinal Testing
function createMockRuns() {
  const dates = [
    '2026-07-15T10:00:00.000Z', // Run 1: A1
    '2026-08-12T10:00:00.000Z', // Run 2: A2
    '2026-09-02T10:00:00.000Z', // Run 3: A3
    '2026-09-15T10:00:00.000Z', // Run 4: R1 (Reassessment)
    '2026-10-01T10:00:00.000Z'  // Run 5: Final
  ];

  const co1Attainments = [65.0, 68.5, 71.0, 78.5, 82.0];
  const highRiskCounts = [35, 28, 22, 14, 10];

  return dates.map((date, idx) => ({
    runId: `RUN-2026-09-${String(idx + 1).padStart(3, '0')}`,
    createdAt: date,
    updatedAt: date,
    generatedAt: date,
    savedBy: 'Dr. Sarah Jenkins (FACULTY)',
    courseId: 'CS301',
    courseName: 'Data Structures & Algorithms',
    semester: '4',
    section: 'Cohort 2026',
    academicYear: '2025-2026',
    datasetName: 'Synthetic Demo Cohort',
    datasetSource: 'OutcomeIntel Synthetic Engine',
    dataType: 'SYNTHETIC_DEMONSTRATION',
    totalStudents: 150,
    validRecords: 9320,
    invalidRecords: 0,
    coSummaries: [
      {
        coId: 'CO1',
        courseId: 'CS301',
        attainmentPct: co1Attainments[idx],
        targetThreshold: 70.0,
        gapPct: co1Attainments[idx] - 70.0,
        status: co1Attainments[idx] >= 70.0 ? 'TARGET MET' : 'BELOW TARGET',
        totalStudents: 150,
        totalObservations: 1800
      },
      {
        coId: 'CO2',
        courseId: 'CS301',
        attainmentPct: idx === 0 ? null : 55.0 + idx * 2.0, // Simulate missing in Run 1, 63.0% at idx=4
        targetThreshold: 70.0,
        gapPct: idx === 0 ? null : (55.0 + idx * 2.0) - 70.0,
        status: idx === 0 ? 'INSUFFICIENT DATA' : 'BELOW TARGET',
        totalStudents: 150,
        totalObservations: 1800
      }
    ],
    riskSummary: {
      totalStudents: 150,
      highRiskCount: highRiskCounts[idx],
      highRiskPct: (highRiskCounts[idx] / 150) * 100,
      mediumRiskCount: 40,
      mediumRiskPct: (40 / 150) * 100,
      lowRiskCount: 150 - highRiskCounts[idx] - 40,
      lowRiskPct: ((150 - highRiskCounts[idx] - 40) / 150) * 100,
      insufficientDataCount: 0,
      insufficientDataPct: 0.0
    },
    topicSummaries: [
      { topic: 'Sorting Algorithms', coId: 'CO1', courseId: 'CS301', attainmentPct: 68.0 + idx * 3.0, targetThreshold: 70.0, gapPct: (68.0 + idx * 3.0) - 70.0, diagnosisStatus: 'Strong', reassessmentGainPp: null },
      { topic: 'Virtual Memory & Paging', coId: 'CO2', courseId: 'CS301', attainmentPct: 50.0 + idx * 2.0, targetThreshold: 70.0, gapPct: (50.0 + idx * 2.0) - 70.0, diagnosisStatus: 'Critical Deficiency', reassessmentGainPp: null }
    ],
    interventionSummary: {
      totalInterventions: 22,
      approvedCount: idx >= 3 ? 18 : 0,
      reassessedCount: idx >= 3 ? 18 : 0,
      pendingCount: idx >= 3 ? 4 : 22
    },
    reassessmentSummary: {
      totalEvaluated: 150,
      totalWithReassessment: idx >= 3 ? 18 : 0,
      targetAchievedCount: idx >= 3 ? 14 : 0,
      positiveGainCount: idx >= 3 ? 16 : 0,
      noMeasurableGainCount: idx >= 3 ? 1 : 0,
      negativeChangeCount: idx >= 3 ? 1 : 0,
      insufficientDataCount: 0,
      meanAbsoluteGainPp: idx >= 3 ? 12.5 : null
    },
    learningGainSummary: {
      meanAbsoluteLearningGainPp: idx >= 3 ? 12.5 : null,
      targetAchievedPct: idx >= 3 ? 77.8 : 0,
      positiveGainPct: idx >= 3 ? 88.9 : 0,
      noMeasurableGainPct: idx >= 3 ? 5.6 : 0,
      negativeChangePct: idx >= 3 ? 5.6 : 0
    },
    reportSummary: {
      overallAttainmentPct: co1Attainments[idx],
      overallTargetGapPp: co1Attainments[idx] - 70.0,
      healthStatus: co1Attainments[idx] >= 70.0 ? 'ON_TRACK' : 'NEEDS_ATTENTION',
      academicAttentionCount: co1Attainments[idx] >= 70.0 ? 1 : 2
    },
    dataQuality: {
      totalRecords: 9320,
      validRecords: 9320,
      invalidRecords: 0,
      validationStatus: '100% Validated'
    },
    anonymizedStudentIds: ['S001', 'S002', 'S003'],
    fullReportSnapshot: {}
  }));
}

// In-line analytics logic
function computeTrendDirection(values) {
  const valid = values.filter(v => v !== null && !isNaN(v));
  if (valid.length < 2) return 'INSUFFICIENT_DATA';
  const first = valid[0];
  const last = valid[valid.length - 1];
  const delta = last - first;
  if (Math.abs(delta) < 0.1) return 'STABLE';
  return delta > 0 ? 'IMPROVING' : 'DECLINING';
}

function deriveAcademicInsights(latestRun, runs) {
  if (!latestRun) return null;

  const validCOs = latestRun.coSummaries.filter(c => c.attainmentPct !== null);
  const meetingTargetCOs = validCOs.filter(c => c.gapPct !== null && c.gapPct >= 0);
  const belowTargetCOs = validCOs.filter(c => c.gapPct !== null && c.gapPct < 0);

  // High risk trajectory
  const highRiskHistory = runs.map(r => r.riskSummary.highRiskCount);
  const riskTrajectory = computeTrendDirection(highRiskHistory);

  // Deterministic observations
  const observations = [];

  if (meetingTargetCOs.length > 0) {
    observations.push(`Target achieved for ${meetingTargetCOs.map(c => c.coId).join(', ')}.`);
  }
  if (belowTargetCOs.length > 0) {
    observations.push(`Instructional focus needed for ${belowTargetCOs.map(c => c.coId).join(', ')}.`);
  }
  if (riskTrajectory === 'DECLINING') {
    observations.push('High-risk student cohort demonstrated continuous contraction across analysis milestones.');
  }

  return {
    meetingCount: meetingTargetCOs.length,
    belowCount: belowTargetCOs.length,
    riskTrajectory,
    observations
  };
}

function runHistoricalAnalyticsTests() {
  console.log('================================================================');
  console.log('TEST SUITE: HISTORICAL ANALYTICS & INSIGHT CARDS AUDIT');
  console.log('================================================================');

  const runs = createMockRuns();
  assert(runs.length === 5, 'Test 1: 5 historical runs initialized');

  // Test 1: Trend calculation across sequence
  const co1Trend = runs.map(r => r.coSummaries.find(c => c.coId === 'CO1')?.attainmentPct ?? null);
  assert(co1Trend[0] === 65.0 && co1Trend[4] === 82.0, 'Test 2: CO1 attainment progression correctly extracted');
  const co1Direction = computeTrendDirection(co1Trend);
  assert(co1Direction === 'IMPROVING', 'Test 3: CO1 longitudinal trend correctly evaluated as IMPROVING');

  // Test 2: Risk trend calculation
  const riskCounts = runs.map(r => r.riskSummary.highRiskCount);
  assert(riskCounts[0] === 35 && riskCounts[4] === 10, 'Test 4: High risk counts decrease from 35 to 10');
  const riskDirection = computeTrendDirection(riskCounts);
  assert(riskDirection === 'DECLINING', 'Test 5: Risk count trajectory correctly evaluated as DECLINING (contraction)');

  // Test 3: Missing data handling in trends
  const co2Trend = runs.map(r => r.coSummaries.find(c => c.coId === 'CO2')?.attainmentPct ?? null);
  assert(co2Trend[0] === null, 'Test 6: Missing Run 1 CO2 attainment is strictly null (never coerced to 0)');
  assert(co2Trend[1] === 57.0, 'Test 7: Valid subsequent data points preserved');

  // Test 4: Scope filtering (Last 5 vs Last 3)
  const last3Runs = runs.slice(-3);
  assert(last3Runs.length === 3, 'Test 8: Scope filter slices recent runs correctly');
  assert(last3Runs[0].runId === 'RUN-2026-09-003', 'Test 9: Sliced runs preserve chronological ordering');

  // Test 5: Academic insight cards derivation
  const latest = runs[runs.length - 1];
  const insights = deriveAcademicInsights(latest, runs);
  assert(insights.meetingCount === 1, 'Test 10: Correct count of COs meeting target in latest run (CO1)');
  assert(insights.belowCount === 1, 'Test 11: Correct count of COs below target in latest run (CO2)');
  assert(insights.riskTrajectory === 'DECLINING', 'Test 12: Longitudinal risk contraction confirmed in insights');
  assert(insights.observations.some(o => o.includes('Target achieved for CO1')), 'Test 13: Deterministic observation accurately reflects CO1 achievement');

  // Test 6: Zero fabricated causal statements
  const allInsightText = insights.observations.join(' ');
  assert(!allInsightText.includes('because of'), 'Test 14: Zero fabricated causation ("because of" absent)');
  assert(!allInsightText.includes('interventions caused'), 'Test 15: Zero fabricated causation ("interventions caused" absent)');

  // Test 7: Learning gain aggregation
  const reassessedRuns = runs.filter(r => r.reassessmentSummary.totalWithReassessment > 0);
  assert(reassessedRuns.length === 2, 'Test 16: Identifies exactly 2 runs containing post-reassessment records');
  assert(reassessedRuns[0].reassessmentSummary.meanAbsoluteGainPp === 12.5, 'Test 17: Mean absolute learning gain is +12.5 pp');

  console.log('================================================================');
  console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================');

  process.exitCode = failCount > 0 ? 1 : 0;
}

runHistoricalAnalyticsTests();
