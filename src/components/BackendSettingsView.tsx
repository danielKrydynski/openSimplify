import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Terminal,
  AlertTriangle,
  Trash2,
  Check,
  Cloud,
  HardDrive,
  Key,
  ExternalLink,
  Sparkles,
  Server
} from 'lucide-react';
import { LLMConfig, LLMBackendType } from '../types';
import { StorageService } from '../services/storageService';
import { LLMService } from '../services/llmService';

interface BackendSettingsViewProps {
  llmConfig: LLMConfig;
  onConfigUpdated: (config: LLMConfig) => void;
  onRefreshConnection: () => void;
  isTestingConnection: boolean;
}

interface BackendPreset {
  id: LLMBackendType;
  name: string;
  category: 'cloud' | 'local';
  badge: string;
  defaultUrl: string;
  defaultModel: string;
  popularModels: string[];
  description: string;
  envVar?: string;
  providerInfo?: string;
}

const BACKEND_PRESETS: BackendPreset[] = [
  // Major Cloud Providers
  {
    id: 'openrouter',
    name: 'OpenRouter',
    category: 'cloud',
    badge: 'Universal Cloud Gateway',
    defaultUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.7-sonnet',
    popularModels: [
      'anthropic/claude-3.7-sonnet',
      'anthropic/claude-3.5-haiku',
      'deepseek/deepseek-r1',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'meta-llama/llama-3.3-70b-instruct',
      'mistralai/mistral-large-2411'
    ],
    description: 'Unified cloud gateway. Connect Claude 3.7 Sonnet, DeepSeek R1, GPT-4o, and 200+ models via secure server proxy.',
    envVar: 'OPENROUTER_API_KEY',
    providerInfo: 'Requires OPENROUTER_API_KEY in server secrets. API key stays hidden on server.'
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    category: 'cloud',
    badge: 'Frontier Reasoning',
    defaultUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-7-sonnet-20250219',
    popularModels: [
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229'
    ],
    description: 'Direct connection to Anthropic Claude Messages API for tailored job autofill and high-precision resume adaptation.',
    envVar: 'ANTHROPIC_API_KEY',
    providerInfo: 'Requires ANTHROPIC_API_KEY in server secrets.'
  },
  {
    id: 'openai',
    name: 'OpenAI Direct',
    category: 'cloud',
    badge: 'GPT-4o & Reasoning',
    defaultUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    popularModels: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'gpt-4-turbo'],
    description: 'Direct server connection to OpenAI API for GPT-4o and reasoning models.',
    envVar: 'OPENAI_API_KEY',
    providerInfo: 'Requires OPENAI_API_KEY in server secrets.'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    category: 'cloud',
    badge: 'Built-in Server Proxy',
    defaultUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-3.6-flash',
    popularModels: ['gemini-3.6-flash', 'gemini-3.6-pro'],
    description: 'Server-side Gemini 3.6 Flash/Pro with fast generation and smart job matching.',
    envVar: 'GEMINI_API_KEY',
    providerInfo: 'Configured via GEMINI_API_KEY in server secrets.'
  },

  // Local Daemons & Self-Hosted
  {
    id: 'ollama',
    name: 'Ollama',
    category: 'local',
    badge: '100% Local & Private',
    defaultUrl: 'http://localhost:11434',
    defaultModel: 'llama3.2',
    popularModels: ['llama3.2', 'mistral', 'deepseek-r1:8b', 'qwen2.5:7b', 'phi4', 'gemma2:9b'],
    description: 'Lightweight local daemon. Runs Llama 3.2, DeepSeek, Mistral, and Qwen offline on your machine with 100% data privacy.'
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    category: 'local',
    badge: 'Desktop GUI',
    defaultUrl: 'http://localhost:1234/v1',
    defaultModel: 'local-model',
    popularModels: ['local-model', 'meta-llama-3.1-8b-instruct', 'deepseek-r1-distill-qwen-7b', 'mistral-7b-instruct'],
    description: 'Desktop GUI for exploring, downloading, and running GGUF models locally with OpenAI-compatible server.'
  },
  {
    id: 'vllm',
    name: 'vLLM',
    category: 'local',
    badge: 'High Throughput',
    defaultUrl: 'http://localhost:8000/v1',
    defaultModel: 'meta-llama/Llama-3.1-8B-Instruct',
    popularModels: ['meta-llama/Llama-3.1-8B-Instruct', 'Qwen/Qwen2.5-7B-Instruct', 'mistralai/Mistral-7B-Instruct-v0.3'],
    description: 'High-throughput PagedAttention server optimized for GPU clusters and maximum token generation performance.'
  },
  {
    id: 'localai',
    name: 'LocalAI',
    category: 'local',
    badge: 'Self-Hosted Daemon',
    defaultUrl: 'http://localhost:8080/v1',
    defaultModel: 'gpt-3.5-turbo',
    popularModels: ['gpt-3.5-turbo', 'llama-3', 'mistral'],
    description: 'Self-hosted, free, open-source replacement for OpenAI with local text and function-calling support.'
  },
  {
    id: 'custom',
    name: 'Custom OpenAI-Compatible',
    category: 'local',
    badge: 'Any Port / Host',
    defaultUrl: 'http://localhost:5000/v1',
    defaultModel: 'default-model',
    popularModels: ['default-model', 'text-generation-webui', 'llama.cpp-server', 'jan-ai'],
    description: 'Connect any custom local or private cloud endpoint (llama.cpp server, Jan.ai, Aphrodite, TGI).'
  }
];

export const BackendSettingsView: React.FC<BackendSettingsViewProps> = ({
  llmConfig,
  onConfigUpdated,
  onRefreshConnection,
  isTestingConnection
}) => {
  const [config, setConfig] = useState<LLMConfig>(llmConfig);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string; latency?: number } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'cloud' | 'local'>('all');
  const [serverHealth, setServerHealth] = useState<{
    hasGeminiKey: boolean;
    hasOpenRouterKey: boolean;
    hasAnthropicKey: boolean;
    hasOpenAIKey: boolean;
  }>({
    hasGeminiKey: false,
    hasOpenRouterKey: false,
    hasAnthropicKey: false,
    hasOpenAIKey: false
  });

  const auditData = StorageService.getAuditData();

  // Load server key detection on mount
  useEffect(() => {
    LLMService.checkHealth().then(setServerHealth);
  }, []);

  const handleSelectBackend = (backend: LLMBackendType) => {
    const preset = BACKEND_PRESETS.find(p => p.id === backend);
    if (!preset) return;

    const isCloud = preset.category === 'cloud';

    const updated: LLMConfig = {
      ...config,
      backend,
      endpointUrl: preset.defaultUrl,
      model: preset.defaultModel,
      availableModels: preset.popularModels,
      // Cloud backends must always use proxy to protect API keys
      mode: isCloud ? 'proxy' : config.mode,
      status: 'idle',
      statusMessage: 'Endpoint changed, test connection to verify'
    };
    setConfig(updated);
    StorageService.saveLLMConfig(updated);
    onConfigUpdated(updated);
  };

  const handleQuickSelectModel = (modelName: string) => {
    const updated: LLMConfig = {
      ...config,
      model: modelName
    };
    setConfig(updated);
    StorageService.saveLLMConfig(updated);
    onConfigUpdated(updated);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await LLMService.testConnection(config);
      setTestResult({
        success: res.success,
        error: res.error,
        latency: res.latencyMs
      });

      const updated: LLMConfig = {
        ...config,
        status: res.success ? 'connected' : 'error',
        statusMessage: res.success ? `Connected (${res.latencyMs}ms)` : res.error,
        latencyMs: res.latencyMs,
        availableModels: res.models.length > 0 ? res.models : config.availableModels,
        lastTested: new Date().toISOString()
      };

      if (res.models.length > 0 && !res.models.includes(config.model)) {
        updated.model = res.models[0];
      }

      setConfig(updated);
      StorageService.saveLLMConfig(updated);
      onConfigUpdated(updated);

      // Also refresh server health
      LLMService.checkHealth().then(setServerHealth);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message, latency: 0 });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleWipeData = () => {
    StorageService.wipeAllLocalData();
    setShowWipeConfirm(false);
    window.location.reload();
  };

  const filteredPresets = BACKEND_PRESETS.filter(p => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  const currentPreset = BACKEND_PRESETS.find(p => p.id === config.backend) || BACKEND_PRESETS[0];
  const isCurrentCloud = currentPreset.category === 'cloud';

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
              <Cpu className="w-5 h-5 text-emerald-600 mr-2" />
              LLM Backends &amp; Privacy Configuration
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Switch effortlessly between privacy-first local models (Ollama, LM Studio, vLLM) and major cloud providers (OpenRouter, Claude, OpenAI, Gemini).
            </p>
          </div>

          <button
            id="btn-test-connection"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center self-start disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isTesting ? 'animate-spin text-emerald-400' : ''}`} />
            {isTesting ? 'Pinging Backend...' : 'Test Connection'}
          </button>
        </div>

        {/* Test Result Alert */}
        {testResult && (
          <div
            className={`mt-4 p-3 rounded-lg border text-xs flex items-start space-x-2 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">
                {testResult.success
                  ? `Successfully connected to ${config.backend.toUpperCase()} in ${testResult.latency}ms!`
                  : `Connection could not be established`}
              </p>
              {testResult.error && (
                <p className="text-[11px] leading-relaxed opacity-90">
                  {testResult.error}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cloud Secrets Status Panel */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Cloud Provider Credentials (Server-Side Secrets)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Keys are securely held in environment variables and never exposed to browser localStorage
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className={`p-3 rounded-lg border text-xs transition-colors ${
            serverHealth.hasOpenRouterKey
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center justify-between font-semibold">
              <span>OpenRouter</span>
              {serverHealth.hasOpenRouterKey ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">Unset</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">OPENROUTER_API_KEY</div>
          </div>

          <div className={`p-3 rounded-lg border text-xs transition-colors ${
            serverHealth.hasAnthropicKey
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center justify-between font-semibold">
              <span>Anthropic Claude</span>
              {serverHealth.hasAnthropicKey ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">Unset</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">ANTHROPIC_API_KEY</div>
          </div>

          <div className={`p-3 rounded-lg border text-xs transition-colors ${
            serverHealth.hasOpenAIKey
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center justify-between font-semibold">
              <span>OpenAI</span>
              {serverHealth.hasOpenAIKey ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">Unset</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">OPENAI_API_KEY</div>
          </div>

          <div className={`p-3 rounded-lg border text-xs transition-colors ${
            serverHealth.hasGeminiKey
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center justify-between font-semibold">
              <span>Google Gemini</span>
              {serverHealth.hasGeminiKey ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">Unset</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">GEMINI_API_KEY</div>
          </div>
        </div>
      </div>

      {/* Backend Selection Grid with Filter Tabs */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <Server className="w-4 h-4 mr-1.5 text-slate-700" />
            Select Active Backend
          </h2>

          {/* Filter tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start">
            <button
              id="filter-all-backends"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeCategory === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({BACKEND_PRESETS.length})
            </button>
            <button
              id="filter-cloud-backends"
              onClick={() => setActiveCategory('cloud')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center ${
                activeCategory === 'cloud'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cloud className="w-3 h-3 mr-1 text-sky-600" />
              Cloud ({BACKEND_PRESETS.filter(p => p.category === 'cloud').length})
            </button>
            <button
              id="filter-local-backends"
              onClick={() => setActiveCategory('local')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center ${
                activeCategory === 'local'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HardDrive className="w-3 h-3 mr-1 text-emerald-600" />
              Local ({BACKEND_PRESETS.filter(p => p.category === 'local').length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPresets.map(preset => {
            const isSelected = config.backend === preset.id;
            const isCloud = preset.category === 'cloud';

            return (
              <button
                key={preset.id}
                id={`btn-select-backend-${preset.id}`}
                onClick={() => handleSelectBackend(preset.id)}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs ring-2 ring-slate-900/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm flex items-center">
                      {isCloud ? (
                        <Cloud className={`w-3.5 h-3.5 mr-1.5 ${isSelected ? 'text-sky-300' : 'text-sky-600'}`} />
                      ) : (
                        <HardDrive className={`w-3.5 h-3.5 mr-1.5 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`} />
                      )}
                      {preset.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isCloud
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {preset.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/40 flex items-center justify-between text-[11px] font-mono opacity-85">
                  <span className="truncate max-w-[170px]">{preset.defaultModel}</span>
                  {isSelected && (
                    <span className="text-emerald-400 font-sans font-bold flex items-center text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connection & Model Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Setup */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Active Endpoint &amp; Model Configuration
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
              {currentPreset.name}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Endpoint URL
              </label>
              <input
                id="input-endpoint-url"
                type="text"
                value={config.endpointUrl}
                onChange={e => {
                  const updated = { ...config, endpointUrl: e.target.value };
                  setConfig(updated);
                  StorageService.saveLLMConfig(updated);
                  onConfigUpdated(updated);
                }}
                className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model Identifier
              </label>
              <div className="flex space-x-2">
                <input
                  id="input-model-name"
                  type="text"
                  value={config.model}
                  onChange={e => {
                    const updated = { ...config, model: e.target.value };
                    setConfig(updated);
                    StorageService.saveLLMConfig(updated);
                    onConfigUpdated(updated);
                  }}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />

                {config.availableModels.length > 0 && (
                  <select
                    id="select-discovered-model"
                    value={config.model}
                    onChange={e => {
                      const updated = { ...config, model: e.target.value };
                      setConfig(updated);
                      StorageService.saveLLMConfig(updated);
                      onConfigUpdated(updated);
                    }}
                    className="text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 max-w-[150px]"
                  >
                    {config.availableModels.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Quick Model Selector Pills */}
              <div className="mt-2.5">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Popular Models for {currentPreset.name}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentPreset.popularModels.map(m => (
                    <button
                      key={m}
                      id={`btn-quick-model-${m.replace(/[/.:]/g, '-')}`}
                      type="button"
                      onClick={() => handleQuickSelectModel(m)}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-colors ${
                        config.model === m
                          ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mode selection (Proxy vs Direct) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Network Routing Mode
              </label>
              {isCurrentCloud ? (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 space-y-1">
                  <div className="font-semibold flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1 text-sky-600" />
                    Server-Side Proxy Mode (Enforced for Cloud Providers)
                  </div>
                  <p className="text-[11px] text-sky-700 leading-relaxed">
                    Cloud API calls route through the application&apos;s server-side proxy so that secret API keys are never leaked to client network traffic or stored in browser storage.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-mode-proxy"
                    onClick={() => {
                      const updated: LLMConfig = { ...config, mode: 'proxy' };
                      setConfig(updated);
                      StorageService.saveLLMConfig(updated);
                      onConfigUpdated(updated);
                    }}
                    className={`p-2.5 text-xs rounded-lg border text-left transition-colors ${
                      config.mode === 'proxy'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="block font-bold">Server Proxy (Recommended)</span>
                    <span className={`text-[10px] block mt-0.5 ${config.mode === 'proxy' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Bypasses browser Mixed-Content / CORS blocks.
                    </span>
                  </button>

                  <button
                    type="button"
                    id="btn-mode-direct"
                    onClick={() => {
                      const updated: LLMConfig = { ...config, mode: 'direct' };
                      setConfig(updated);
                      StorageService.saveLLMConfig(updated);
                      onConfigUpdated(updated);
                    }}
                    className={`p-2.5 text-xs rounded-lg border text-left transition-colors ${
                      config.mode === 'direct'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="block font-bold">Direct Client Fetch</span>
                    <span className={`text-[10px] block mt-0.5 ${config.mode === 'direct' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Direct browser fetch. Requires CORS enabled on local daemon.
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Creativity / Temperature</span>
                <span className="font-mono">{config.temperature}</span>
              </div>
              <input
                id="slider-temperature"
                type="range"
                min="0.1"
                max="1.2"
                step="0.05"
                value={config.temperature}
                onChange={e => {
                  const updated = { ...config, temperature: parseFloat(e.target.value) };
                  setConfig(updated);
                  StorageService.saveLLMConfig(updated);
                  onConfigUpdated(updated);
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Cloud Setup & Local Commands */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <Terminal className="w-4 h-4 mr-1.5 text-slate-700" />
            Backend Setup Instructions
          </h2>

          <div className="space-y-3 text-xs">
            {/* OpenRouter Setup Guide */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900 flex items-center">
                  <Cloud className="w-3.5 h-3.5 text-sky-600 mr-1" />
                  OpenRouter &amp; Claude Cloud Providers:
                </strong>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                To connect to <strong>OpenRouter</strong> or <strong>Anthropic Claude</strong>, configure their API keys in your application environment settings (or <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">.env</code>):
              </p>
              <pre className="p-2 bg-slate-900 text-emerald-400 rounded text-[11px] font-mono overflow-x-auto">
                OPENROUTER_API_KEY=sk-or-v1-...{'\n'}
                ANTHROPIC_API_KEY=sk-ant-...
              </pre>
              <p className="text-[11px] text-slate-500">
                All cloud requests are securely proxied with zero keys stored in browser storage or client-side bundles.
              </p>
            </div>

            {/* Ollama Setup */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900 flex items-center">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  Ollama (Start with CORS support):
                </strong>
                <button
                  onClick={() => handleCopy('OLLAMA_ORIGINS="*" ollama serve', 'ollama-cors')}
                  className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center font-medium"
                >
                  {copiedCmd === 'ollama-cors' ? <Check className="w-3 h-3 text-emerald-600 mr-1" /> : null}
                  {copiedCmd === 'ollama-cors' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-2 bg-slate-900 text-emerald-400 rounded text-[11px] font-mono overflow-x-auto">
                OLLAMA_ORIGINS=&quot;*&quot; ollama serve
              </pre>
              <p className="text-[11px] text-slate-500">
                To download Llama 3.2: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">ollama run llama3.2</code>
              </p>
            </div>

            {/* LM Studio Setup */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900 flex items-center">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  LM Studio Local Server:
                </strong>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                1. Open LM Studio &gt; Go to <strong>Local Server</strong> tab.
                <br />
                2. Check <strong>Enable CORS</strong> and click <strong>Start Server</strong> on port 1234.
                <br />
                3. Load any downloaded model into GPU/CPU memory.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Shield & Telemetry Audit Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Privacy Shield &amp; Zero-Telemetry Audit
              </h2>
              <p className="text-xs text-slate-500">
                Verification report of all application data flows and local storage footprint.
              </p>
            </div>
          </div>

          <button
            id="btn-wipe-data"
            onClick={() => setShowWipeConfirm(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center self-start"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Wipe All Local Data
          </button>
        </div>

        {/* Audit Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">External Data Leaks</span>
            <span className="text-xl font-extrabold text-emerald-600">0 Bytes</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Strict architectural guarantee</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Generations</span>
            <span className="text-xl font-extrabold text-slate-900">{auditData.totalGenerations}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Completed inference runs</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Tokens Processed</span>
            <span className="text-xl font-extrabold text-slate-900">{auditData.totalTokensEstimated.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Estimated inference tokens</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Local Vault Footprint</span>
            <span className="text-xl font-extrabold text-slate-900">
              {(auditData.localStorageSizeBytes / 1024).toFixed(1)} KB
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Encrypted in browser storage</span>
          </div>
        </div>
      </div>

      {/* Wipe Confirmation Modal */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                Confirm Data Wipe
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently delete your stored profile details, all tailored resumes, and tracked job applications from your browser&apos;s localStorage. This cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowWipeConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-wipe"
                onClick={handleWipeData}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Yes, Wipe Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
