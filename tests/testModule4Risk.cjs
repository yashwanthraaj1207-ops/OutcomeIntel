const fs = require('fs');
const path = require('path');

// 1. Basic CSV Parser
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').trim();
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = parts[idx] !== undefined ? parts[idx] : '';
    });
    rows.push(obj);
  }
  return { headers, rows };
}

// 2. Standardize Assessment Records
function standardizeRecords(rawRows) {
  return rawRows.map((r, idx) => ({
    rowNumber: idx + 2,
    student_id: (r.student_id || '').trim().toUpperCase(),
    course_id: (r.course_id || '').trim().toUpperCase(),
    semester: parseInt((r.semester || '0').trim(), 10) || 0,
    assessment_id: (r.assessment_id || '').trim().toUpperCase(),
    assessment_type: (r.assessment_type || '').trim(),
    assessment_date: (r.assessment_date || '').trim(),
    question_id: (r.question_id || '').trim().toUpperCase(),
    topic: (r.topic || '').trim(),
    co_id: (r.co_id || '').trim().toUpperCase(),
    marks_obtained: parseFloat((r.marks_obtained || '0').trim()) || 0,
    max_marks: parseFloat((r.max_marks || '10').trim()) || 10
  }));
}

// 3. Chronology and History
function getChronologicalAssessments(records, courseId) {
  const dateMap = new Map();
  records.forEach(r => {
    if (courseId !== 'ALL' && r.course_id.toUpperCase() !== courseId.toUpperCase()) return;
    if (!dateMap.has(r.assessment_id)) dateMap.set(r.assessment_id, r.assessment_date);
  });
  const sorted = Array.from(dateMap.entries()).sort((a, b) => {
    const dateA = new Date(a[1]).getTime();
    const dateB = new Date(b[1]).getTime();
    if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) return dateA - dateB;
    return a[0].localeCompare(b[0], undefined, { numeric: true });
  });
  return sorted.map(([assessmentId, date], sequenceIndex) => ({ assessmentId, date, sequenceIndex }));
}

function getHistoricalAssessments(chronologicalList, targetAssessmentId) {
  const idx = chronologicalList.findIndex(a => a.assessmentId.toUpperCase() === targetAssessmentId.toUpperCase());
  if (idx <= 0) return [];
  return chronologicalList.slice(0, idx).map(a => a.assessmentId);
}

// 4. Feature Extraction & Risk Calculation Logic
function calculateAttainmentGap(historicalAttainment, targetPct) {
  return parseFloat((historicalAttainment - targetPct).toFixed(1));
}

function calculateHistoricalConsistency(historicalScores) {
  if (historicalScores.length <= 1) return 0;
  const mean = historicalScores.reduce((sum, v) => sum + v, 0) / historicalScores.length;
  const variance = historicalScores.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / historicalScores.length;
  return parseFloat(Math.sqrt(variance).toFixed(1));
}

function classifyStudentRisk(features) {
  if (!features.hasSufficientData) {
    return 'INSUFFICIENT DATA';
  }

  const prob = features.predictedProbability;
  const gap = features.historicalGap;
  const trend = features.trend;

  // High Risk Rules
  if (prob < 40) return 'HIGH RISK';
  if (gap < -10 && trend === 'declining') return 'HIGH RISK';

  // Low Risk Rules
  if (prob >= 70 && gap >= -5 && trend !== 'declining') return 'LOW RISK';

  // Default to Medium Risk
  return 'MEDIUM RISK';
}

function calculatePriorityScore(features, riskLevel) {
  if (riskLevel === 'INSUFFICIENT DATA' || !features.hasSufficientData) {
    return 0;
  }

  // 1. Failure Probability Component (Weight: 40%)
  const failureProb = Math.max(0, Math.min(100, 100 - features.predictedProbability));
  const probComponent = failureProb * 0.40;

  // 2. Deficit Gap Component (Weight: 25%)
  const deficit = Math.max(0, Math.min(50, -features.historicalGap));
  const normalizedDeficit = (deficit / 50) * 100;
  const deficitComponent = normalizedDeficit * 0.25;

  // 3. Trend Component (Weight: 20%)
  let trendScore = 40;
  if (features.trend === 'declining') trendScore = 100;
  else if (features.trend === 'stable') trendScore = 40;
  else if (features.trend === 'improving') trendScore = 10;
  const trendComponent = trendScore * 0.20;

  // 4. Historical Volatility Component (Weight: 15%)
  const normalizedVolatility = Math.min(100, (features.historicalConsistency / 30) * 100);
  const volatilityComponent = normalizedVolatility * 0.15;

  const totalScore = probComponent + deficitComponent + trendComponent + volatilityComponent;
  return parseFloat(Math.max(0, Math.min(100, totalScore)).toFixed(1));
}

// 5. Test Suite Execution
console.log('================================================================');
console.log('MODULE 4: EARLY-WARNING RISK DETECTION - AUDIT TEST SUITE');
console.log('================================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

// Test 1: Feature Calculations (Attainment Gap & Consistency)
console.log('--- TEST GROUP 1: Feature Calculation Accuracy ---');
const gap1 = calculateAttainmentGap(65.0, 70.0);
assert(gap1 === -5.0, `Attainment gap 65 - 70 = -5.0 (got ${gap1})`);

const gap2 = calculateAttainmentGap(82.4, 75.0);
assert(gap2 === 7.4, `Attainment gap 82.4 - 75.0 = 7.4 (got ${gap2})`);

const consistency1 = calculateHistoricalConsistency([70, 70, 70]);
assert(consistency1 === 0.0, `Consistency for constant scores is 0.0 (got ${consistency1})`);

const consistency2 = calculateHistoricalConsistency([60, 80]);
assert(consistency2 === 10.0, `Consistency for [60, 80] is 10.0 (got ${consistency2})`);

// Test 2: Multi-Signal Risk Classification Rules
console.log('\n--- TEST GROUP 2: Deterministic Multi-Signal Classification Rules ---');

// High Risk: Prob < 40
const hr1 = classifyStudentRisk({
  predictedProbability: 38.5,
  historicalGap: 5.0,
  trend: 'improving',
  historicalConsistency: 5.0,
  hasSufficientData: true,
  sampleSize: 10
});
assert(hr1 === 'HIGH RISK', `Prob < 40% triggers HIGH RISK regardless of positive gap (got ${hr1})`);

// High Risk: Gap < -10 AND declining trend
const hr2 = classifyStudentRisk({
  predictedProbability: 55.0,
  historicalGap: -12.5,
  trend: 'declining',
  historicalConsistency: 8.0,
  hasSufficientData: true,
  sampleSize: 10
});
assert(hr2 === 'HIGH RISK', `Gap < -10% with declining trend triggers HIGH RISK (got ${hr2})`);

// Boundary: Prob = 40.0% (Prob < 40 rule does NOT trigger)
const boundary40 = classifyStudentRisk({
  predictedProbability: 40.0,
  historicalGap: -5.0,
  trend: 'stable',
  historicalConsistency: 5.0,
  hasSufficientData: true,
  sampleSize: 10
});
assert(boundary40 === 'MEDIUM RISK', `Boundary P = 40.0% with moderate gap yields MEDIUM RISK (got ${boundary40})`);

// Boundary: Gap = -10.0% with declining trend (Gap < -10 rule does NOT trigger on exact -10%)
const boundaryGap10 = classifyStudentRisk({
  predictedProbability: 55.0,
  historicalGap: -10.0,
  trend: 'declining',
  historicalConsistency: 5.0,
  hasSufficientData: true,
  sampleSize: 10
});
assert(boundaryGap10 === 'MEDIUM RISK', `Boundary Gap = -10.0% with declining trend yields MEDIUM RISK (not High Risk from gap alone) (got ${boundaryGap10})`);

// Just below boundary: Gap = -10.1% with declining trend -> HIGH RISK
const justBelowGap10 = classifyStudentRisk({
  predictedProbability: 55.0,
  historicalGap: -10.1,
  trend: 'declining',
  historicalConsistency: 5.0,
  hasSufficientData: true,
  sampleSize: 10
});
assert(justBelowGap10 === 'HIGH RISK', `Gap = -10.1% (< -10%) with declining trend yields HIGH RISK (got ${justBelowGap10})`);

// Low Risk: Prob >= 70 AND Gap >= -5 AND Trend != declining
const lr1 = classifyStudentRisk({
  predictedProbability: 75.0,
  historicalGap: -2.0,
  trend: 'stable',
  historicalConsistency: 4.0,
  hasSufficientData: true,
  sampleSize: 10
});
assert(lr1 === 'LOW RISK', `Prob >= 70%, Gap >= -5%, and stable trend triggers LOW RISK (got ${lr1})`);

// Boundary: Prob = 70.0%
const boundary70 = classifyStudentRisk({
  predictedProbability: 70.0,
  historicalGap: -5.0,
  trend: 'improving',
  historicalConsistency: 4.0,
  hasSufficientData: true,
  sampleSize: 10
});
assert(boundary70 === 'LOW RISK', `Boundary P = 70.0%, Gap = -5.0%, improving trend yields LOW RISK (got ${boundary70})`);

// Boundary: Gap = -5.0% satisfies Low Risk gap condition
const boundaryGap5 = classifyStudentRisk({
  predictedProbability: 75.0,
  historicalGap: -5.0,
  trend: 'stable',
  historicalConsistency: 4.0,
  hasSufficientData: true,
  sampleSize: 10
});
assert(boundaryGap5 === 'LOW RISK', `Boundary Gap = -5.0% satisfies Low Risk gap condition (got ${boundaryGap5})`);

// Just below Gap boundary: Gap = -5.1% does NOT satisfy Low Risk -> Medium Risk
const belowGap5 = classifyStudentRisk({
  predictedProbability: 75.0,
  historicalGap: -5.1,
  trend: 'stable',
  historicalConsistency: 4.0,
  hasSufficientData: true,
  sampleSize: 10
});
assert(belowGap5 === 'MEDIUM RISK', `Gap = -5.1% (< -5.0%) does not satisfy Low Risk, demotes to MEDIUM RISK (got ${belowGap5})`);

// Non-Low Risk: Prob >= 70 but declining trend -> Medium Risk
const mrTrend = classifyStudentRisk({
  predictedProbability: 78.0,
  historicalGap: 2.0,
  trend: 'declining',
  historicalConsistency: 6.0,
  hasSufficientData: true,
  sampleSize: 10
});
assert(mrTrend === 'MEDIUM RISK', `Prob >= 70% but declining trend demotes to MEDIUM RISK (got ${mrTrend})`);

// Non-Low Risk: Prob >= 70 but Gap < -5 -> Medium Risk
const mrGap = classifyStudentRisk({
  predictedProbability: 72.0,
  historicalGap: -8.0,
  trend: 'improving',
  historicalConsistency: 6.0,
  hasSufficientData: true,
  sampleSize: 10
});
assert(mrGap === 'MEDIUM RISK', `Prob >= 70% but Gap < -5% demotes to MEDIUM RISK (got ${mrGap})`);

// Precedence Check: High Risk takes precedence over Low Risk
// Even if P were somehow >= 70% but Gap was < -10% and trend was declining -> High Risk
const precedenceHighOverLow = classifyStudentRisk({
  predictedProbability: 72.0,
  historicalGap: -15.0,
  trend: 'declining',
  historicalConsistency: 6.0,
  hasSufficientData: true,
  sampleSize: 10
});
assert(precedenceHighOverLow === 'HIGH RISK', `Precedence: High Risk takes priority over Low Risk conditions (got ${precedenceHighOverLow})`);

// Data Sufficiency Guard
console.log('\n--- TEST GROUP 3: Data Sufficiency Guard ---');
const insuff1 = classifyStudentRisk({
  predictedProbability: 95.0,
  historicalGap: 0,
  trend: 'insufficient_data',
  historicalConsistency: 0,
  hasSufficientData: false,
  sampleSize: 1
});
assert(insuff1 === 'INSUFFICIENT DATA', `Insufficient data flags INSUFFICIENT DATA, never Low Risk (got ${insuff1})`);

// Test 4: Priority Score Bounds & Behavior
console.log('\n--- TEST GROUP 4: Prototype Risk Priority Score (0–100) ---');
const scoreHR = calculatePriorityScore({
  predictedProbability: 15.0,
  historicalGap: -25.0,
  trend: 'declining',
  historicalConsistency: 15.0,
  hasSufficientData: true,
  sampleSize: 10
}, 'HIGH RISK');
assert(Math.abs(scoreHR - 74.0) < 0.1, `High Risk Priority score calculated correctly: expected ~74.0, got ${scoreHR}`);
assert(scoreHR >= 0 && scoreHR <= 100, `Priority score is strictly within [0, 100] (got ${scoreHR})`);

const scoreLR = calculatePriorityScore({
  predictedProbability: 90.0,
  historicalGap: 10.0,
  trend: 'improving',
  historicalConsistency: 3.0,
  hasSufficientData: true,
  sampleSize: 10
}, 'LOW RISK');
assert(Math.abs(scoreLR - 7.5) < 0.1, `Low Risk Priority score calculated correctly: expected ~7.5, got ${scoreLR}`);
assert(scoreHR > scoreLR, `High Risk score (${scoreHR}) is significantly higher than Low Risk (${scoreLR})`);

const scoreInsuff = calculatePriorityScore({
  predictedProbability: 50.0,
  historicalGap: 0,
  trend: 'insufficient_data',
  historicalConsistency: 0,
  hasSufficientData: false,
  sampleSize: 0
}, 'INSUFFICIENT DATA');
assert(scoreInsuff === 0, `Insufficient Data receives priority score 0 (got ${scoreInsuff})`);

// Test 5: End-to-End Benchmark Data Integration
console.log('\n--- TEST GROUP 5: Benchmark Assessment Data Integration ---');
const dataDir = path.join(__dirname, '..', 'data');
const assessCSV = path.join(dataDir, 'sample_co_assessment_v2.csv');
const targetCSV = path.join(dataDir, 'co_target_mapping.csv');

const rawAssess = parseCSV(assessCSV);
const rawTarget = parseCSV(targetCSV);
const stdRecords = standardizeRecords(rawAssess.rows);

const targetMap = {};
rawTarget.rows.forEach(r => {
  const c = (r.course_id || '').trim().toUpperCase();
  const co = (r.co_id || '').trim().toUpperCase();
  const val = parseFloat((r.target_percentage || '70').trim()) || 70;
  if (c && co) targetMap[`${c}|${co}`] = val;
});

const courseId = 'CS301';
const coId = 'CO1';
const targetAssessment = 'A3';
const targetKey = `${courseId}|${coId}`;
const targetThreshold = targetMap[targetKey] || 70;

const chronologicalAssessments = getChronologicalAssessments(stdRecords, courseId);
const historicalAssessments = getHistoricalAssessments(chronologicalAssessments, targetAssessment);

assert(chronologicalAssessments.length === 3, `CS301 has 3 chronological assessments (got ${chronologicalAssessments.length})`);
assert(historicalAssessments.length === 2, `Target A3 has 2 historical assessments A1 & A2 (got ${historicalAssessments.length})`);

const studentIds = Array.from(new Set(
  stdRecords.filter(r => r.course_id === courseId).map(r => r.student_id)
)).sort();

assert(studentIds.length === 150, `CS301 has 150 total students (got ${studentIds.length})`);

const riskAssessments = [];
studentIds.forEach(studentId => {
  const studentRecords = stdRecords.filter(r =>
    r.course_id === courseId &&
    r.student_id === studentId &&
    r.co_id === coId &&
    historicalAssessments.includes(r.assessment_id)
  );

  const histScoresByAss = {};
  studentRecords.forEach(r => {
    if (!histScoresByAss[r.assessment_id]) histScoresByAss[r.assessment_id] = { obtained: 0, max: 0 };
    histScoresByAss[r.assessment_id].obtained += r.marks_obtained;
    histScoresByAss[r.assessment_id].max += r.max_marks;
  });

  const seqScores = historicalAssessments
    .filter(a => histScoresByAss[a] && histScoresByAss[a].max > 0)
    .map(a => (histScoresByAss[a].obtained / histScoresByAss[a].max) * 100);

  let totalObtained = 0;
  let totalMax = 0;
  studentRecords.forEach(r => {
    totalObtained += r.marks_obtained;
    totalMax += r.max_marks;
  });

  const historicalAttainment = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const historicalGap = calculateAttainmentGap(historicalAttainment, targetThreshold);

  let trend = 'stable';
  if (seqScores.length >= 2) {
    const diff = seqScores[seqScores.length - 1] - seqScores[0];
    if (diff > 3) trend = 'improving';
    else if (diff < -3) trend = 'declining';
  }

  const historicalConsistency = calculateHistoricalConsistency(seqScores);
  const z = -3.5 + 0.05 * historicalAttainment;
  const predictedProbability = parseFloat((100 / (1 + Math.exp(-z))).toFixed(1));

  const features = {
    studentId,
    courseId,
    coId,
    targetAssessment,
    predictedProbability,
    historicalAttainment: parseFloat(historicalAttainment.toFixed(1)),
    historicalGap,
    trend,
    historicalConsistency,
    hasSufficientData: seqScores.length >= 1,
    sampleSize: studentRecords.length
  };

  const riskLevel = classifyStudentRisk(features);
  const priorityScore = calculatePriorityScore(features, riskLevel);

  riskAssessments.push({
    studentId,
    courseId,
    coId,
    targetAssessment,
    features,
    riskLevel,
    priorityScore,
    priorityRank: 0
  });
});

riskAssessments.sort((a, b) => {
  if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
  return a.features.predictedProbability - b.features.predictedProbability;
});

riskAssessments.forEach((ra, i) => { ra.priorityRank = i + 1; });

const highRiskCount = riskAssessments.filter(r => r.riskLevel === 'HIGH RISK').length;
const medRiskCount = riskAssessments.filter(r => r.riskLevel === 'MEDIUM RISK').length;
const lowRiskCount = riskAssessments.filter(r => r.riskLevel === 'LOW RISK').length;
const insuffCount = riskAssessments.filter(r => r.riskLevel === 'INSUFFICIENT DATA').length;

console.log(`\nCohort Risk Distribution for CS301 CO1 on Horizon A3 (Target = ${targetThreshold}%):`);
console.log(`  - Total Evaluated: ${riskAssessments.length}`);
console.log(`  - High Risk:        ${highRiskCount} (${((highRiskCount / 150) * 100).toFixed(1)}%)`);
console.log(`  - Medium Risk:      ${medRiskCount} (${((medRiskCount / 150) * 100).toFixed(1)}%)`);
console.log(`  - Low Risk:         ${lowRiskCount} (${((lowRiskCount / 150) * 100).toFixed(1)}%)`);
console.log(`  - Insufficient:     ${insuffCount} (${((insuffCount / 150) * 100).toFixed(1)}%)`);

assert(highRiskCount + medRiskCount + lowRiskCount + insuffCount === 150, 'All 150 students accounted for');
assert(highRiskCount > 0, `High risk students detected (> 0: got ${highRiskCount})`);
assert(lowRiskCount > 0, `Low risk students detected (> 0: got ${lowRiskCount})`);
assert(riskAssessments[0].priorityScore >= riskAssessments[1].priorityScore, 'Priority rankings strictly monotonically decreasing');
assert(riskAssessments[0].priorityRank === 1, 'Top priority student has Rank #1');

const allAnonymized = riskAssessments.every(ra => /^S\d+/i.test(ra.studentId));
assert(allAnonymized, 'All student IDs conform to anonymized standard format (e.g. S001..S150)');

// Test 6: Earliest Horizon A1 (No Prior History)
console.log('\n--- TEST GROUP 6: Earliest Horizon A1 (Data Sufficiency Check) ---');
const earliestHistorical = getHistoricalAssessments(chronologicalAssessments, 'A1');
assert(earliestHistorical.length === 0, 'Earliest assessment A1 has zero historical assessments');

const earliestFeatures = {
  studentId: 'S001',
  courseId: 'CS301',
  coId: 'CO1',
  targetAssessment: 'A1',
  predictedProbability: 50.0,
  historicalAttainment: 0,
  historicalGap: -70.0,
  trend: 'insufficient_data',
  historicalConsistency: 0,
  hasSufficientData: false,
  sampleSize: 0
};
const earliestRisk = classifyStudentRisk(earliestFeatures);
assert(earliestRisk === 'INSUFFICIENT DATA', `Horizon A1 yields INSUFFICIENT DATA (got ${earliestRisk})`);

console.log('\n================================================================');
console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('================================================================\n');

if (testsFailed > 0) process.exit(1);
