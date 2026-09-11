export interface ApiRequest {
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
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
  }
  res.statusCode = statusCode;
  if (typeof res.json === 'function') {
    res.json(data);
    return;
  }
  res.end(JSON.stringify(data));
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // 1. CORS headers
  if (typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    return sendJson(res, 405, {
      hasKey: false,
      error: 'Method Not Allowed. Expected GET.'
    });
  }

  // Server reads process.env.GEMINI_API_KEY only
  const apiKey = process.env.GEMINI_API_KEY;

  const hasKey = Boolean(
    apiKey &&
    typeof apiKey === 'string' &&
    apiKey.trim() !== '' &&
    apiKey.trim() !== 'your_gemini_api_key_here'
  );

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';

  return sendJson(res, 200, {
    hasKey,
    status: hasKey ? 'Gemini AI Connected' : 'Gemini API Key Missing',
    model
  });
}
