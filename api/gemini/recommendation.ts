import { handleGeminiRecommendationRequest } from '../../src/server/geminiBackend';

declare const process: {
  env: Record<string, string | undefined>;
};

export interface ApiRequest {
  body?: any;
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  [key: string]: any;
}

export interface ApiResponse {
  statusCode?: number;
  setHeader: (name: string, value: string | number | readonly string[]) => any;
  end: (chunk?: any) => any;
  status?: (statusCode: number) => {
    json: (data: any) => any;
    send?: (data: any) => any;
    end?: (chunk?: any) => any;
    [key: string]: any;
  };
  json?: (data: any) => any;
  send?: (data: any) => any;
  [key: string]: any;
}

function sendJson(res: ApiResponse, statusCode: number, data: any) {
  if (typeof res.status === 'function') {
    const chain = res.status(statusCode);
    if (chain && typeof chain.json === 'function') {
      chain.json(data);
      return;
    }
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // 1. CORS headers for cross-origin / preview deployment safety
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // 2. HTTP Method restriction
  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      success: false,
      source: 'DETERMINISTIC_FALLBACK',
      error: 'Method Not Allowed. Expected POST.'
    });
  }

  try {
    // 3. Body extraction (supporting pre-parsed JSON objects or raw string payloads)
    let evidence = req.body;
    if (typeof evidence === 'string') {
      try {
        evidence = JSON.parse(evidence);
      } catch {
        return sendJson(res, 400, {
          success: false,
          source: 'DETERMINISTIC_FALLBACK',
          error: 'Malformed JSON payload in request body.'
        });
      }
    }

    if (!evidence || typeof evidence !== 'object') {
      return sendJson(res, 400, {
        success: false,
        source: 'DETERMINISTIC_FALLBACK',
        error: 'Missing diagnostic evidence payload in request body.'
      });
    }

    // 4. Server-side environment variable resolution (prioritizing GEMINI_API_KEY)
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY;

    const model =
      process.env.GEMINI_MODEL ||
      process.env.VITE_GEMINI_MODEL ||
      'gemini-2.5-flash-lite';

    // 5. Delegate to verified server handler
    const result = await handleGeminiRecommendationRequest(
      evidence,
      apiKey,
      model
    );

    return sendJson(res, 200, result);
  } catch (error: any) {
    return sendJson(res, 500, {
      success: false,
      source: 'DETERMINISTIC_FALLBACK',
      error: error?.message || 'Internal server error while processing Gemini recommendation.'
    });
  }
}