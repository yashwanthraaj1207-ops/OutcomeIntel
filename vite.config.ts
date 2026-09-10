import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleGeminiRecommendationRequest } from './src/server/geminiBackend';

function geminiApiPlugin(env: Record<string, string>): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    // Health / API key status check endpoint
    if (req.url === '/api/gemini/status' && req.method === 'GET') {
      const apiKey =
        env.VITE_GEMINI_API_KEY ||
        env.GEMINI_API_KEY ||
        process.env.VITE_GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY;
      const hasKey = Boolean(apiKey && apiKey.trim() && apiKey !== 'your_gemini_api_key_here');
      const model =
        env.VITE_GEMINI_MODEL ||
        env.GEMINI_MODEL ||
        process.env.VITE_GEMINI_MODEL ||
        process.env.GEMINI_MODEL ||
        'gemini-2.5-flash-lite';

      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          hasKey,
          status: hasKey ? 'Gemini AI Connected' : 'Gemini API Key Missing',
          model
        })
      );
      return;
    }

    // Recommendation generation endpoint
    if (req.url === '/api/gemini/recommendation' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const evidence = JSON.parse(body);
          const apiKey =
            env.VITE_GEMINI_API_KEY ||
            env.GEMINI_API_KEY ||
            process.env.VITE_GEMINI_API_KEY ||
            process.env.GEMINI_API_KEY;
          const model =
            env.VITE_GEMINI_MODEL ||
            env.GEMINI_MODEL ||
            process.env.VITE_GEMINI_MODEL ||
            process.env.GEMINI_MODEL ||
            'gemini-2.5-flash-lite';

          const result = await handleGeminiRecommendationRequest(evidence, apiKey, model);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } catch (err: any) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              success: false,
              source: 'DETERMINISTIC_FALLBACK',
              error: err?.message || 'Invalid request body or server execution error'
            })
          );
        }
      });
    } else {
      next();
    }
  };

  return {
    name: 'gemini-backend-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), geminiApiPlugin(env)],
    server: {
      port: 5173,
      open: false
    }
  };
});
