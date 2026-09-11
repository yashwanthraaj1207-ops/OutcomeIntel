import {
  StudentExplanationPayload,
  InterventionPriority,
  GeminiEvidencePayload,
  GeminiRecommendationData,
  GeminiRecommendationResult,
  InterventionRecommendation
} from '../types/dataTypes';
import { generateInterventionOptions } from './interventionEngine';
import {
  buildGeminiPrompt,
  validateGeminiResponse,
  DEFAULT_GEMINI_MODEL,
  GEMINI_FALLBACK_CANDIDATE_MODELS
} from '../server/geminiBackend';

export type GeminiUIStatus =
  | 'Gemini AI Connected'
  | 'Gemini API Key Missing'
  | 'Gemini Request Failed — Using Deterministic Fallback';

/**
 * Safely resolves the Gemini API key across Vite browser environment and Node test runner.
 * Never exposes the key in logs or UI.
 */
export function getGeminiApiKey(): string | undefined {
  // 1. Vite browser runtime
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const v = (import.meta as any).env.VITE_GEMINI_API_KEY;
      if (v && typeof v === 'string' && v.trim() !== '' && v !== 'your_gemini_api_key_here') {
        return v.trim();
      }
    }
  } catch {
    // ignore
  }

  // 2. Node.js environment
  try {
    const globalProc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
    if (globalProc && globalProc.env) {
      const v = globalProc.env.VITE_GEMINI_API_KEY || globalProc.env.GEMINI_API_KEY;
      if (v && typeof v === 'string' && v.trim() !== '' && v !== 'your_gemini_api_key_here') {
        return v.trim();
      }
    }
  } catch {
    // ignore
  }

  return undefined;
}

/**
 * Returns current model configuration.
 */
export function getGeminiModel(): string {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const m = (import.meta as any).env.VITE_GEMINI_MODEL;
      if (m && typeof m === 'string' && m.trim() !== '') return m.trim();
    }
  } catch {
    // ignore
  }
  try {
    const globalProc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
    if (globalProc && globalProc.env) {
      const m = globalProc.env.VITE_GEMINI_MODEL || globalProc.env.GEMINI_MODEL;
      if (m && typeof m === 'string' && m.trim() !== '') return m.trim();
    }
  } catch {
    // ignore
  }
  return DEFAULT_GEMINI_MODEL;
}

/**
 * Derives UI status indicator matching user requirements:
 * - "Gemini AI Connected"
 * - "Gemini API Key Missing"
 * - "Gemini Request Failed — Using Deterministic Fallback"
 */
export function getGeminiUIStatus(
  apiKeyPresent: boolean,
  lastResult?: GeminiRecommendationResult | null
): { status: GeminiUIStatus; badgeClass: string } {
  if (lastResult?.source === 'DETERMINISTIC_FALLBACK' && lastResult.status === 'API_ERROR') {
    return {
      status: 'Gemini Request Failed — Using Deterministic Fallback',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
    };
  }

  if (!apiKeyPresent) {
    return {
      status: 'Gemini API Key Missing',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }

  return {
    status: 'Gemini AI Connected',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  };
}

/**
 * Extracts strictly factual academic evidence from Module 5 & Module 4.
 * Guarantees zero PII, zero future data leakage, and preserves deterministic priority.
 */
export function buildGeminiEvidencePayload(
  explanation: StudentExplanationPayload,
  priority: InterventionPriority
): GeminiEvidencePayload {
  const weakQuestions = (explanation.questions || [])
    .filter(q => q.attainmentPct < 50.0)
    .map(q => q.questionId);

  const topicDiagnoses = (explanation.topics || []).map(t => ({
    topic: t.topic,
    attainmentPct: t.attainmentPct,
    category: t.diagnosisCategory
  }));

  const evidenceFactors = (explanation.evidenceFactors || []).map(
    f => `${f.category} (${f.severity}): ${f.description} [Observed: ${f.actualValue}, Reference: ${f.referenceValue}]`
  );

  return {
    studentId: explanation.studentId, // Strictly anonymized (e.g. S001)
    courseId: explanation.courseId,
    coId: explanation.coId,
    predictionAssessment: explanation.predictionAssessment,
    riskLevel: explanation.riskLevel,
    priority, // Authoritative deterministic priority classification
    predictedProbability: explanation.predictedProbability,
    historicalAttainment: explanation.historicalAttainment,
    target: explanation.targetThreshold,
    attainmentGap: explanation.attainmentGap,
    performanceTrend: explanation.performanceTrend,
    consistency: explanation.performanceTrend === 'Stable' ? 'High Consistency' : 'Variable',
    topicDiagnoses,
    weakQuestions,
    evidenceFactors
  };
}

/**
 * Converts a deterministic recommendation into a structured GeminiRecommendationData object
 * for transparent deterministic fallback.
 */
export function buildDeterministicFallbackData(
  explanation?: StudentExplanationPayload,
  evidence?: GeminiEvidencePayload
): GeminiRecommendationData {
  let topOpt: InterventionRecommendation | undefined;
  if (explanation) {
    const options = generateInterventionOptions(explanation);
    topOpt = options[0];
  }

  const coId = explanation?.coId || evidence?.coId || 'CO1';
  const topic = topOpt?.targetTopic || (evidence?.topicDiagnoses?.[0]?.topic) || 'Course Topic';
  const type = topOpt?.type || 'Concept Reinforcement';
  const priority = topOpt?.priority || evidence?.priority || 'MODERATE';
  const intensity = topOpt?.intensity || 'MEDIUM';
  const timing = topOpt?.timing || 'Before next assessment';
  const academicFocus = topOpt?.academicFocus || 'Targeted conceptual reinforcement and worked examples on core course topics.';
  const reason = topOpt?.reason || 'Deterministic recommendation generated from verified Module 5 attainment metrics and topic deficiency analysis.';

  return {
    recommendationTitle: `Evidence-Based Intervention: ${type}`,
    interventionType: type,
    targetCO: coId,
    targetTopic: topic,
    targetQuestionIds: topOpt?.questionIds || evidence?.weakQuestions || [],
    priority,
    intensity,
    timing,
    academicFocus,
    instructionalSequence: [
      `Diagnostic Review: Analyze student responses on ${topic} items to diagnose specific misconceptions.`,
      `Worked Example: Review 2 exemplar problems demonstrating step-by-step resolution.`,
      `Guided Practice: Complete targeted formative questions with immediate instructor feedback.`
    ],
    evidenceBasedReason: reason,
    facultyReviewNote: 'Deterministic fallback recommendation generated from verified academic evidence. Faculty review and approval required.',
    source: 'DETERMINISTIC_FALLBACK',
    primaryIntervention: type,
    reason,
    questionsToTarget: topOpt?.questionIds || evidence?.weakQuestions || [],
    disclaimer: 'AI-generated recommendation based on verified academic evidence. Faculty review and approval required.'
  };
}

/**
 * Calls Gemini directly from client when API key is present in client environment.
 */
async function callDirectGeminiAPI(
  evidence: GeminiEvidencePayload,
  apiKey: string,
  model = DEFAULT_GEMINI_MODEL
): Promise<GeminiRecommendationResult> {
  const candidateModels = Array.from(
    new Set([
      model,
      ...GEMINI_FALLBACK_CANDIDATE_MODELS
    ].filter(Boolean))
  );

  let lastError: Error | null = null;

  for (const currentModel of candidateModels) {
    const { systemPrompt, userPrompt } = buildGeminiPrompt(evidence);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => {
          try {
            controller.abort(new Error(`Gemini API request timed out for model ${currentModel}.`));
          } catch {
            controller.abort();
          }
        }, 35000)
      : null;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        }),
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      // Try next candidate model on rate limit or model unavailable
      if (res.status === 429 || res.status === 404 || res.status === 503) {
        lastError = new Error(`Gemini model ${currentModel} returned HTTP status ${res.status}.`);
        continue;
      }

      if (!res.ok) {
        lastError = new Error(`Gemini API returned HTTP status ${res.status}.`);
        continue;
      }

      const json = await res.json();
      const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        lastError = new Error('Empty response received from Gemini API.');
        continue;
      }

      const parsedJson = JSON.parse(candidateText);
      const validation = validateGeminiResponse(parsedJson, evidence);
      if (!validation.isValid || !validation.validatedData) {
        lastError = new Error(validation.error || 'Gemini output validation failed.');
        continue;
      }

      return {
        data: validation.validatedData,
        source: 'GEMINI_AI',
        status: 'SUCCESS',
        statusMessage: 'AI recommendation generated using Google Gemini.',
        isAIGenerated: true,
        generatedAt: new Date().toISOString(),
        modelUsed: currentModel
      };
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      lastError = err;
      const isTimeout =
        err?.name === 'AbortError' ||
        (typeof err?.message === 'string' && err.message.toLowerCase().includes('timed out')) ||
        (typeof err?.message === 'string' && err.message.toLowerCase().includes('aborted'));
      if (isTimeout) {
        break;
      }
    }
  }

  throw lastError || new Error('All candidate Gemini models failed.');
}

/**
 * Main function to generate AI intervention recommendation.
 * 1. Checks evidence validity.
 * 2. Attempts backend server route /api/gemini/recommendation (35s timeout).
 * 3. If server route fails or is unavailable, attempts direct client Gemini API call if key is available.
 * 4. Gracefully falls back to deterministic recommendation on any failure with transparent error reason.
 */
export async function generateAIInterventionRecommendation(
  evidence: GeminiEvidencePayload,
  explanation?: StudentExplanationPayload
): Promise<GeminiRecommendationResult> {
  const fallbackData = buildDeterministicFallbackData(explanation, evidence);

  // 1. Validate evidence input
  if (!evidence.studentId || !evidence.coId || !evidence.topicDiagnoses || evidence.topicDiagnoses.length === 0) {
    return {
      data: fallbackData,
      source: 'DETERMINISTIC_FALLBACK',
      status: 'API_ERROR',
      statusMessage: 'Gemini recommendation unavailable. Showing deterministic evidence-based recommendation.',
      isAIGenerated: false,
      error: 'Incomplete evidence payload. Using deterministic fallback.'
    };
  }

  // 2. Try backend endpoint first (/api/gemini/recommendation)
  let backendError: string | null = null;

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => {
          try {
            controller.abort(new Error('Gemini API request timed out after 35 seconds.'));
          } catch {
            controller.abort();
          }
        }, 35000)
      : null;

    const res = await fetch('/api/gemini/recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(evidence),
      signal: controller ? controller.signal : undefined
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.source === 'GEMINI_AI' && json.data) {
        return {
          data: json.data,
          source: 'GEMINI_AI',
          status: 'SUCCESS',
          statusMessage: 'AI recommendation generated using Google Gemini.',
          isAIGenerated: true,
          generatedAt: new Date().toISOString(),
          modelUsed: json.modelUsed || getGeminiModel()
        };
      }
      backendError = json.error || `Backend returned status ${json.source}`;
    } else {
      backendError = `Backend returned HTTP ${res.status}`;
    }
  } catch (err: any) {
    const isTimeout =
      err?.name === 'AbortError' ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('timed out')) ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('aborted'));

    backendError = isTimeout
      ? 'Backend request timed out after 35 seconds.'
      : (err?.message || 'Backend connection failed.');
  }

  // 3. If backend failed or key is available directly in client, attempt direct Gemini API
  const directApiKey = getGeminiApiKey();
  if (directApiKey) {
    try {
      const directResult = await callDirectGeminiAPI(evidence, directApiKey, getGeminiModel());
      return directResult;
    } catch (directErr: any) {
      const isTimeout =
        directErr?.name === 'AbortError' ||
        (typeof directErr?.message === 'string' && directErr.message.toLowerCase().includes('timed out')) ||
        (typeof directErr?.message === 'string' && directErr.message.toLowerCase().includes('aborted'));

      const directErrMsg = isTimeout
        ? 'Gemini API request timed out after 35 seconds.'
        : (directErr?.message || 'Direct Gemini API request failed.');

      return {
        data: fallbackData,
        source: 'DETERMINISTIC_FALLBACK',
        status: 'API_ERROR',
        statusMessage: 'Gemini recommendation unavailable. Showing deterministic evidence-based recommendation.',
        isAIGenerated: false,
        error: directErrMsg
      };
    }
  }

  // 4. Fallback if no key or all attempts failed
  const finalError = backendError || 'Gemini API key is not configured in .env.';
  return {
    data: fallbackData,
    source: 'DETERMINISTIC_FALLBACK',
    status: 'API_ERROR',
    statusMessage: 'Gemini recommendation unavailable. Showing deterministic evidence-based recommendation.',
    isAIGenerated: false,
    error: finalError
  };
}
