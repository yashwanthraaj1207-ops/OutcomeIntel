/**
 * OutcomeIntel Test Suite: Deterministic Cross-Run Comparison Engine Audit
 * Tests mathematical deltas, percentage-points (pp) vs percentage-change (%) differentiation,
 * missing data handling, and deterministic non-causal observations.
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

// In-line comparison engine logic for Node test runner (matching src/services/comparisonEngine.ts)
function calculateMetricDelta(baseline, comparison, isPercentageMetric = true, higherIsBetter = true) {
  if (baseline === null || comparison === null || isNaN(baseline) || isNaN(comparison)) {
    return {
      baselineValue: baseline,
      comparisonValue: comparison,
      deltaPercentagePoints: null,
      deltaAbsolute: null,
      percentageChange: null,
      direction: 'INSUFFICIENT_DATA',
      unit: isPercentageMetric ? 'pp' : 'count',
      isAvailable: false
    };
  }

  const deltaAbsolute = comparison - baseline;
  const deltaPercentagePoints = isPercentageMetric ? deltaAbsolute : null;

  let percentageChange = null;
  if (baseline !== 0) {
    percentageChange = (deltaAbsolute / Math.abs(baseline)) * 100;
  }

  let direction = 'STABLE';
  const epsilon = 0.05;
  if (Math.abs(deltaAbsolute) > epsilon) {
    if (higherIsBetter) {
      direction = deltaAbsolute > 0 ? 'IMPROVED' : 'DECLINED';
    } else {
      direction = deltaAbsolute < 0 ? 'IMPROVED' : 'DECLINED';
    }
  }

  return {
    baselineValue: baseline,
    comparisonValue: comparison,
    deltaPercentagePoints,
    deltaAbsolute,
    percentageChange,
    direction,
    unit: isPercentageMetric ? 'pp' : 'count',
    isAvailable: true
  };
}

function compareCORuns(baselineCOs, comparisonCOs) {
  const coKeys = Array.from(new Set([
    ...baselineCOs.map(c => c.coId),
    ...comparisonCOs.map(c => c.coId)
  ])).sort();

  return coKeys.map(coId => {
    const base = baselineCOs.find(c => c.coId === coId);
    const comp = comparisonCOs.find(c => c.coId === coId);

    const baseAttain = base?.attainmentPct ?? null;
    const compAttain = comp?.attainmentPct ?? null;
    const target = comp?.targetThreshold ?? base?.targetThreshold ?? null;

    const attainDelta = calculateMetricDelta(baseAttain, compAttain, true, true);

    const baseMet = (baseAttain !== null && target !== null) ? baseAttain >= target : null;
    const compMet = (compAttain !== null && target !== null) ? compAttain >= target : null;

    let statusChange = 'INSUFFICIENT_DATA';
    if (baseMet !== null && compMet !== null) {
      if (!baseMet && compMet) statusChange = 'MET_TARGET';
      else if (baseMet && !compMet) statusChange = 'DROPPED_BELOW_TARGET';
      else if (baseMet && compMet) statusChange = 'MAINTAINED_TARGET';
      else statusChange = 'STILL_BELOW_TARGET';
    }

    let observation = 'Insufficient data for longitudinal CO comparison.';
    if (attainDelta.isAvailable && attainDelta.deltaPercentagePoints !== null) {
      const pp = attainDelta.deltaPercentagePoints;
      const sign = pp >= 0 ? '+' : '';
      if (Math.abs(pp) < 0.1) {
        observation = `Observed attainment for ${coId} remained stable at ${compAttain?.toFixed(1)}%.`;
      } else if (pp > 0) {
        observation = `Observed attainment for ${coId} increased by ${sign}${pp.toFixed(1)} percentage points (from ${baseAttain?.toFixed(1)}% to ${compAttain?.toFixed(1)}%).`;
      } else {
        observation = `Observed attainment for ${coId} declined by ${pp.toFixed(1)} percentage points (from ${baseAttain?.toFixed(1)}% to ${compAttain?.toFixed(1)}%).`;
      }
    }

    return {
      coId,
      courseId: comp?.courseId || base?.courseId || 'N/A',
      targetThreshold: target,
      attainment: attainDelta,
      statusChange,
      observation
    };
  });
}

function runComparisonTests() {
  console.log('================================================================');
  console.log('TEST SUITE: CROSS-RUN COMPARISON ENGINE & DELTA MATH AUDIT');
  console.log('================================================================');

  // Test 1: Exact Percentage Points (pp) vs Percentage Change (%) calculation
  // Baseline = 70.0%, Comparison = 81.7%
  // Delta pp = 81.7 - 70.0 = +11.7 pp
  // Percentage improvement = (81.7 - 70.0) / 70.0 * 100 = 16.714%
  const delta1 = calculateMetricDelta(70.0, 81.7, true, true);
  assert(Math.abs(delta1.deltaPercentagePoints - 11.7) < 0.001, 'Test 1: Delta in percentage points equals +11.7 pp');
  assert(Math.abs(delta1.percentageChange - 16.714) < 0.01, 'Test 2: Percentage improvement equals 16.71%');
  assert(delta1.deltaPercentagePoints !== delta1.percentageChange, 'Test 3: Engine strictly differentiates pp from % improvement');
  assert(delta1.direction === 'IMPROVED', 'Test 4: Direction correctly flagged as IMPROVED');

  // Test 2: Attainment decline
  // Baseline = 75.0%, Comparison = 60.0%
  // Delta pp = -15.0 pp, % change = -20.0%
  const delta2 = calculateMetricDelta(75.0, 60.0, true, true);
  assert(delta2.deltaPercentagePoints === -15.0, 'Test 5: Attainment decline delta equals -15.0 pp');
  assert(delta2.percentageChange === -20.0, 'Test 6: Attainment percentage change equals -20.0%');
  assert(delta2.direction === 'DECLINED', 'Test 7: Direction correctly flagged as DECLINED');

  // Test 3: Metric where lower is better (e.g. high-risk count)
  // Baseline = 20 students, Comparison = 12 students
  const riskDelta = calculateMetricDelta(20, 12, false, false);
  assert(riskDelta.deltaAbsolute === -8, 'Test 8: High risk student count delta equals -8 students');
  assert(riskDelta.direction === 'IMPROVED', 'Test 9: Lower risk count correctly recognized as IMPROVED');

  // Test 4: Missing data handling (never defaults to 0)
  const missingDelta = calculateMetricDelta(null, 75.0, true, true);
  assert(missingDelta.isAvailable === false, 'Test 10: Missing baseline marks delta as unavailable');
  assert(missingDelta.deltaPercentagePoints === null, 'Test 11: Missing data never converts to 0.0 pp');
  assert(missingDelta.direction === 'INSUFFICIENT_DATA', 'Test 12: Missing data direction is INSUFFICIENT_DATA');

  // Test 5: Course Outcome comparison suite
  const baseCOs = [
    { coId: 'CO1', courseId: 'CS301', attainmentPct: 62.5, targetThreshold: 70.0, status: 'BELOW TARGET' },
    { coId: 'CO2', courseId: 'CS301', attainmentPct: 75.0, targetThreshold: 70.0, status: 'TARGET MET' },
    { coId: 'CO3', courseId: 'CS301', attainmentPct: 50.0, targetThreshold: 70.0, status: 'BELOW TARGET' }
  ];

  const compCOs = [
    { coId: 'CO1', courseId: 'CS301', attainmentPct: 74.2, targetThreshold: 70.0, status: 'TARGET MET' },
    { coId: 'CO2', courseId: 'CS301', attainmentPct: 76.0, targetThreshold: 70.0, status: 'TARGET MET' },
    { coId: 'CO3', courseId: 'CS301', attainmentPct: 48.0, targetThreshold: 70.0, status: 'BELOW TARGET' }
  ];

  const coResults = compareCORuns(baseCOs, compCOs);
  assert(coResults.length === 3, 'Test 13: All 3 Course Outcomes compared');

  const co1Res = coResults.find(c => c.coId === 'CO1');
  assert(Math.abs(co1Res.attainment.deltaPercentagePoints - 11.7) < 0.01, 'Test 14: CO1 attainment grew by +11.7 pp');
  assert(co1Res.statusChange === 'MET_TARGET', 'Test 15: CO1 status transition is MET_TARGET');
  assert(co1Res.observation.includes('increased by +11.7 percentage points'), 'Test 16: CO1 observation contains exact factual statement');

  const co2Res = coResults.find(c => c.coId === 'CO2');
  assert(co2Res.statusChange === 'MAINTAINED_TARGET', 'Test 17: CO2 maintained target status');

  const co3Res = coResults.find(c => c.coId === 'CO3');
  assert(co3Res.attainment.direction === 'DECLINED', 'Test 18: CO3 correctly identified as DECLINED');
  assert(co3Res.statusChange === 'STILL_BELOW_TARGET', 'Test 19: CO3 status transition is STILL_BELOW_TARGET');

  // Test 6: Non-causal observation audit
  const allObservations = coResults.map(c => c.observation).join(' ');
  assert(!allObservations.toLowerCase().includes('caused'), 'Test 20: Deterministic observations never claim causation (zero "caused")');
  assert(allObservations.includes('Observed attainment'), 'Test 21: Observations strictly use factual "Observed attainment" formulation');

  console.log('================================================================');
  console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================');

  process.exitCode = failCount > 0 ? 1 : 0;
}

runComparisonTests();

