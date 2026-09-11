import {
  GeminiEvidencePayload,
  GeminiRecommendationData,
  InterventionType
} from '../types/dataTypes';

export const ALLOWED_INTERVENTION_TYPES: readonly InterventionType[] = [
  'Concept Reinforcement',
  'Guided Practice',
  'Targeted Question Practice',
  'Worked Example',
  'Small-Group Remediation',
  'Peer Learning',
  'Short Diagnostic Quiz',
  'Concept Recap',
  'Additional Practice Set',
  'Follow-up Assessment'
];

export const FABRICATED_CLAIM_PATTERNS = [
  /(?:improve|gain|increase|boost|raise|jump)\s*(?:by|of)?\s*\+?\d+(?:\.\d+)?%/i,
  /\d+(?:\.\d+)?%\s*(?:improvement|gain|increase|boost|growth)/i,
  /(?:guarantee|promise|ensure|will achieve|will score)\s*(?:\w+\s*){0,3}\d+%/i,
  /\bexpected\s*(?:gain|increase|improvement|attainment)\s*(?:of|is|to be)?\s*\+?\d+/i,
  /(?:will\s+achieve|will\s+reach)\s*\d+%/i
];

export const PII_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  /\b\d{3}-\d{2}-\d{4}\b/
];

export const FUTURE_ASSESSMENT_TERMS = [
  /\bReassessment\b/i,
  /\bR1\b/,
  /\bR2\b/,
  /\bPost-Intervention\s+Test\b/i,
  /\bFinal\s+Exam\b/i,
  /\bEnd-Semester\s+Examination\b/i
];

export function buildGeminiPrompt(evidence: GeminiEvidencePayload): { systemPrompt: string; userPrompt: string } {
  const allowedTopics = evidence.topicDiagnoses.map(t => t.topic);
  const weakTopics = evidence.topicDiagnoses
    .filter(t => t.attainmentPct < 50.0 || t.category === 'Critical Weakness' || t.category === 'Needs Attention')
    .map(t => t.topic);

  const systemPrompt = `You are an academic instructional recommendation assistant.

Your task is to recommend faculty-reviewable instructional interventions using ONLY the verified academic evidence provided in the request.

STRICT ACADEMIC INTEGRITY INSTRUCTIONS:
1. Do not invent student performance data, marks, or scores.
2. Do not invent CO attainment percentages.
3. Do not invent institutional target percentages.
4. Do not invent prediction probabilities or risk scores.
5. Do not invent curricular topics not in the supplied evidence.
6. Do not invent assessment question IDs not in the supplied evidence.
7. Do not claim expected improvement percentages or score boosts.
8. Do not make causal claims about intervention effectiveness (e.g. "this will improve score by X%").
9. Do not recommend interventions unrelated to the supplied evidence.
10. Do not expose or request personally identifiable information (PII).
11. Recommendations are decision-support aids that must remain subject to faculty approval.
12. All learning gains and reassessment scores remain strictly deterministic and evaluated later in Module 7.

Return ONLY valid JSON matching the requested schema.`;

  const userPrompt = `Generate an evidence-grounded instructional intervention recommendation for this diagnosed academic case.

Allowed Intervention Types:
${JSON.stringify(ALLOWED_INTERVENTION_TYPES)}

Allowed Target CO:
"${evidence.coId}"

Allowed Target Topics:
${JSON.stringify(weakTopics.length > 0 ? weakTopics : allowedTopics)}

Allowed Questions to Target:
${JSON.stringify(evidence.weakQuestions)}

Authoritative Priority (DO NOT CHANGE):
"${evidence.priority}"

Strict JSON Output Schema:
{
  "recommendationTitle": "Brief title describing the intervention strategy",
  "interventionType": "Exact intervention type from Allowed Intervention Types",
  "targetCO": "${evidence.coId}",
  "targetTopic": "One of the allowed weak topics",
  "targetQuestionIds": ["Subset of allowed questions to target"],
  "priority": "${evidence.priority}",
  "intensity": "LOW | MEDIUM | HIGH",
  "timing": "Before next assessment | Within next instructional cycle | During next remediation session",
  "academicFocus": "Specific conceptual and curricular focus",
  "instructionalSequence": [
    "Step 1: Foundational diagnostic review and concept clarification",
    "Step 2: Scaffolded problem-solving with worked examples",
    "Step 3: Targeted formative question practice"
  ],
  "evidenceBasedReason": "Factual pedagogical rationale referencing the student's attainment gap and weak topics",
  "facultyReviewNote": "Actionable notes for faculty review and customization"
}

SUPPLIED VERIFIED EVIDENCE:
${JSON.stringify(evidence, null, 2)}`;

  return { systemPrompt, userPrompt };
}

export function validateGeminiResponse(
  rawJson: any,
  evidence: GeminiEvidencePayload
): { isValid: boolean; error?: string; validatedData?: GeminiRecommendationData } {
  if (!rawJson || typeof rawJson !== 'object') {
    return { isValid: false, error: 'Gemini response is not a valid JSON object.' };
  }

  const requiredFields: (keyof GeminiRecommendationData)[] = [
    'recommendationTitle',
    'interventionType',
    'targetCO',
    'targetTopic',
    'priority',
    'intensity',
    'timing',
    'academicFocus',
    'evidenceBasedReason',
    'facultyReviewNote'
  ];

  for (const field of requiredFields) {
    if (typeof rawJson[field] !== 'string' || (rawJson[field] as string).trim() === '') {
      return { isValid: false, error: `Missing or invalid string field "${field}" in Gemini response.` };
    }
  }

  // Intervention type check
  if (!ALLOWED_INTERVENTION_TYPES.includes(rawJson.interventionType as any)) {
    return {
      isValid: false,
      error: `Invalid intervention type "${rawJson.interventionType}". Must be one of the 10 catalog types.`
    };
  }

  // Target CO check
  if (rawJson.targetCO.trim().toUpperCase() !== evidence.coId.trim().toUpperCase()) {
    return {
      isValid: false,
      error: `Target Course Outcome modified to "${rawJson.targetCO}". Expected "${evidence.coId}".`
    };
  }

  // Priority check
  if (rawJson.priority !== evidence.priority) {
    return {
      isValid: false,
      error: `Attempted to override deterministic priority "${evidence.priority}" with "${rawJson.priority}".`
    };
  }

  // Target topic check
  const allowedTopics = new Set(evidence.topicDiagnoses.map(t => t.topic.trim().toLowerCase()));
  if (evidence.topicDiagnoses.length > 0 && !allowedTopics.has(rawJson.targetTopic.trim().toLowerCase())) {
    return {
      isValid: false,
      error: `Unknown topic "${rawJson.targetTopic}". Must be one of the verified topics in evidence.`
    };
  }

  // Target questions check
  if (!Array.isArray(rawJson.targetQuestionIds)) {
    return { isValid: false, error: 'targetQuestionIds must be an array of question IDs.' };
  }

  const allowedQuestions = new Set(evidence.weakQuestions.map(q => q.trim().toUpperCase()));
  for (const q of rawJson.targetQuestionIds) {
    if (typeof q !== 'string') {
      return { isValid: false, error: 'targetQuestionIds contains non-string item.' };
    }
    const qUpper = q.trim().toUpperCase();
    if (evidence.weakQuestions.length > 0 && !allowedQuestions.has(qUpper)) {
      return {
        isValid: false,
        error: `Question "${q}" is not present in supplied weak questions list.`
      };
    }
  }

  // Intensity check
  if (!['LOW', 'MEDIUM', 'HIGH'].includes(rawJson.intensity)) {
    return { isValid: false, error: `Invalid intensity "${rawJson.intensity}". Must be LOW, MEDIUM, or HIGH.` };
  }

  // Instructional sequence validation (if present)
  let instructionalSequence: string[] | undefined = undefined;
  if (Array.isArray(rawJson.instructionalSequence)) {
    instructionalSequence = [];
    for (const step of rawJson.instructionalSequence) {
      if (typeof step === 'string' && step.trim() !== '') {
        instructionalSequence.push(step.trim());
      }
    }
  }

  // Check text fields for speculative claims, PII, future assessments
  const textToCheck = [
    rawJson.recommendationTitle,
    rawJson.interventionType,
    rawJson.academicFocus,
    rawJson.evidenceBasedReason,
    rawJson.facultyReviewNote,
    ...(instructionalSequence || [])
  ].join(' ');

  for (const pattern of FABRICATED_CLAIM_PATTERNS) {
    if (pattern.test(textToCheck)) {
      return {
        isValid: false,
        error: 'Gemini response contained speculative or fabricated numeric improvement claims.'
      };
    }
  }

  for (const pattern of PII_PATTERNS) {
    if (pattern.test(textToCheck)) {
      return {
        isValid: false,
        error: 'Gemini response contained prohibited personally identifiable information.'
      };
    }
  }

  for (const pattern of FUTURE_ASSESSMENT_TERMS) {
    if (pattern.test(textToCheck)) {
      return {
        isValid: false,
        error: 'Gemini response referenced future assessment or reassessment cycles.'
      };
    }
  }

  return {
    isValid: true,
    validatedData: {
      recommendationTitle: rawJson.recommendationTitle,
      interventionType: rawJson.interventionType as InterventionType,
      targetCO: rawJson.targetCO,
      targetTopic: rawJson.targetTopic,
      targetQuestionIds: rawJson.targetQuestionIds,
      priority: rawJson.priority as any,
      intensity: rawJson.intensity as any,
      timing: rawJson.timing,
      academicFocus: rawJson.academicFocus,
      instructionalSequence,
      evidenceBasedReason: rawJson.evidenceBasedReason,
      facultyReviewNote: rawJson.facultyReviewNote,
      source: 'GEMINI_AI',
      primaryIntervention: rawJson.interventionType,
      reason: rawJson.evidenceBasedReason,
      questionsToTarget: rawJson.targetQuestionIds,
      disclaimer: 'AI-generated recommendation based on verified academic evidence. Faculty review and approval required.'
    }
  };
}

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';
export const GEMINI_FALLBACK_CANDIDATE_MODELS: readonly string[] = [
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash'
];

export async function handleGeminiRecommendationRequest(
  evidence: GeminiEvidencePayload,
  apiKey?: string,
  model = DEFAULT_GEMINI_MODEL
): Promise<{ success: boolean; source: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK'; data?: GeminiRecommendationData; error?: string; modelUsed?: string }> {
  let cleanKey = apiKey ? apiKey.trim() : '';
  if (!cleanKey || cleanKey === 'your_gemini_api_key_here') {
    try {
      const proc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
      if (proc && proc.env) {
        cleanKey = (proc.env.VITE_GEMINI_API_KEY || proc.env.GEMINI_API_KEY || '').trim();
      }
    } catch {}
  }
  if (!cleanKey || cleanKey === 'your_gemini_api_key_here') {
    return {
      success: false,
      source: 'DETERMINISTIC_FALLBACK',
      error: 'VITE_GEMINI_API_KEY is not configured in .env.'
    };
  }

  const studentIdRegex = /^S\d{3}$/;
  if (!evidence.studentId || !studentIdRegex.test(evidence.studentId)) {
    return {
      success: false,
      source: 'DETERMINISTIC_FALLBACK',
      error: 'Student identifier does not conform to anonymized format ^S\\d{3}$. PII protection engaged.'
    };
  }

  if (!evidence.coId || !evidence.topicDiagnoses || evidence.topicDiagnoses.length === 0) {
    return {
      success: false,
      source: 'DETERMINISTIC_FALLBACK',
      error: 'Incomplete evidence payload. Course Outcome or topic diagnoses missing.'
    };
  }

  const { systemPrompt, userPrompt } = buildGeminiPrompt(evidence);

  const candidateModels: string[] = Array.from(
    new Set([
      model,
      ...GEMINI_FALLBACK_CANDIDATE_MODELS
    ].filter(Boolean))
  );

  let lastError = 'Unable to contact Gemini API.';

  for (const currentModel of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${cleanKey}`;

    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller
        ? setTimeout(() => {
            try {
              controller.abort(new Error('Gemini API upstream request timed out after 35 seconds.'));
            } catch {
              controller.abort();
            }
          }, 35000)
        : null;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        }),
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      // On rate limit (429), model not found (404), or service unavailable (503), attempt next candidate model
      if (res.status === 429 || res.status === 404 || res.status === 503) {
        lastError = `Gemini API returned HTTP status ${res.status} on model ${currentModel}.`;
        continue;
      }

      if (!res.ok) {
        lastError = `Gemini API returned HTTP status ${res.status}.`;
        continue;
      }

      const resJson: any = await res.json();
      const candidateText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText || typeof candidateText !== 'string') {
        lastError = 'Empty or missing candidate response from Gemini API.';
        continue;
      }

      let parsedJson: any;
      try {
        parsedJson = JSON.parse(candidateText);
      } catch {
        lastError = 'Malformed JSON returned from Gemini API.';
        continue;
      }

      const validation = validateGeminiResponse(parsedJson, evidence);
      if (!validation.isValid || !validation.validatedData) {
        lastError = validation.error || 'Gemini output failed academic validation.';
        continue;
      }

      return {
        success: true,
        source: 'GEMINI_AI',
        data: validation.validatedData,
        modelUsed: currentModel
      };
    } catch (err: any) {
      const isTimeout =
        err?.name === 'AbortError' ||
        (typeof err?.message === 'string' && err.message.toLowerCase().includes('timed out')) ||
        (typeof err?.message === 'string' && err.message.toLowerCase().includes('aborted'));

      lastError = isTimeout
        ? 'Gemini API request timed out after 35 seconds.'
        : `Network connection failure: ${err?.message || 'Unable to contact Gemini API.'}`;

      if (isTimeout) {
        break;
      }
    }
  }

  return {
    success: false,
    source: 'DETERMINISTIC_FALLBACK',
    error: lastError
  };
}
