import {
  StudentExplanationPayload,
  InterventionPriority,
  InterventionRecommendation,
  InterventionRecord,
  EvidenceTraceNode,
  InterventionStatus
} from '../types/dataTypes';

/**
 * Determines intervention priority using Module 4 risk and Module 5 diagnosis.
 * Precedence is strictly mutually exclusive and deterministic:
 * 1. CRITICAL: High Risk AND at least one Critical Weakness topic (< 50%)
 * 2. HIGH: High Risk OR multiple Needs Attention topics (>= 2) OR strongly negative CO gap (< -10%)
 * 3. MODERATE: Medium Risk OR one Needs Attention topic
 * 4. LOW: Low Risk AND no Critical Weakness (or default)
 */
export function classifyInterventionPriority(
  explanation: StudentExplanationPayload
): InterventionPriority {
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

/**
 * Generates tailored, evidence-connected intervention options for the student case.
 */
export function generateInterventionOptions(
  explanation: StudentExplanationPayload
): InterventionRecommendation[] {
  const overallPriority = classifyInterventionPriority(explanation);
  const trend = explanation.performanceTrend;

  // Guard for insufficient historical data
  if (!explanation.hasSufficientData || explanation.topics.length === 0) {
    return [
      {
        id: `opt-review-${Date.now()}-1`,
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

  const recommendations: InterventionRecommendation[] = [];
  const targetThreshold = explanation.targetThreshold;
  const targetStr = targetThreshold !== null ? `${targetThreshold}%` : 'Target reference unavailable';

  // Process topics in order of diagnostic urgency (weakest first)
  explanation.topics.forEach((topic, idx) => {
    // Collect weak question IDs associated with this topic
    const topicWeakQs = explanation.questions
      .filter(q => q.topic.toUpperCase() === topic.topic.toUpperCase() && q.attainmentPct < 50.0)
      .map(q => q.questionId);

    const qText = topicWeakQs.length > 0 ? ` (Questions: ${topicWeakQs.join(', ')})` : '';

    if (topic.diagnosisCategory === 'Critical Weakness') {
      // 1. Concept Reinforcement
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

      // 2. Worked Example
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

      // 3. Guided Practice
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

      // 4. Follow-up Diagnostic Assessment
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
      // 1. Targeted Question Practice
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

      // 2. Concept Recap
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

      // 3. Short Diagnostic Quiz
      recommendations.push({
        id: `opt-${idx}-3`,
        type: 'Short Diagnostic Quiz',
        targetTopic: topic.topic,
        targetCO: topic.coId,
        evidenceText: `Formative checkpoint for ${topic.topic}.`,
        reason: `Measure whether concept recap successfully raised attainment above the target threshold.`,
        intensity: 'LOW',
        timing: 'During next remediation session',
        academicFocus: `Quick 5-minute concept diagnostic on ${topic.topic}.`,
        priority: 'LOW',
        status: 'Suggested',
        questionIds: topicWeakQs
      });
    } else if (topic.diagnosisCategory === 'Adequate') {
      // For Adequate topics, offer targeted reinforcement if overall CO is below target or trend is declining
      if ((explanation.attainmentGap !== null && explanation.attainmentGap < 0) || trend === 'Declining') {
        recommendations.push({
          id: `opt-${idx}-1`,
          type: 'Additional Practice Set',
          targetTopic: topic.topic,
          targetCO: topic.coId,
          evidenceText: `Attainment is ${topic.attainmentPct.toFixed(1)}% (Adequate), but cohort trajectory is ${trend.toLowerCase()}.`,
          reason: `Stabilize attainment in ${topic.topic} to prevent regression below institutional benchmark.`,
          intensity: 'LOW',
          timing: 'Within next instructional cycle',
          academicFocus: `Reinforcement question set sustaining procedural proficiency in ${topic.topic}.`,
          priority: 'LOW',
          status: 'Suggested',
          questionIds: topicWeakQs
        });
      }
    } else if (topic.diagnosisCategory === 'Strong') {
      // Strong: optional peer learning / enrichment only
      if (idx === 0 && explanation.topics.length === 1) {
        recommendations.push({
          id: `opt-${idx}-1`,
          type: 'Peer Learning',
          targetTopic: topic.topic,
          targetCO: topic.coId,
          evidenceText: `High attainment (${topic.attainmentPct.toFixed(1)}% ≥ 80.0% Strong).`,
          reason: `Student demonstrates strong concept mastery. No mandatory remediation is required.`,
          intensity: 'LOW',
          timing: 'Within next instructional cycle',
          academicFocus: `Optional collaborative problem-solving or peer-learning mentor role in ${topic.topic}.`,
          priority: 'LOW',
          status: 'Suggested',
          questionIds: []
        });
      }
    }
  });

  // Ensure at least one option exists
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

/**
 * Builds a visual traceability chain linking predictive risk to final intervention.
 */
export function buildEvidenceTraceChain(
  explanation: StudentExplanationPayload,
  selectedIntervention?: InterventionRecommendation | null
): EvidenceTraceNode[] {
  const nodes: EvidenceTraceNode[] = [];

  // Stage 1: Risk Level
  nodes.push({
    stage: '1. Early-Warning Risk',
    label: 'Risk Classification',
    value: explanation.riskLevel,
    severity: explanation.riskLevel === 'HIGH RISK' ? 'critical' : explanation.riskLevel === 'MEDIUM RISK' ? 'warning' : 'positive'
  });

  // Stage 2: Target Course Outcome
  nodes.push({
    stage: '2. Course Outcome',
    label: 'Outcome Target',
    value: `${explanation.coId} (${explanation.targetThreshold !== null ? `${explanation.targetThreshold}% Target` : 'Target Unavailable'})`,
    severity: 'info'
  });

  // Stage 3: Attainment Gap
  const gapVal = explanation.attainmentGap !== null
    ? `${explanation.attainmentGap > 0 ? '+' : ''}${explanation.attainmentGap.toFixed(1)}% Gap`
    : 'Gap Unavailable';
  nodes.push({
    stage: '3. Historical Deficit',
    label: 'CO Attainment Gap',
    value: gapVal,
    severity: explanation.attainmentGap !== null && explanation.attainmentGap < -10 ? 'critical' : explanation.attainmentGap !== null && explanation.attainmentGap < 0 ? 'warning' : 'positive'
  });

  // Stage 4: Primary Weak Topic
  const weakestTopic = explanation.topics[0];
  nodes.push({
    stage: '4. Diagnosed Topic',
    label: 'Primary Weakness',
    value: weakestTopic ? `${weakestTopic.topic} (${weakestTopic.attainmentPct.toFixed(1)}%)` : 'None Identified',
    severity: weakestTopic?.diagnosisCategory === 'Critical Weakness' ? 'critical' : weakestTopic?.diagnosisCategory === 'Needs Attention' ? 'warning' : 'positive'
  });

  // Stage 5: Weakest Questions
  const weakQs = explanation.questions.filter(q => q.attainmentPct < 50.0).slice(0, 3);
  nodes.push({
    stage: '5. Question Evidence',
    label: 'Deficit Items',
    value: weakQs.length > 0 ? weakQs.map(q => `${q.questionId} (${q.attainmentPct.toFixed(0)}%)`).join(', ') : 'All Items Satisfactory',
    severity: weakQs.length > 0 ? 'warning' : 'positive'
  });

  // Stage 6: Recommended Intervention
  nodes.push({
    stage: '6. Recommended Action',
    label: 'Pedagogical Strategy',
    value: selectedIntervention ? `${selectedIntervention.type} (${selectedIntervention.targetTopic})` : 'Select an Intervention Option',
    severity: selectedIntervention ? 'positive' : 'info'
  });

  return nodes;
}

/**
 * Creates an auditable intervention log record for faculty record-keeping.
 */
export function createInterventionRecord(
  explanation: StudentExplanationPayload,
  intervention: InterventionRecommendation,
  status: InterventionStatus,
  facultyNotes: string
): InterventionRecord {
  return {
    interventionId: `intv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
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
