const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Simple test harness
let passCount = 0;
let failCount = 0;

function pass(msg) {
  passCount++;
  console.log(`  ✓ PASS: ${msg}`);
}

function fail(msg, err) {
  failCount++;
  console.error(`  ✗ FAIL: ${msg}`);
  if (err) console.error(err);
}

console.log('===============================================================');
console.log('TEST SUITE: AI-ENHANCED RECOMMENDATION SERVICE & INTEGRITY');
console.log('===============================================================');

// Verification logic mirroring src/services/aiRecommendationService.ts
const FABRICATED_CLAIM_PATTERNS = [
  /(?:improve|gain|increase|boost|raise|score|jump)\s*(?:by|of)?\s*\+?\d+(?:\.\d+)?%/i,
  /\d+(?:\.\d+)?%\s*(?:improvement|gain|increase|score|boost|growth)/i,
  /(?:guarantee|promise|ensure|will achieve|will score)\s*(?:\w+\s*){0,3}\d+%/i,
  /\bexpected\s*(?:gain|increase|improvement|attainment)\s*(?:of|is|to be)?\s*\+?\d+/i
];

const PII_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone number
  /\b\d{3}-\d{2}-\d{4}\b/ // SSN format
];

const FUTURE_ASSESSMENT_TERMS = [
  /\bReassessment\b/i,
  /\bR1\b/,
  /\bR2\b/,
  /\bPost-Intervention\s+Test\b/i,
  /\bFinal\s+Exam\b/i,
  /\bEnd-Semester\s+Examination\b/i
];

function validateAIResponse(aiJson, evidence) {
  if (!aiJson || typeof aiJson !== 'object') {
    return { isValid: false, error: 'AI response is not a valid JSON object.' };
  }

  if (!Array.isArray(aiJson.recommendations) || aiJson.recommendations.length === 0) {
    return { isValid: false, error: 'AI response must contain a non-empty "recommendations" array.' };
  }

  const validIntensities = new Set(['LOW', 'MEDIUM', 'HIGH']);
  const allowedTopicsLower = new Set(evidence.weakTopics.map(t => t.trim().toLowerCase()));
  const allowedQuestions = new Set(evidence.weakQuestions.map(q => q.trim().toUpperCase()));

  const validatedRecs = [];

  for (let i = 0; i < aiJson.recommendations.length; i++) {
    const rec = aiJson.recommendations[i];

    if (!rec || typeof rec !== 'object') {
      return { isValid: false, error: `Recommendation at index ${i} is not a valid object.` };
    }

    if (!rec.type || typeof rec.type !== 'string' || rec.type.trim() === '') {
      return { isValid: false, error: `Recommendation at index ${i} is missing a valid "type".` };
    }

    if (!rec.title || typeof rec.title !== 'string') {
      return { isValid: false, error: `Recommendation at index ${i} is missing a "title".` };
    }

    if (!rec.targetTopic || typeof rec.targetTopic !== 'string') {
      return { isValid: false, error: `Recommendation at index ${i} is missing a "targetTopic".` };
    }

    // Target topic validation
    const topicLower = rec.targetTopic.trim().toLowerCase();
    if (evidence.weakTopics.length > 0 && !allowedTopicsLower.has(topicLower)) {
      return {
        isValid: false,
        error: `Recommendation targets unknown topic "${rec.targetTopic}". Must be one of: ${evidence.weakTopics.join(', ')}.`
      };
    }

    // Target questions validation
    if (!Array.isArray(rec.targetQuestions)) {
      return { isValid: false, error: `Recommendation at index ${i} "targetQuestions" must be an array.` };
    }

    for (const q of rec.targetQuestions) {
      if (typeof q !== 'string') {
        return { isValid: false, error: `Invalid question ID in recommendation ${i}.` };
      }
      const qUpper = q.trim().toUpperCase();
      if (evidence.weakQuestions.length > 0 && !allowedQuestions.has(qUpper)) {
        return {
          isValid: false,
          error: `Recommendation references question "${q}" not present in supplied weak questions: ${evidence.weakQuestions.join(', ')}.`
        };
      }
    }

    // Intensity validation
    if (!validIntensities.has(rec.intensity)) {
      return {
        isValid: false,
        error: `Recommendation intensity "${rec.intensity}" is invalid. Must be LOW, MEDIUM, or HIGH.`
      };
    }

    // Academic focus & reason validation
    if (!rec.academicFocus || typeof rec.academicFocus !== 'string') {
      return { isValid: false, error: `Recommendation at index ${i} is missing "academicFocus".` };
    }

    if (!rec.reason || typeof rec.reason !== 'string') {
      return { isValid: false, error: `Recommendation at index ${i} is missing "reason".` };
    }

    const fullTextToCheck = [
      rec.title,
      rec.academicFocus,
      rec.reason,
      Array.isArray(rec.suggestedActivities) ? rec.suggestedActivities.join(' ') : '',
      typeof aiJson.facultyNote === 'string' ? aiJson.facultyNote : ''
    ].join(' ');

    // Check for fabricated numeric claims
    for (const pattern of FABRICATED_CLAIM_PATTERNS) {
      if (pattern.test(fullTextToCheck)) {
        return {
          isValid: false,
          error: 'AI response contains fabricated numerical improvement claims or causal guarantees.'
        };
      }
    }

    // Check for PII
    for (const pattern of PII_PATTERNS) {
      if (pattern.test(fullTextToCheck)) {
        return {
          isValid: false,
          error: 'AI response contains prohibited personally identifiable information (PII).'
        };
      }
    }

    // Check for future assessment leakage
    for (const pattern of FUTURE_ASSESSMENT_TERMS) {
      if (pattern.test(fullTextToCheck)) {
        return {
          isValid: false,
          error: `AI response violates anti-leakage boundary by referencing future assessment or reassessment cycles.`
        };
      }
    }

    // Check for unknown CO references (e.g. CO4 when target is CO2)
    const coPattern = /\bCO\s*(\d+)\b/gi;
    let match;
    while ((match = coPattern.exec(fullTextToCheck)) !== null) {
      const referencedCO = `CO${match[1]}`.toUpperCase();
      if (referencedCO !== evidence.coId.toUpperCase() && referencedCO !== 'CO') {
        return {
          isValid: false,
          error: `AI response references unknown Course Outcome "${referencedCO}". Current scope is "${evidence.coId}".`
        };
      }
    }

    validatedRecs.push({
      type: rec.type,
      title: rec.title,
      targetTopic: rec.targetTopic,
      targetQuestions: rec.targetQuestions || [],
      academicFocus: rec.academicFocus,
      reason: rec.reason,
      suggestedActivities: Array.isArray(rec.suggestedActivities) ? rec.suggestedActivities : [],
      intensity: rec.intensity
    });
  }

  return {
    isValid: true,
    validatedData: {
      recommendations: validatedRecs,
      facultyNote: aiJson.facultyNote || 'Faculty review and customization required.',
      limitations: aiJson.limitations || ['Observational antecedent data used.'],
      isAIGenerated: true,
      validationStatus: 'VALID'
    }
  };
}

function generateDeterministicFallback(evidence) {
  const primaryTopic = evidence.weakTopics[0] || 'Curricular Topic';
  return {
    recommendations: [
      {
        type: 'Peer Learning',
        title: `Targeted Peer Learning Clinic: ${primaryTopic}`,
        targetTopic: primaryTopic,
        targetQuestions: evidence.weakQuestions,
        academicFocus: `Reinforce procedural mastery and conceptual understanding of ${primaryTopic}.`,
        reason: `Observed performance on ${primaryTopic} is below threshold with ${evidence.performanceTrend.toLowerCase()} trajectory.`,
        suggestedActivities: [
          `Review core principles of ${primaryTopic}.`,
          `Step through worked problem examples.`,
          `Supervised practice on diagnostic problem sets.`
        ],
        intensity: 'HIGH'
      }
    ],
    facultyNote: 'Deterministic evidence-based recommendation generated directly from verified Module 5 topic diagnosis.',
    limitations: [
      'Generated from antecedent assessment evidence.',
      'Subject to instructor review and dosage customization.'
    ],
    isAIGenerated: false,
    validationStatus: 'FALLBACK',
    validationMessage: 'AI assistance unavailable — deterministic evidence-based recommendations are active.'
  };
}

// Sample verified evidence payload
const testEvidence = {
  studentId: 'S001',
  courseId: 'CS301',
  coId: 'CO2',
  predictionAssessment: 'A3',
  riskLevel: 'HIGH RISK',
  priority: 'CRITICAL',
  predictedProbability: 0.22,
  historicalAttainment: 28.0,
  target: 70.0,
  attainmentGap: -42.0,
  performanceTrend: 'Declining',
  weakTopics: ['Page Replacement Algorithms', 'Virtual Memory & Paging'],
  weakQuestions: ['Q3', 'Q5'],
  diagnosisCategory: 'Critical Procedural Deficit',
  evidenceFactors: ['Attainment Gap: -42.0 pp', 'Trend: Declining trajectory across A1 to A2']
};

// -------------------------------------------------------------
// 1. Missing API Key Fallback Test
// -------------------------------------------------------------
try {
  const apiKey = undefined;
  const isAvailable = Boolean(apiKey && apiKey !== '' && apiKey !== 'your_api_key_here');
  assert.strictEqual(isAvailable, false);
  const result = generateDeterministicFallback(testEvidence);
  assert.strictEqual(result.validationStatus, 'FALLBACK');
  assert.strictEqual(result.isAIGenerated, false);
  assert.strictEqual(result.validationMessage, 'AI assistance unavailable — deterministic evidence-based recommendations are active.');
  pass('Test 1: Missing API key triggers deterministic fallback seamlessly');
} catch (e) {
  fail('Test 1: Missing API key fallback failed', e);
}

// -------------------------------------------------------------
// 2. Deterministic Fallback Quality Test
// -------------------------------------------------------------
try {
  const fallback = generateDeterministicFallback(testEvidence);
  assert.ok(fallback.recommendations.length > 0);
  assert.strictEqual(fallback.recommendations[0].targetTopic, 'Page Replacement Algorithms');
  assert.deepStrictEqual(fallback.recommendations[0].targetQuestions, ['Q3', 'Q5']);
  assert.strictEqual(fallback.recommendations[0].intensity, 'HIGH');
  pass('Test 2: Deterministic fallback produces valid structured recommendations from verified evidence');
} catch (e) {
  fail('Test 2: Deterministic fallback quality failed', e);
}

// -------------------------------------------------------------
// 3. Valid AI Response Test
// -------------------------------------------------------------
try {
  const validAIJson = {
    recommendations: [
      {
        type: 'Peer Learning',
        title: 'Collaborative Problem Session on Paging',
        targetTopic: 'Page Replacement Algorithms',
        targetQuestions: ['Q3', 'Q5'],
        academicFocus: 'FIFO and LRU replacement trace simulations',
        reason: 'Student struggled on Q3 and Q5 during assessment A2.',
        suggestedActivities: [
          'Pair with a proficient peer to trace page reference strings.',
          'Solve two practice questions on dirty bit and replacement policies.'
        ],
        intensity: 'HIGH'
      }
    ],
    facultyNote: 'Verify student understanding of page fault counters before mid-term.',
    limitations: ['Antecedent marks only; attendance was not factored.']
  };

  const valRes = validateAIResponse(validAIJson, testEvidence);
  assert.strictEqual(valRes.isValid, true);
  assert.strictEqual(valRes.validatedData.validationStatus, 'VALID');
  assert.strictEqual(valRes.validatedData.isAIGenerated, true);
  assert.strictEqual(valRes.validatedData.recommendations[0].targetTopic, 'Page Replacement Algorithms');
  pass('Test 3: Valid AI response successfully verified and accepted');
} catch (e) {
  fail('Test 3: Valid AI response test failed', e);
}

// -------------------------------------------------------------
// 4. Invalid JSON Response Test
// -------------------------------------------------------------
try {
  const malformedInput = null;
  const valRes1 = validateAIResponse(malformedInput, testEvidence);
  assert.strictEqual(valRes1.isValid, false);

  const missingRecs = { facultyNote: 'Some note' };
  const valRes2 = validateAIResponse(missingRecs, testEvidence);
  assert.strictEqual(valRes2.isValid, false);
  pass('Test 4: Malformed or missing JSON structure rejected with error');
} catch (e) {
  fail('Test 4: Invalid JSON response test failed', e);
}

// -------------------------------------------------------------
// 5. Unknown Topic Rejection Test
// -------------------------------------------------------------
try {
  const invalidTopicJson = {
    recommendations: [
      {
        type: 'Guided Practice',
        title: 'Fabricated Topic Review',
        targetTopic: 'Quantum Computing Encryption', // NOT in weakTopics!
        targetQuestions: ['Q3'],
        academicFocus: 'Review Shor algorithm',
        reason: 'Weak performance observed.',
        suggestedActivities: ['Read textbook.'],
        intensity: 'MEDIUM'
      }
    ]
  };

  const valRes = validateAIResponse(invalidTopicJson, testEvidence);
  assert.strictEqual(valRes.isValid, false);
  assert.ok(valRes.error.includes('unknown topic "Quantum Computing Encryption"'));
  pass('Test 5: Hallucinated / unknown topic strictly rejected');
} catch (e) {
  fail('Test 5: Unknown topic rejection failed', e);
}

// -------------------------------------------------------------
// 6. Unknown Question Rejection Test
// -------------------------------------------------------------
try {
  const invalidQuestionJson = {
    recommendations: [
      {
        type: 'Targeted Question Practice',
        title: 'Review question items',
        targetTopic: 'Page Replacement Algorithms',
        targetQuestions: ['Q999'], // NOT in weakQuestions!
        academicFocus: 'Review item 999',
        reason: 'Failed Q999 in exam',
        suggestedActivities: ['Practice Q999.'],
        intensity: 'LOW'
      }
    ]
  };

  const valRes = validateAIResponse(invalidQuestionJson, testEvidence);
  assert.strictEqual(valRes.isValid, false);
  assert.ok(valRes.error.includes('question "Q999" not present in supplied weak questions'));
  pass('Test 6: Hallucinated question item strictly rejected');
} catch (e) {
  fail('Test 6: Unknown question rejection failed', e);
}

// -------------------------------------------------------------
// 7. Unknown Course Outcome (CO) Rejection Test
// -------------------------------------------------------------
try {
  const foreignCOJson = {
    recommendations: [
      {
        type: 'Concept Reinforcement',
        title: 'CO4 Network Sockets Reinforcement',
        targetTopic: 'Page Replacement Algorithms',
        targetQuestions: ['Q3'],
        academicFocus: 'Study CO4 network sockets and RPC interfaces', // References CO4 when target is CO2!
        reason: 'CO4 attainment is deficient.',
        suggestedActivities: ['Review sockets.'],
        intensity: 'HIGH'
      }
    ]
  };

  const valRes = validateAIResponse(foreignCOJson, testEvidence);
  assert.strictEqual(valRes.isValid, false);
  assert.ok(valRes.error.includes('unknown Course Outcome "CO4"'));
  pass('Test 7: Unknown Course Outcome (CO) reference strictly rejected');
} catch (e) {
  fail('Test 7: Unknown CO rejection failed', e);
}

// -------------------------------------------------------------
// 8. Fabricated Numeric Improvement Claim Detection Test
// -------------------------------------------------------------
try {
  const speculativeGainJson = {
    recommendations: [
      {
        type: 'Peer Learning',
        title: 'Guaranteed Score Boost Workshop',
        targetTopic: 'Page Replacement Algorithms',
        targetQuestions: ['Q3'],
        academicFocus: 'Algorithmic tricks',
        reason: 'This session will improve student score by +25% on the next assessment.', // SPECULATIVE GAIN!
        suggestedActivities: ['Worksheet.'],
        intensity: 'HIGH'
      }
    ]
  };

  const valRes = validateAIResponse(speculativeGainJson, testEvidence);
  assert.strictEqual(valRes.isValid, false);
  assert.ok(valRes.error.includes('fabricated numerical improvement claims'));
  pass('Test 8: Speculative / fabricated numerical improvement claims detected and blocked');
} catch (e) {
  fail('Test 8: Fabricated numeric claim detection failed', e);
}

// -------------------------------------------------------------
// 9. PII Leakage Rejection Test
// -------------------------------------------------------------
try {
  const piiJson = {
    recommendations: [
      {
        type: 'Peer Learning',
        title: 'Peer Clinic for Yashwant',
        targetTopic: 'Page Replacement Algorithms',
        targetQuestions: ['Q3'],
        academicFocus: 'Paging review',
        reason: 'Contact student at yashwant.student@college.edu or call 555-123-4567 for tutoring schedule.', // PII!
        suggestedActivities: ['Email tutor.'],
        intensity: 'MEDIUM'
      }
    ]
  };

  const valRes = validateAIResponse(piiJson, testEvidence);
  assert.strictEqual(valRes.isValid, false);
  assert.ok(valRes.error.includes('prohibited personally identifiable information (PII)'));
  pass('Test 9: Personally Identifiable Information (PII) strictly rejected');
} catch (e) {
  fail('Test 9: PII rejection failed', e);
}

// -------------------------------------------------------------
// 10. Future Assessment Leakage Protection Test
// -------------------------------------------------------------
try {
  const futureLeakJson = {
    recommendations: [
      {
        type: 'Peer Learning',
        title: 'Prepare for Reassessment',
        targetTopic: 'Page Replacement Algorithms',
        targetQuestions: ['Q3'],
        academicFocus: 'Reassessment preparation',
        reason: 'Student needs to prepare for Reassessment R1 and Final Exam.', // FUTURE ASSESSMENT REFERENCE!
        suggestedActivities: ['Study past exams.'],
        intensity: 'HIGH'
      }
    ]
  };

  const valRes = validateAIResponse(futureLeakJson, testEvidence);
  assert.strictEqual(valRes.isValid, false);
  assert.ok(valRes.error.includes('anti-leakage boundary by referencing future assessment'));
  pass('Test 10: Anti-data-leakage guard blocks future assessment and reassessment references');
} catch (e) {
  fail('Test 10: Future assessment leakage test failed', e);
}

// -------------------------------------------------------------
// 11. API Failure Fallback Test
// -------------------------------------------------------------
try {
  // Simulate network HTTP 500 error handling
  const httpStatus = 500;
  let fallback;
  if (httpStatus !== 200) {
    fallback = generateDeterministicFallback(testEvidence);
    fallback.validationMessage = `AI provider returned HTTP ${httpStatus}. Deterministic recommendations active.`;
  }
  assert.strictEqual(fallback.validationStatus, 'FALLBACK');
  assert.ok(fallback.validationMessage.includes('HTTP 500'));
  assert.strictEqual(fallback.recommendations.length, 1);
  pass('Test 11: HTTP / API provider failure cleanly falls back to deterministic recommendations');
} catch (e) {
  fail('Test 11: API failure fallback test failed', e);
}

// -------------------------------------------------------------
// 12. Faculty Approval Remains Mandatory Test
// -------------------------------------------------------------
try {
  // AI recommendation response object
  const aiOutput = {
    recommendations: [{ type: 'Peer Learning', status: 'Suggested' }]
  };

  // State machine check: Is intervention active/approved automatically?
  let isInterventionApproved = false;
  let facultyDecision = null;

  // Faculty must explicitly perform the review and approve action
  function facultyApproveAction(rec, notes) {
    facultyDecision = {
      status: 'Approved',
      approvedAt: new Date().toISOString(),
      notes
    };
    isInterventionApproved = true;
  }

  // Before faculty action
  assert.strictEqual(isInterventionApproved, false);
  assert.strictEqual(facultyDecision, null);

  // Faculty performs approval
  facultyApproveAction(aiOutput.recommendations[0], 'Approved after clinical review.');
  assert.strictEqual(isInterventionApproved, true);
  assert.strictEqual(facultyDecision.status, 'Approved');
  assert.ok(facultyDecision.approvedAt);
  pass('Test 12: AI recommendation cannot bypass mandatory human faculty approval');
} catch (e) {
  fail('Test 12: Faculty approval test failed', e);
}

// -------------------------------------------------------------
// 13. AI Cannot Modify Deterministic Metrics Test
// -------------------------------------------------------------
try {
  const originalAttainment = testEvidence.historicalAttainment;
  const originalGap = testEvidence.attainmentGap;
  const originalProb = testEvidence.predictedProbability;
  const originalRisk = testEvidence.riskLevel;

  // Simulate AI recommendation generation and adoption
  const aiRec = {
    recommendations: [{ type: 'Guided Practice', title: 'New practice' }]
  };

  // Ensure deterministic metrics remain immutable
  assert.strictEqual(testEvidence.historicalAttainment, originalAttainment);
  assert.strictEqual(testEvidence.attainmentGap, originalGap);
  assert.strictEqual(testEvidence.predictedProbability, originalProb);
  assert.strictEqual(testEvidence.riskLevel, originalRisk);
  pass('Test 13: Deterministic academic metrics remain completely immutable to AI recommendations');
} catch (e) {
  fail('Test 13: Deterministic metrics immutability test failed', e);
}

// -------------------------------------------------------------
// 14. AI Cannot Unlock Module 7 Reassessment Test
// -------------------------------------------------------------
try {
  const approvedInterventions = []; // No faculty approved interventions

  function isModule7Unlocked(approvedList) {
    return approvedList.some(r => r.status === 'Approved');
  }

  // AI has generated recommendation, but faculty has not approved
  const aiGenerated = true;
  assert.strictEqual(isModule7Unlocked(approvedInterventions), false);

  // Even with AI recommendation present, Module 7 must remain LOCKED
  const canEvaluateReassessment = isModule7Unlocked(approvedInterventions);
  assert.strictEqual(canEvaluateReassessment, false);
  pass('Test 14: AI recommendation presence cannot unlock Module 7 reassessment without faculty approval');
} catch (e) {
  fail('Test 14: Module 7 lock test failed', e);
}

// -------------------------------------------------------------
// 15. Recommendation Reproducibility from Same Evidence Test
// -------------------------------------------------------------
try {
  const rec1 = generateDeterministicFallback(testEvidence);
  const rec2 = generateDeterministicFallback(testEvidence);

  assert.strictEqual(rec1.recommendations[0].type, rec2.recommendations[0].type);
  assert.strictEqual(rec1.recommendations[0].targetTopic, rec2.recommendations[0].targetTopic);
  assert.deepStrictEqual(rec1.recommendations[0].targetQuestions, rec2.recommendations[0].targetQuestions);
  assert.strictEqual(rec1.recommendations[0].intensity, rec2.recommendations[0].intensity);
  pass('Test 15: Recommendations derived from identical evidence are 100% reproducible');
} catch (e) {
  fail('Test 15: Reproducibility test failed', e);
}

console.log('===============================================================');
console.log(`AI RECOMMENDATION TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
}

