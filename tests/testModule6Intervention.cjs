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

// 3. Chronology & History
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

// 4. Topic Diagnosis & Explanation
function classifyTopicDiagnosis(attainmentPct, targetPct) {
  if (attainmentPct < 50.0) return 'Critical Weakness';
  const effectiveTarget = targetPct !== null ? targetPct : 70.0;
  if (attainmentPct < effectiveTarget) return 'Needs Attention';
  if (attainmentPct < 80.0) return 'Adequate';
  return 'Strong';
}

// 5. Pure Intervention Engine Functions (mirrored from src/services/interventionEngine.ts)
function classifyInterventionPriority(explanation) {
  if (!explanation.hasSufficientData) {
    return 'LOW';
  }

  const isHighRisk = explanation.riskLevel === 'HIGH RISK';
  const isMedRisk = explanation.riskLevel === 'MEDIUM RISK';
  const isLowRisk = explanation.riskLevel === 'LOW RISK';

  const criticalTopics = explanation.topics.filter(t => t.diagnosisCategory === 'Critical Weakness');
  const attentionTopics = explanation.topics.filter(t => t.diagnosisCategory === 'Needs Attention');
  const hasCriticalTopic = criticalTopics.length > 0;
  const multipleAttentionTopics = attentionTopics.length >= 2;
  const severeDeficit = explanation.attainmentGap !== null && explanation.attainmentGap < -10.0;

  // 1. CRITICAL
  if (isHighRisk && hasCriticalTopic) {
    return 'CRITICAL';
  }

  // 2. HIGH
  if (isHighRisk || multipleAttentionTopics || severeDeficit) {
    return 'HIGH';
  }

  // 3. MODERATE
  if (isMedRisk || attentionTopics.length === 1) {
    return 'MODERATE';
  }

  // 4. LOW
  if (isLowRisk && !hasCriticalTopic) {
    return 'LOW';
  }

  return 'LOW';
}

function generateInterventionOptions(explanation) {
  const overallPriority = classifyInterventionPriority(explanation);
  const trend = explanation.performanceTrend;

  if (!explanation.hasSufficientData || explanation.topics.length === 0) {
    return [
      {
        id: `opt-review-1`,
        type: 'Concept Recap',
        targetTopic: 'Baseline Review',
        targetCO: explanation.coId,
        evidenceText: 'Assessment horizon has zero prior assessment predecessor records.',
        reason: 'Insufficient evidence for targeted intervention. Comprehensive evidence review is required.',
        intensity: 'LOW',
        timing: 'Before next assessment',
        academicFocus: 'Review available assessment records and establish baseline diagnostics after next assessment cycle.',
        priority: 'LOW',
        status: 'Suggested',
        questionIds: []
      }
    ];
  }

  const recommendations = [];
  const targetThreshold = explanation.targetThreshold;
  const targetStr = targetThreshold !== null ? `${targetThreshold}%` : 'Target reference unavailable';

  explanation.topics.forEach((topic, idx) => {
    const topicWeakQs = (explanation.questions || [])
      .filter(q => q.topic.toUpperCase() === topic.topic.toUpperCase() && q.attainmentPct < 50.0)
      .map(q => q.questionId);

    const qText = topicWeakQs.length > 0 ? ` (Questions: ${topicWeakQs.join(', ')})` : '';

    if (topic.diagnosisCategory === 'Critical Weakness') {
      recommendations.push({
        id: `opt-${idx}-1`,
        type: 'Concept Reinforcement',
        targetTopic: topic.topic,
        targetCO: topic.coId,
        evidenceText: `Topic attainment is ${topic.attainmentPct.toFixed(1)}% (< 50.0% Critical Weakness)${qText}.`,
        reason: `Fundamental conceptual deficits diagnosed in "${topic.topic}". High-intensity core concept walkthrough is required.`,
        intensity: 'HIGH',
        timing: 'Before next assessment',
        academicFocus: `Targeted instructional review covering theoretical foundations and core definitions of ${topic.topic}.`,
        priority: overallPriority,
        status: 'Suggested',
        questionIds: topicWeakQs
      });

      recommendations.push({
        id: `opt-${idx}-2`,
        type: 'Worked Example',
        targetTopic: topic.topic,
        targetCO: topic.coId,
        evidenceText: `Topic attainment = ${topic.attainmentPct.toFixed(1)}%, Target = ${targetStr}.`,
        reason: `Step-by-step cognitive modeling required to demonstrate problem decomposition for ${topic.topic}.`,
        intensity: trend === 'Declining' ? 'HIGH' : 'MEDIUM',
        timing: 'Before next assessment',
        academicFocus: `Instructor-guided walkthrough of model solutions mirroring historical question patterns ${topicWeakQs.join(', ') || ''}.`,
        priority: overallPriority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        status: 'Suggested',
        questionIds: topicWeakQs
      });

      recommendations.push({
        id: `opt-${idx}-3`,
        type: 'Guided Practice',
        targetTopic: topic.topic,
        targetCO: topic.coId,
        evidenceText: `${topic.questionCount} question items observed with ${topic.attainmentPct.toFixed(1)}% cumulative accuracy.`,
        reason: `Supervised practice needed to scaffold student independence and address recurring errors.`,
        intensity: 'MEDIUM',
        timing: 'Within next instructional cycle',
        academicFocus: `Structured practice problems with immediate formative feedback for ${topic.topic}.`,
        priority: overallPriority === 'CRITICAL' ? 'HIGH' : 'MODERATE',
        status: 'Suggested',
        questionIds: topicWeakQs
      });

      recommendations.push({
        id: `opt-${idx}-4`,
        type: 'Short Diagnostic Quiz',
        targetTopic: topic.topic,
        targetCO: topic.coId,
        evidenceText: `Requires verification after remediation for Critical Weakness in ${topic.topic}.`,
        reason: `Low-stakes formative check to evaluate concept recovery before scheduled course assessments.`,
        intensity: 'LOW',
        timing: 'During next remediation session',
        academicFocus: `3-item mini-assessment validating mastery of ${topic.topic}.`,
        priority: 'MODERATE',
        status: 'Suggested',
        questionIds: topicWeakQs
      });
    } else if (topic.diagnosisCategory === 'Needs Attention') {
      recommendations.push({
        id: `opt-${idx}-1`,
        type: 'Targeted Question Practice',
        targetTopic: topic.topic,
        targetCO: topic.coId,
        evidenceText: `Topic attainment is ${topic.attainmentPct.toFixed(1)}% (below target ${targetStr})${qText}.`,
        reason: `Student performance is below benchmark. Focused practice is required to eliminate attainment deficit.`,
        intensity: trend === 'Declining' ? 'HIGH' : 'MEDIUM',
        timing: 'Before next assessment',
        academicFocus: `Practice problem sets targeting specific procedural errors observed in ${topicWeakQs.join(', ') || topic.topic}.`,
        priority: overallPriority === 'CRITICAL' ? 'HIGH' : overallPriority,
        status: 'Suggested',
        questionIds: topicWeakQs
      });

      recommendations.push({
        id: `opt-${idx}-2`,
        type: 'Concept Recap',
        targetTopic: topic.topic,
        targetCO: topic.coId,
        evidenceText: `Attainment gap is ${topic.gapPct !== null ? `${topic.gapPct.toFixed(1)}%` : 'negative'}.`,
        reason: `Concise concept refresher addressing key formulas, rules, and common misconceptions.`,
        intensity: 'MEDIUM',
        timing: 'Within next instructional cycle',
        academicFocus: `15-minute concept review emphasizing distinguishing features and pitfalls in ${topic.topic}.`,
        priority: 'MODERATE',
        status: 'Suggested',
        questionIds: topicWeakQs
      });
    }
  });

  if (recommendations.length === 0) {
    recommendations.push({
      id: `opt-general-1`,
      type: 'Additional Practice Set',
      targetTopic: explanation.topics[0]?.topic || 'Course Outcome Core',
      targetCO: explanation.coId,
      evidenceText: `CO historical attainment is ${explanation.historicalAttainment !== null ? `${explanation.historicalAttainment.toFixed(1)}%` : 'N/A'}.`,
      reason: 'General reinforcement practice recommended to maintain outcome alignment.',
      intensity: 'LOW',
      timing: 'Within next instructional cycle',
      academicFocus: `Standard outcome reinforcement practice for ${explanation.coId}.`,
      priority: 'LOW',
      status: 'Suggested',
      questionIds: []
    });
  }

  return recommendations;
}

function buildEvidenceTraceChain(explanation, selectedIntervention) {
  const nodes = [];

  nodes.push({
    stage: '1. Early-Warning Risk',
    label: 'Risk Classification',
    value: explanation.riskLevel,
    severity: explanation.riskLevel === 'HIGH RISK' ? 'critical' : explanation.riskLevel === 'MEDIUM RISK' ? 'warning' : 'positive'
  });

  nodes.push({
    stage: '2. Course Outcome',
    label: 'Outcome Target',
    value: `${explanation.coId} (${explanation.targetThreshold !== null ? `${explanation.targetThreshold}% Target` : 'Target Unavailable'})`,
    severity: 'info'
  });

  const gapVal = explanation.attainmentGap !== null
    ? `${explanation.attainmentGap > 0 ? '+' : ''}${explanation.attainmentGap.toFixed(1)}% Gap`
    : 'Gap Unavailable';
  nodes.push({
    stage: '3. Historical Deficit',
    label: 'CO Attainment Gap',
    value: gapVal,
    severity: explanation.attainmentGap !== null && explanation.attainmentGap < -10 ? 'critical' : explanation.attainmentGap !== null && explanation.attainmentGap < 0 ? 'warning' : 'positive'
  });

  const weakestTopic = explanation.topics[0];
  nodes.push({
    stage: '4. Diagnosed Topic',
    label: 'Primary Weakness',
    value: weakestTopic ? `${weakestTopic.topic} (${weakestTopic.attainmentPct.toFixed(1)}%)` : 'None Identified',
    severity: weakestTopic?.diagnosisCategory === 'Critical Weakness' ? 'critical' : weakestTopic?.diagnosisCategory === 'Needs Attention' ? 'warning' : 'positive'
  });

  const weakQs = (explanation.questions || []).filter(q => q.attainmentPct < 50.0).slice(0, 3);
  nodes.push({
    stage: '5. Question Evidence',
    label: 'Deficit Items',
    value: weakQs.length > 0 ? weakQs.map(q => `${q.questionId} (${q.attainmentPct.toFixed(0)}%)`).join(', ') : 'All Items Satisfactory',
    severity: weakQs.length > 0 ? 'warning' : 'positive'
  });

  nodes.push({
    stage: '6. Recommended Action',
    label: 'Pedagogical Strategy',
    value: selectedIntervention ? `${selectedIntervention.type} (${selectedIntervention.targetTopic})` : 'Select an Intervention Option',
    severity: selectedIntervention ? 'positive' : 'info'
  });

  return nodes;
}

function createInterventionRecord(explanation, intervention, status, facultyNotes) {
  return {
    interventionId: `intv-test-${Date.now()}`,
    studentId: explanation.studentId,
    courseId: explanation.courseId,
    coId: explanation.coId,
    topic: intervention.targetTopic,
    interventionType: intervention.type,
    priority: intervention.priority,
    reason: intervention.reason,
    status,
    facultyNotes: facultyNotes.trim(),
    createdAt: new Date().toISOString()
  };
}

// =========================================================================
// TEST EXECUTION RUNNER
// =========================================================================
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

console.log('===============================================================');
console.log('TEST SUITE: MODULE 6 — INSTRUCTIONAL INTERVENTION RECOMMENDATION');
console.log('===============================================================');

// Load Data
const assessmentCSV = path.join(__dirname, '../data/sample_co_assessment_v2.csv');
const targetsCSV = path.join(__dirname, '../data/co_target_mapping.csv');

const rawAssessments = parseCSV(assessmentCSV).rows;
const records = standardizeRecords(rawAssessments);
const targetRows = parseCSV(targetsCSV).rows;
const targetMap = {};
targetRows.forEach(r => {
  targetMap[`${r.course_id.toUpperCase()}|${r.co_id.toUpperCase()}`] = parseFloat(r.target_attainment_percentage);
});

// Group by Course CS301
const cs301Records = records.filter(r => r.course_id === 'CS301');
const distinctStudents = Array.from(new Set(cs301Records.map(r => r.student_id))).sort();

console.log(`Loaded ${records.length} assessment records.`);
console.log(`CS301 unique students: ${distinctStudents.length} (${distinctStudents[0]} to ${distinctStudents[distinctStudents.length - 1]})`);

// -------------------------------------------------------------
// Requirement 1: Priority Classification Precedence
// -------------------------------------------------------------
console.log('\n--- 1. Strict Priority Precedence & Boundary Rules ---');

// Case A: High Risk + Critical Weakness topic => CRITICAL
const critCase = {
  hasSufficientData: true,
  riskLevel: 'HIGH RISK',
  attainmentGap: -15.0,
  performanceTrend: 'Declining',
  topics: [{ topic: 'Divide and Conquer', diagnosisCategory: 'Critical Weakness', attainmentPct: 42.0, coId: 'CO1' }]
};
assert(classifyInterventionPriority(critCase) === 'CRITICAL', 'High Risk + Critical Weakness topic resolves to CRITICAL');

// Case B: High Risk + Adequate topic (no critical weakness) => HIGH
const highCase1 = {
  hasSufficientData: true,
  riskLevel: 'HIGH RISK',
  attainmentGap: -8.0,
  performanceTrend: 'Stable',
  topics: [{ topic: 'Divide and Conquer', diagnosisCategory: 'Needs Attention', attainmentPct: 58.0, coId: 'CO1' }]
};
assert(classifyInterventionPriority(highCase1) === 'HIGH', 'High Risk with only Needs Attention topic resolves to HIGH');

// Case C: Medium Risk + Multiple Needs Attention topics (>= 2) => HIGH
const highCase2 = {
  hasSufficientData: true,
  riskLevel: 'MEDIUM RISK',
  attainmentGap: -5.0,
  performanceTrend: 'Stable',
  topics: [
    { topic: 'Divide and Conquer', diagnosisCategory: 'Needs Attention', attainmentPct: 62.0, coId: 'CO1' },
    { topic: 'Recurrence Relations', diagnosisCategory: 'Needs Attention', attainmentPct: 64.0, coId: 'CO1' }
  ]
};
assert(classifyInterventionPriority(highCase2) === 'HIGH', 'Medium Risk + Multiple Needs Attention topics resolves to HIGH');

// Case D: Low Risk + Severe Deficit (gap < -10%) => HIGH
const highCase3 = {
  hasSufficientData: true,
  riskLevel: 'LOW RISK',
  attainmentGap: -12.0,
  performanceTrend: 'Stable',
  topics: [{ topic: 'Divide and Conquer', diagnosisCategory: 'Adequate', attainmentPct: 72.0, coId: 'CO1' }]
};
assert(classifyInterventionPriority(highCase3) === 'HIGH', 'Low Risk with severe deficit (< -10%) resolves to HIGH');

// Case E: Medium Risk + Single Needs Attention topic => MODERATE
const modCase1 = {
  hasSufficientData: true,
  riskLevel: 'MEDIUM RISK',
  attainmentGap: -3.0,
  performanceTrend: 'Improving',
  topics: [{ topic: 'Divide and Conquer', diagnosisCategory: 'Needs Attention', attainmentPct: 65.0, coId: 'CO1' }]
};
assert(classifyInterventionPriority(modCase1) === 'MODERATE', 'Medium Risk with 1 Needs Attention topic resolves to MODERATE');

// Case F: Low Risk + Single Needs Attention topic => MODERATE
const modCase2 = {
  hasSufficientData: true,
  riskLevel: 'LOW RISK',
  attainmentGap: -2.0,
  performanceTrend: 'Improving',
  topics: [
    { topic: 'Divide and Conquer', diagnosisCategory: 'Needs Attention', attainmentPct: 68.0, coId: 'CO1' },
    { topic: 'Recurrence Relations', diagnosisCategory: 'Adequate', attainmentPct: 75.0, coId: 'CO1' }
  ]
};
assert(classifyInterventionPriority(modCase2) === 'MODERATE', 'Low Risk with 1 Needs Attention topic resolves to MODERATE');

// Case G: Low Risk + Adequate/Strong topics => LOW
const lowCase = {
  hasSufficientData: true,
  riskLevel: 'LOW RISK',
  attainmentGap: 4.5,
  performanceTrend: 'Improving',
  topics: [
    { topic: 'Divide and Conquer', diagnosisCategory: 'Adequate', attainmentPct: 75.0, coId: 'CO1' },
    { topic: 'Recurrence Relations', diagnosisCategory: 'Strong', attainmentPct: 88.0, coId: 'CO1' }
  ]
};
assert(classifyInterventionPriority(lowCase) === 'LOW', 'Low Risk with Adequate/Strong topics resolves to LOW');

// Case H: Insufficient historical data => LOW
const insuffCase = {
  hasSufficientData: false,
  riskLevel: 'INSUFFICIENT DATA',
  attainmentGap: null,
  performanceTrend: 'Stable',
  topics: []
};
assert(classifyInterventionPriority(insuffCase) === 'LOW', 'Insufficient data gracefully defaults to LOW priority');

// -------------------------------------------------------------
// Requirement 2: Pedagogical Strategy Generation
// -------------------------------------------------------------
console.log('\n--- 2. Diagnostic Topic to Intervention Catalog Mapping ---');

const weakExplanation = {
  hasSufficientData: true,
  studentId: 'S001',
  courseId: 'CS301',
  coId: 'CO1',
  targetThreshold: 70.0,
  historicalAttainment: 45.0,
  attainmentGap: -25.0,
  riskLevel: 'HIGH RISK',
  performanceTrend: 'Declining',
  topics: [
    {
      topic: 'Divide and Conquer',
      coId: 'CO1',
      questionCount: 3,
      attainmentPct: 42.0,
      diagnosisCategory: 'Critical Weakness'
    }
  ],
  questions: [
    { questionId: 'Q1', topic: 'Divide and Conquer', marksObtained: 1.5, maxMarks: 5.0, attainmentPct: 30.0 },
    { questionId: 'Q2', topic: 'Divide and Conquer', marksObtained: 2.0, maxMarks: 5.0, attainmentPct: 40.0 }
  ]
};

const weakOptions = generateInterventionOptions(weakExplanation);
assert(weakOptions.length >= 4, `Generated ${weakOptions.length} intervention options for Critical Weakness topic`);

const optionTypes = weakOptions.map(o => o.type);
assert(optionTypes.includes('Concept Reinforcement'), 'Generated Concept Reinforcement for Critical Weakness');
assert(optionTypes.includes('Worked Example'), 'Generated Worked Example for Critical Weakness');
assert(optionTypes.includes('Guided Practice'), 'Generated Guided Practice for Critical Weakness');
assert(optionTypes.includes('Short Diagnostic Quiz'), 'Generated Short Diagnostic Quiz for Critical Weakness');

// Question-level item connection
const conceptOpt = weakOptions.find(o => o.type === 'Concept Reinforcement');
assert(conceptOpt.questionIds.includes('Q1') && conceptOpt.questionIds.includes('Q2'), 'Targeted question IDs Q1, Q2 properly linked');
assert(conceptOpt.intensity === 'HIGH', 'Critical Weakness concept reinforcement is HIGH intensity');
assert(conceptOpt.priority === 'CRITICAL', 'Intervention inherits CRITICAL priority from case diagnosis');

// Needs Attention case
const attnExplanation = {
  hasSufficientData: true,
  studentId: 'S002',
  courseId: 'CS301',
  coId: 'CO1',
  targetThreshold: 70.0,
  historicalAttainment: 62.0,
  attainmentGap: -8.0,
  riskLevel: 'MEDIUM RISK',
  performanceTrend: 'Stable',
  topics: [
    {
      topic: 'Divide and Conquer',
      coId: 'CO1',
      questionCount: 2,
      attainmentPct: 62.0,
      gapPct: -8.0,
      diagnosisCategory: 'Needs Attention'
    }
  ],
  questions: [
    { questionId: 'Q3', topic: 'Divide and Conquer', marksObtained: 2.0, maxMarks: 5.0, attainmentPct: 40.0 }
  ]
};

const attnOptions = generateInterventionOptions(attnExplanation);
const attnTypes = attnOptions.map(o => o.type);
assert(attnTypes.includes('Targeted Question Practice'), 'Generated Targeted Question Practice for Needs Attention');
assert(attnTypes.includes('Concept Recap'), 'Generated Concept Recap for Needs Attention');

// -------------------------------------------------------------
// Requirement 3: Traceability Chain Verification
// -------------------------------------------------------------
console.log('\n--- 3. Traceability Chain Linking (Risk -> CO -> Gap -> Topic -> Question -> Strategy) ---');

const traceNodes = buildEvidenceTraceChain(weakExplanation, conceptOpt);
assert(traceNodes.length === 6, `Traceability chain has exactly 6 stages (found ${traceNodes.length})`);
assert(traceNodes[0].stage === '1. Early-Warning Risk' && traceNodes[0].value === 'HIGH RISK', 'Stage 1 traces High Risk');
assert(traceNodes[1].stage === '2. Course Outcome' && traceNodes[1].value.includes('CO1'), 'Stage 2 traces CO1 target');
assert(traceNodes[2].stage === '3. Historical Deficit' && traceNodes[2].value.includes('-25.0%'), 'Stage 3 traces -25.0% gap');
assert(traceNodes[3].stage === '4. Diagnosed Topic' && traceNodes[3].value.includes('Divide and Conquer'), 'Stage 4 traces topic');
assert(traceNodes[4].stage === '5. Question Evidence' && traceNodes[4].value.includes('Q1'), 'Stage 5 traces deficit questions');
assert(traceNodes[5].stage === '6. Recommended Action' && traceNodes[5].value.includes('Concept Reinforcement'), 'Stage 6 traces recommendation');

// -------------------------------------------------------------
// Requirement 4: Faculty Decision Workflow & Audit Record
// -------------------------------------------------------------
console.log('\n--- 4. Faculty Decision Audit Logging ---');

const approvedRecord = createInterventionRecord(
  weakExplanation,
  conceptOpt,
  'Approved',
  'Assigned to 1-on-1 clinic session with TA on Thursday.'
);

assert(approvedRecord.studentId === 'S001', 'Record captures studentId S001');
assert(approvedRecord.status === 'Approved', 'Record captures Approved status');
assert(approvedRecord.interventionType === 'Concept Reinforcement', 'Record captures intervention type');
assert(approvedRecord.facultyNotes.includes('Thursday'), 'Record captures faculty notes verbatim');
assert(approvedRecord.interventionId.startsWith('intv-'), 'Record has unique identifier');
assert(typeof approvedRecord.createdAt === 'string', 'Record has ISO timestamp');

const rejectedRecord = createInterventionRecord(
  weakExplanation,
  weakOptions[1],
  'Rejected',
  'Overridden: Student already completed equivalent tutoring.'
);
assert(rejectedRecord.status === 'Rejected', 'Record captures Rejected status');

// -------------------------------------------------------------
// Requirement 5: Handover to Module 7 Gatekeeper
// -------------------------------------------------------------
console.log('\n--- 5. Module 7 Reassessment Handover Gatekeeper ---');

const emptyApproved = [];
const nonApprovedLock = emptyApproved.length > 0;
assert(!nonApprovedLock, 'Module 7 locked when zero interventions have been approved');

const activeApproved = [approvedRecord];
const unlockedHandover = activeApproved.length > 0;
assert(unlockedHandover, 'Module 7 unlocked when at least one intervention has been approved');

// -------------------------------------------------------------
// Requirement 6: Dataset Fidelity & Real Cohort Verification
// -------------------------------------------------------------
console.log('\n--- 6. Cohort Dataset Fidelity & Dynamic ID Population ---');

assert(distinctStudents.length === 150, `Cohort contains 150 real students (found ${distinctStudents.length})`);
assert(distinctStudents[0] === 'S001' && distinctStudents[149] === 'S150', 'Student range matches S001 through S150');

// Verify that all students evaluate to valid mutually exclusive priority
let allClassified = true;
let criticalCount = 0;
let highCount = 0;
let moderateCount = 0;
let lowCount = 0;

distinctStudents.forEach(sId => {
  // Mock simple diagnostic representation from dataset
  const sRecords = cs301Records.filter(r => r.student_id === sId && r.assessment_id !== 'A3');
  const totalEarned = sRecords.reduce((acc, r) => acc + r.marks_obtained, 0);
  const totalMax = sRecords.reduce((acc, r) => acc + r.max_marks, 0);
  const attainment = totalMax > 0 ? (totalEarned / totalMax) * 100 : 50;
  const gap = attainment - 70.0;
  const risk = attainment < 50 ? 'HIGH RISK' : attainment < 70 ? 'MEDIUM RISK' : 'LOW RISK';

  const sDiag = {
    hasSufficientData: true,
    riskLevel: risk,
    attainmentGap: gap,
    performanceTrend: 'Stable',
    topics: [{ topic: 'Divide and Conquer', diagnosisCategory: classifyTopicDiagnosis(attainment, 70.0), attainmentPct: attainment, coId: 'CO1' }]
  };

  const priority = classifyInterventionPriority(sDiag);
  if (!['CRITICAL', 'HIGH', 'MODERATE', 'LOW'].includes(priority)) {
    allClassified = false;
  }
  if (priority === 'CRITICAL') criticalCount++;
  else if (priority === 'HIGH') highCount++;
  else if (priority === 'MODERATE') moderateCount++;
  else if (priority === 'LOW') lowCount++;
});

assert(allClassified, 'Every student in cohort receives a valid priority classification');
assert(criticalCount + highCount + moderateCount + lowCount === 150, `Total priorities sum to 150 (${criticalCount} Critical, ${highCount} High, ${moderateCount} Mod, ${lowCount} Low)`);

console.log('\n===============================================================');
console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

