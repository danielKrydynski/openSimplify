import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization for Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'MY_OPENROUTER_API_KEY'),
    hasAnthropicKey: Boolean((process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'MY_ANTHROPIC_API_KEY') || (process.env.CLAUDE_API_KEY && process.env.CLAUDE_API_KEY !== 'MY_CLAUDE_API_KEY')),
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'MY_OPENAI_API_KEY'),
    timestamp: new Date().toISOString()
  });
});

// Proxy to test or list models from local LLM or cloud provider backend
app.post('/api/llm/models', async (req, res) => {
  const { backend, endpointUrl, customHeaders, apiKey } = req.body;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20 second timeout for model discovery

    // 0. Gemini Built-In Provider
    if (backend === 'gemini') {
      clearTimeout(timeout);
      const geminiKey = apiKey || process.env.GEMINI_API_KEY;
      if (!geminiKey || geminiKey === 'MY_GEMINI_API_KEY') {
        return res.status(401).json({
          error: 'GEMINI_API_KEY is not configured.',
          hint: 'Enter your Gemini API key directly on the Gemini provider card or configure GEMINI_API_KEY in environment secrets.'
        });
      }
      const geminiModels = [
        { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Fast & Cost Efficient)', isFree: false, provider: 'Google' },
        { id: 'gemini-3.6-pro', name: 'Gemini 3.6 Pro (Advanced Reasoning)', isFree: false, provider: 'Google' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', isFree: false, provider: 'Google' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', isFree: false, provider: 'Google' }
      ];
      return res.json({
        success: true,
        models: geminiModels.map(m => m.id),
        modelsMetadata: geminiModels
      });
    }

    // 1. OpenRouter (Return full catalog with special tagging for free models)
    if (backend === 'openrouter') {
      const openrouterKey = apiKey || process.env.OPENROUTER_API_KEY;
      const headers: Record<string, string> = {
        'HTTP-Referer': process.env.APP_URL || 'https://opensimplify.local',
        'X-Title': 'OpenSimplify Job Assistant'
      };
      if (openrouterKey && openrouterKey !== 'MY_OPENROUTER_API_KEY') {
        headers['Authorization'] = `Bearer ${openrouterKey}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          error: `OpenRouter error (${response.status}): ${errText || response.statusText}`
        });
      }

      const data = await response.json();
      const rawList: any[] = Array.isArray(data.data) ? data.data : [];

      const modelsMetadata = rawList.map((m: any) => {
        const isFree = Boolean(
          m.id?.endsWith(':free') ||
          (m.pricing?.prompt === '0' && m.pricing?.completion === '0') ||
          (m.pricing?.prompt === 0 && m.pricing?.completion === 0)
        );
        return {
          id: m.id,
          name: m.name || m.id,
          contextLength: m.context_length,
          isFree,
          provider: m.id.split('/')[0] || 'OpenRouter',
          description: m.description ? m.description.slice(0, 160) : undefined
        };
      });

      // Priority ordering: Top picks first, then Free models, then the rest
      const topPicks = [
        'anthropic/claude-3.7-sonnet',
        'anthropic/claude-3.5-haiku',
        'openai/gpt-4o',
        'openai/gpt-4o-mini',
        'deepseek/deepseek-r1',
        'meta-llama/llama-3.3-70b-instruct',
        'google/gemini-2.5-flash',
        'mistralai/mistral-large-2411'
      ];

      const freeIds = modelsMetadata.filter(m => m.isFree).map(m => m.id);
      const topFound = topPicks.filter(id => modelsMetadata.some(m => m.id === id));
      const remaining = modelsMetadata
        .map(m => m.id)
        .filter(id => !topFound.includes(id) && !freeIds.includes(id));

      const orderedModelIds = Array.from(new Set([...topFound, ...freeIds, ...remaining]));

      return res.json({
        success: true,
        models: orderedModelIds,
        modelsMetadata,
        totalCount: orderedModelIds.length,
        freeCount: freeIds.length
      });
    }

    // 2. Claude (Anthropic Messages API)
    if (backend === 'claude') {
      const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
      if (!anthropicKey || anthropicKey === 'MY_ANTHROPIC_API_KEY' || anthropicKey === 'MY_CLAUDE_API_KEY') {
        clearTimeout(timeout);
        return res.status(401).json({
          error: 'ANTHROPIC_API_KEY is not configured.',
          hint: 'Enter your Anthropic Claude API key directly on the Claude provider card or in environment secrets.'
        });
      }

      const defaultClaudeModels = [
        'claude-3-7-sonnet-20250219',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229'
      ];

      let discoveredModels = defaultClaudeModels;
      try {
        const response = await fetch('https://api.anthropic.com/v1/models', {
          method: 'GET',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01'
          },
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.data)) {
            const fetched = data.data.map((m: any) => m.id);
            if (fetched.length > 0) {
              discoveredModels = Array.from(new Set([...defaultClaudeModels, ...fetched]));
            }
          }
        }
      } catch {
        // Fallback to verified Claude model list
      }

      const modelsMetadata = discoveredModels.map(id => ({
        id,
        name: id,
        provider: 'Anthropic',
        isFree: false
      }));

      return res.json({ success: true, models: discoveredModels, modelsMetadata });
    }

    // 3. OpenAI Direct
    if (backend === 'openai') {
      const openaiKey = apiKey || process.env.OPENAI_API_KEY;
      if (!openaiKey || openaiKey === 'MY_OPENAI_API_KEY') {
        clearTimeout(timeout);
        return res.status(401).json({
          error: 'OPENAI_API_KEY is not configured.',
          hint: 'Enter your OpenAI API key directly on the OpenAI provider card or in environment secrets.'
        });
      }

      const defaultOpenAIModels = ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1-mini', 'gpt-4-turbo'];
      let discovered = defaultOpenAIModels;
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${openaiKey}` },
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.data)) {
            const fetched = data.data
              .map((m: any) => m.id)
              .filter((id: string) =>
                id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('chatgpt-')
              );
            if (fetched.length > 0) {
              discovered = Array.from(new Set([...defaultOpenAIModels, ...fetched]));
            }
          }
        }
      } catch {
        // Fallback
      }

      const modelsMetadata = discovered.map(id => ({
        id,
        name: id,
        provider: 'OpenAI',
        isFree: false
      }));

      return res.json({ success: true, models: discovered, modelsMetadata });
    }

    // 4. Local or custom OpenAI-compatible daemon (Ollama, LM Studio, vLLM, LocalAI)
    if (!endpointUrl) {
      clearTimeout(timeout);
      return res.status(400).json({ error: 'endpointUrl is required for local backends' });
    }

    const cleanUrl = endpointUrl.replace(/\/$/, '');
    let targetUrl = '';
    
    if (backend === 'ollama') {
      targetUrl = `${cleanUrl}/api/tags`;
    } else {
      targetUrl = `${cleanUrl}/v1/models`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders || {})
    };

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Backend returned status ${response.status}: ${response.statusText}`
      });
    }

    const data = await response.json();
    let models: string[] = [];
    let modelsMetadata: any[] = [];

    if (backend === 'ollama' && Array.isArray((data as any).models)) {
      models = (data as any).models.map((m: any) => m.name || m.model);
      modelsMetadata = (data as any).models.map((m: any) => ({
        id: m.name || m.model,
        name: m.name || m.model,
        isFree: true,
        provider: 'Local Ollama',
        description: m.details ? `${m.details.family || ''} ${m.details.parameter_size || ''}`.trim() : 'Local model'
      }));
    } else if (Array.isArray((data as any).data)) {
      models = (data as any).data.map((m: any) => m.id);
      modelsMetadata = (data as any).data.map((m: any) => ({
        id: m.id,
        name: m.id,
        isFree: true,
        provider: backend.toUpperCase()
      }));
    }

    return res.json({ success: true, models, modelsMetadata, raw: data });
  } catch (error: any) {
    return res.status(502).json({
      error: error.name === 'AbortError' ? 'Connection timed out to endpoint' : error.message,
      hint: backend === 'openrouter' || backend === 'claude' || backend === 'openai'
        ? 'Could not reach cloud provider. Check internet connectivity and API key settings.'
        : 'Ensure your local backend (e.g. Ollama or LM Studio) is running and CORS/network access is enabled.'
    });
  }
});

// Proxy generation requests to local LLM or cloud provider backend
app.post('/api/llm/generate', async (req, res) => {
  const { backend, endpointUrl, model, prompt, systemPrompt, temperature, maxTokens, customHeaders, apiKey } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    // 1. OpenRouter Cloud Provider
    if (backend === 'openrouter') {
      const openrouterKey = apiKey || process.env.OPENROUTER_API_KEY;
      if (!openrouterKey || openrouterKey === 'MY_OPENROUTER_API_KEY') {
        clearTimeout(timeout);
        return res.status(401).json({
          error: 'OPENROUTER_API_KEY is not configured.',
          hint: 'Enter your OpenRouter API key directly on the OpenRouter provider card or in environment secrets.'
        });
      }

      const messages: any[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': process.env.APP_URL || 'https://opensimplify.local',
          'X-Title': 'OpenSimplify Job Assistant'
        },
        body: JSON.stringify({
          model: model || 'anthropic/claude-3.7-sonnet',
          messages,
          temperature: typeof temperature === 'number' ? temperature : 0.7,
          max_tokens: maxTokens || 1500
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          error: `OpenRouter error (${response.status}): ${errText || response.statusText}`
        });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
      return res.json({ text, raw: data });
    }

    // 2. Claude (Anthropic Direct Messages API)
    if (backend === 'claude') {
      const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
      if (!anthropicKey || anthropicKey === 'MY_ANTHROPIC_API_KEY' || anthropicKey === 'MY_CLAUDE_API_KEY') {
        clearTimeout(timeout);
        return res.status(401).json({
          error: 'ANTHROPIC_API_KEY is not configured.',
          hint: 'Enter your Anthropic Claude API key directly on the Claude provider card or in environment secrets.'
        });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model || 'claude-3-7-sonnet-20250219',
          max_tokens: maxTokens || 2048,
          temperature: typeof temperature === 'number' ? Math.min(1.0, Math.max(0, temperature)) : 0.7,
          ...(systemPrompt ? { system: systemPrompt } : {}),
          messages: [
            { role: 'user', content: prompt }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          error: `Anthropic Claude error (${response.status}): ${errText || response.statusText}`
        });
      }

      const data = await response.json();
      const text = Array.isArray(data.content)
        ? data.content.map((c: any) => c.text || '').join('\n')
        : '';
      return res.json({ text, raw: data });
    }

    // 3. OpenAI Direct
    if (backend === 'openai') {
      const openaiKey = apiKey || process.env.OPENAI_API_KEY;
      if (!openaiKey || openaiKey === 'MY_OPENAI_API_KEY') {
        clearTimeout(timeout);
        return res.status(401).json({
          error: 'OPENAI_API_KEY is not configured.',
          hint: 'Enter your OpenAI API key directly on the OpenAI provider card or in environment secrets.'
        });
      }

      const messages: any[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-4o',
          messages,
          temperature: typeof temperature === 'number' ? temperature : 0.7,
          max_tokens: maxTokens || 1500
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          error: `OpenAI error (${response.status}): ${errText || response.statusText}`
        });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
      return res.json({ text, raw: data });
    }

    // 4. Local or custom OpenAI-compatible daemon
    if (!endpointUrl) {
      clearTimeout(timeout);
      return res.status(400).json({ error: 'endpointUrl is required for local backend' });
    }

    const cleanUrl = endpointUrl.replace(/\/$/, '');
    let targetUrl = '';
    let bodyPayload: any = {};

    if (backend === 'ollama') {
      targetUrl = `${cleanUrl}/api/generate`;
      bodyPayload = {
        model: model || 'llama3.2',
        prompt,
        system: systemPrompt || undefined,
        stream: false,
        options: {
          temperature: typeof temperature === 'number' ? temperature : 0.7,
          num_predict: maxTokens || 1500
        }
      };
    } else {
      // LM Studio, vLLM, LocalAI, OpenAI-compatible
      targetUrl = `${cleanUrl}/v1/chat/completions`;
      const messages: any[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      bodyPayload = {
        model: model || 'local-model',
        messages,
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        max_tokens: maxTokens || 1500
      };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders || {})
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `Local LLM error (${response.status}): ${errText || response.statusText}`
      });
    }

    const data = await response.json();
    let text = '';

    if (backend === 'ollama') {
      text = (data as any).response || '';
    } else {
      text = (data as any).choices?.[0]?.message?.content || (data as any).choices?.[0]?.text || '';
    }

    return res.json({ text, raw: data });
  } catch (error: any) {
    return res.status(502).json({
      error: error.name === 'AbortError' ? 'LLM generation timed out' : error.message,
      hint: backend === 'openrouter' || backend === 'claude' || backend === 'openai'
        ? 'Cloud provider call timed out. Check network or try again.'
        : 'Check if your local model is loaded and backend is responsive.'
    });
  }
});

// Optional fallback Gemini endpoint using server-side @google/genai SDK
app.post('/api/gemini/generate', async (req, res) => {
  const { prompt, systemPrompt, temperature, apiKey } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  let ai = getGenAI();
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    ai = new GoogleGenAI({ apiKey });
  }

  if (!ai) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured or missing on the server',
      hint: 'Enter your Gemini API key directly on the Gemini provider card or configure GEMINI_API_KEY in secrets.'
    });
  }

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt || undefined,
          temperature: typeof temperature === 'number' ? temperature : 0.7
        }
      });
    } catch {
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt || undefined,
          temperature: typeof temperature === 'number' ? temperature : 0.7
        }
      });
    }

    const text = response.text || '';
    return res.json({ text });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || 'Gemini generation failed'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
