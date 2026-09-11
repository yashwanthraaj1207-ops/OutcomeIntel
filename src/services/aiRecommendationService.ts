import {
  StudentExplanationPayload,
  AIEvidencePayload,
  AIRecommendationResponse,
  AIRecommendationItem,
  AIConnectionStatus,
  AIProviderConfig
} from '../types/dataTypes';

/**
 * Accesses environment variables safely across browser (Vite) and Node.js test environments.
 */
export function getEnvVariable(key: string): string | undefined {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const val = (import.meta as any).env[key];
      if (val !== undefined && val !== '') return val;
    }
  } catch {
    // ignore
  }

  try {
    const globalProc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
    if (globalProc && globalProc.env) {
      const val = globalProc.env[key];
      if (val !== undefined && val !== '') return val;
    }
  } catch {
    // ignore
  }

  return undefined;
}

/**
 * Resolves active AI configuration from environment with optional runtime overrides.
 */
export function resolveAIConfig(override?: AIProviderConfig): {
  apiKey: string | undefined;
  apiUrl: string;
  model: string;
} {
  const apiKey = override?.apiKey ?? getEnvVariable('VITE_AI_API_KEY');
  const apiUrl =
    override?.apiUrl ??
    getEnvVariable('VITE_AI_API_URL') ??
    'https://api.openai.com/v1/chat/completions';
  const model =
    override?.model ??
    getEnvVariable('VITE_AI_MODEL') ??
    'gpt-4o-mini';

  return { apiKey: apiKey ? apiKey.trim() : undefined, apiUrl, model };
}

/**
 * Returns the current connectivity status of the AI recommendation layer.
 */
export function getAIConnectionStatus(override?: AIProviderConfig): AIConnectionStatus {
  const { apiKey } = resolveAIConfig(override);
  if (!apiKey || apiKey === '' || apiKey === 'your_api_key_here') {
    return 'DETERMINISTIC_MODE';
  }
  return 'CONNECTED';
}

/**
 * Extracts strictly factual, anonymized evidence from Module 5/6 data structures.
 * Enforces zero PII and zero future assessment leakage.
 */
export function extractEvidencePayload(
  explanation: StudentExplanationPayload,
  priority: string | number
): AIEvidencePayload {
  // Extract weak topics (attainment < 50% or marked critical/attention)
  const weakTopics = explanation.topics
    .filter(t => t.attainmentPct < 50.0 || t.diagnosisCategory === 'Critical Weakness' || t.diagnosisCategory === 'Needs Attention')
    .map(t => t.topic);

  // Extract weak questions (attainment < 50%)
  const weakQuestions = explanation.questions
    .filter(q => q.attainmentPct < 50.0)
    .map(q => q.questionId);

  // Evidence factors summary
  const evidenceFactors = (explanation.evidenceFactors || []).map(
    f => `${f.category} (${f.severity}): ${f.description} [Observed: ${f.actualValue}, Benchmark: ${f.referenceValue}]`
  );

  return {
    studentId: explanation.studentId, // Already anonymized (e.g. S001)
    courseId: explanation.courseId,
    coId: explanation.coId,
    predictionAssessment: explanation.predictionAssessment,
    riskLevel: explanation.riskLevel,
    priority: String(priority),
    predictedProbability: explanation.predictedProbability,
    historicalAttainment: explanation.historicalAttainment,
    target: explanation.targetThreshold,
    attainmentGap: explanation.attainmentGap,
    performanceTrend: explanation.performanceTrend,
    weakTopics: weakTopics.length > 0 ? weakTopics : (explanation.topics[0]?.topic ? [explanation.topics[0].topic] : ['General Outcome Practice']),
    weakQuestions: weakQuestions,
    diagnosisCategory: explanation.diagnosisSummary?.primaryDiagnosis || 'Targeted Academic Support Required',
    evidenceFactors
  };
}

/**
 * Builds the strict system prompt that constrains the AI model to verified evidence.
 */
export function buildAISystemPrompt(): string {
  return `You are an academic instructional recommendation assistant.

You must generate instructional recommendations ONLY from the factual evidence supplied by the application.

You must never invent marks, percentages, topics, questions, targets, predictions, student information, or outcomes.

You must never claim that an intervention will cause a specific improvement.

You must never generate fabricated expected improvement percentages.

You must not change or reinterpret the supplied numerical values.

You must not diagnose beyond the evidence.

Your role is to recommend pedagogically appropriate instructional actions based on the supplied weak topics, weak questions, CO attainment, risk level, trend, and evidence factors.

All recommendations must remain subject to faculty review and approval.

Return valid JSON only matching this exact schema:
{
  "recommendations": [
    {
      "type": "Concept Reinforcement | Guided Practice | Targeted Question Practice | Worked Example | Peer Learning | Short Diagnostic Quiz | Concept Recap",
      "title": "string concise pedagogical title",
      "targetTopic": "string (MUST be selected from supplied weakTopics)",
      "targetQuestions": ["string question ID (MUST be selected from supplied weakQuestions, or empty)"],
      "academicFocus": "string specific curriculum focus",
      "reason": "string factual rationale referencing observed evidence",
      "suggestedActivities": ["string step 1", "string step 2", "string step 3"],
      "intensity": "LOW | MEDIUM | HIGH"
    }
  ],
  "facultyNote": "string recommendation for instructor review",
  "limitations": ["string pedagogical scope limitation"]
}`;
}

/**
 * Formats the user prompt containing structured evidence JSON.
 */
export function buildAIUserPrompt(evidence: AIEvidencePayload): string {
  return `Generate instructional recommendations for the following verified student evidence:

${JSON.stringify(evidence, null, 2)}

Ensure every targetTopic matches one of: ${JSON.stringify(evidence.weakTopics)}.
Ensure every targetQuestion matches one of: ${JSON.stringify(evidence.weakQuestions)}.
Do not include any predicted percentage increases or causal guarantees.`;
}

/**
 * Patterns that indicate fabricated numeric claims or causal over-promises.
 */
const FABRICATED_CLAIM_PATTERNS = [
  /(?:improve|gain|increase|boost|raise|score|jump)\s*(?:by|of)?\s*\+?\d+(?:\.\d+)?%/i,
  /\d+(?:\.\d+)?%\s*(?:improvement|gain|increase|score|boost|growth)/i,
  /(?:guarantee|promise|ensure|will achieve|will score)\s*(?:\w+\s*){0,3}\d+%/i,
  /\bexpected\s*(?:gain|increase|improvement|attainment)\s*(?:of|is|to be)?\s*\+?\d+/i
];

/**
 * Patterns that indicate PII leakage.
 */
const PII_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone number
  /\b\d{3}-\d{2}-\d{4}\b/ // SSN format
];

/**
 * Future assessment terms that must not leak into pre-intervention recommendations.
 */
const FUTURE_ASSESSMENT_TERMS = [
  /\bReassessment\b/i,
  /\bR1\b/,
  /\bR2\b/,
  /\bPost-Intervention\s+Test\b/i,
  /\bFinal\s+Exam\b/i,
  /\bEnd-Semester\s+Examination\b/i
];

/**
 * Validates raw AI JSON output against strict academic integrity criteria.
 */
export function validateAIResponse(
  aiJson: any,
  evidence: AIEvidencePayload
): { isValid: boolean; error?: string; validatedData?: AIRecommendationResponse } {
  if (!aiJson || typeof aiJson !== 'object') {
    return { isValid: false, error: 'AI response is not a valid JSON object.' };
  }

  if (!Array.isArray(aiJson.recommendations) || aiJson.recommendations.length === 0) {
    return { isValid: false, error: 'AI response must contain a non-empty "recommendations" array.' };
  }

  const validIntensities = new Set(['LOW', 'MEDIUM', 'HIGH']);
  const allowedTopicsLower = new Set(evidence.weakTopics.map(t => t.trim().toLowerCase()));
  const allowedQuestions = new Set(evidence.weakQuestions.map(q => q.trim().toUpperCase()));

  const validatedRecs: AIRecommendationItem[] = [];

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

    // Check for fabricated numeric improvement claims
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

  const facultyNote = typeof aiJson.facultyNote === 'string' ? aiJson.facultyNote : 'Faculty review and customization required.';
  const limitations = Array.isArray(aiJson.limitations)
    ? aiJson.limitations
    : ['Recommendation is formulated solely from observed antecedent marks and requires pedagogical review.'];

  return {
    isValid: true,
    validatedData: {
      recommendations: validatedRecs,
      facultyNote,
      limitations,
      isAIGenerated: true,
      validationStatus: 'VALID',
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * Generates a high-quality deterministic recommendation matching the AI schema
 * from the exact supplied evidence without any external network call.
 */
export function generateDeterministicFallbackRecommendation(
  evidence: AIEvidencePayload
): AIRecommendationResponse {
  const primaryTopic = evidence.weakTopics[0] || 'Curricular Topic';
  const isHighRisk = evidence.riskLevel === 'HIGH RISK' || evidence.priority === 'CRITICAL';
  const intensity: 'LOW' | 'MEDIUM' | 'HIGH' = isHighRisk ? 'HIGH' : evidence.riskLevel === 'MEDIUM RISK' ? 'MEDIUM' : 'LOW';

  const recType = isHighRisk ? 'Peer Learning' : 'Guided Practice';
  const title = isHighRisk
    ? `Targeted Peer Learning Clinic: ${primaryTopic}`
    : `Scaffolded Practice Session: ${primaryTopic}`;

  const qText = evidence.weakQuestions.length > 0
    ? `Targeting observed deficit patterns from ${evidence.weakQuestions.join(', ')}.`
    : 'Comprehensive topic review.';

  const activities = [
    `Review core principles of ${primaryTopic} with emphasis on foundational definitions.`,
    `Step through 2 worked problem examples isomorphic to assessment items.`,
    `Supervised practice on diagnostic problem sets with immediate instructor feedback.`
  ];

  const reason = `Observed performance on ${primaryTopic} is below threshold with ${evidence.performanceTrend.toLowerCase()} trajectory. ${qText}`;
  const academicFocus = `Reinforce procedural mastery and conceptual understanding of ${primaryTopic} prior to subsequent assessment cycles.`;

  return {
    recommendations: [
      {
        type: recType,
        title,
        targetTopic: primaryTopic,
        targetQuestions: evidence.weakQuestions,
        academicFocus,
        reason,
        suggestedActivities: activities,
        intensity
      }
    ],
    facultyNote: 'Deterministic evidence-based recommendation generated directly from verified Module 5 topic diagnosis.',
    limitations: [
      'Generated from antecedent assessment evidence.',
      'Subject to instructor review and dosage customization.',
      'Reassessment outcomes will be empirically evaluated in Module 7.'
    ],
    isAIGenerated: false,
    validationStatus: 'FALLBACK',
    validationMessage: 'AI assistance unavailable — deterministic evidence-based recommendations are active.',
    generatedAt: new Date().toISOString()
  };
}

/**
 * Main AI recommendation generation function.
 * Connects to configured OpenAI-compatible endpoint, validates response,
 * and seamlessly falls back to deterministic recommendations on any error.
 */
export async function generateAIInterventionRecommendations(
  evidence: AIEvidencePayload,
  overrideConfig?: AIProviderConfig
): Promise<AIRecommendationResponse> {
  const config = resolveAIConfig(overrideConfig);

  // Fallback if no API key is provided
  if (!config.apiKey || config.apiKey === 'your_api_key_here') {
    return generateDeterministicFallbackRecommendation(evidence);
  }

  const systemPrompt = buildAISystemPrompt();
  const userPrompt = buildAIUserPrompt(evidence);

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 12000) : null;

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      }),
      signal: controller ? controller.signal : undefined
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[AI Service] API responded with status ${response.status}. Falling back to deterministic mode.`);
      const fallback = generateDeterministicFallbackRecommendation(evidence);
      fallback.validationMessage = `AI provider returned HTTP ${response.status}. Deterministic recommendations active.`;
      return fallback;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent || typeof rawContent !== 'string') {
      const fallback = generateDeterministicFallbackRecommendation(evidence);
      fallback.validationMessage = 'AI provider returned empty response. Deterministic recommendations active.';
      return fallback;
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch {
      const fallback = generateDeterministicFallbackRecommendation(evidence);
      fallback.validationStatus = 'INVALID';
      fallback.validationMessage = 'AI recommendation could not be validated. Deterministic recommendations remain available.';
      return fallback;
    }

    const validationResult = validateAIResponse(parsedJson, evidence);

    if (!validationResult.isValid || !validationResult.validatedData) {
      console.warn(`[AI Service Validation Error]: ${validationResult.error}`);
      const fallback = generateDeterministicFallbackRecommendation(evidence);
      fallback.validationStatus = 'INVALID';
      fallback.validationMessage = 'AI recommendation could not be validated. Deterministic recommendations remain available.';
      return fallback;
    }

    validationResult.validatedData.modelUsed = config.model;
    return validationResult.validatedData;
  } catch (err: any) {
    console.warn('[AI Service] Network error or request failed:', err?.message || err);
    const fallback = generateDeterministicFallbackRecommendation(evidence);
    fallback.validationMessage = 'AI assistance unavailable — deterministic evidence-based recommendations are active.';
    return fallback;
  }
}
