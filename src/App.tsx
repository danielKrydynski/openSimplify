/**
 * OpenSimplify: Open-Source Privacy-Focused Job Application AutoFill & Resume Tailor
 * Uses local LLMs (Ollama, LM Studio, vLLM, LocalAI) with 100% zero-telemetry client persistence.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { AutoFillView } from './components/AutoFillView';
import { ResumeTailorView } from './components/ResumeTailorView';
import { ProfileVaultView } from './components/ProfileVaultView';
import { BackendSettingsView } from './components/BackendSettingsView';
import { TrackerView } from './components/TrackerView';
import { ChromeExtensionView } from './components/ChromeExtensionView';
import { UserProfile, LLMConfig, JobApplicationTrackerItem } from './types';
import { StorageService } from './services/storageService';
import { LLMService } from './services/llmService';
import { ShieldCheck, Lock, Terminal } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'autofill' | 'tailor' | 'profile' | 'settings' | 'tracker' | 'extension'>('autofill');
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => StorageService.getLLMConfig());
  const [applications, setApplications] = useState<JobApplicationTrackerItem[]>(() => StorageService.getApplications());
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Ping backend on mount or when requested
  const checkConnection = useCallback(async () => {
    setIsTestingConnection(true);
    try {
      const res = await LLMService.testConnection(llmConfig);
      setLlmConfig(prev => {
        const updated: LLMConfig = {
          ...prev,
          status: res.success ? 'connected' : 'error',
          statusMessage: res.success ? `Connected (${res.latencyMs}ms)` : res.error,
          latencyMs: res.latencyMs,
          availableModels: res.models.length > 0 ? res.models : prev.availableModels,
          lastTested: new Date().toISOString()
        };
        StorageService.saveLLMConfig(updated);
        return updated;
      });
    } catch {
      setLlmConfig(prev => ({
        ...prev,
        status: 'error',
        statusMessage: 'Could not connect'
      }));
    } finally {
      setIsTestingConnection(false);
    }
  }, [llmConfig]);

  useEffect(() => {
    checkConnection();
  }, []);

  const handleProfileUpdated = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  const handleLLMConfigUpdated = (newConfig: LLMConfig) => {
    setLlmConfig(newConfig);
  };

  const handleApplicationSaved = (newApp: JobApplicationTrackerItem) => {
    setApplications(prev => [newApp, ...prev.filter(a => a.id !== newApp.id)]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        llmConfig={llmConfig}
        onRefreshConnection={checkConnection}
        isTestingConnection={isTestingConnection}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'autofill' && (
          <AutoFillView
            profile={profile}
            llmConfig={llmConfig}
            onApplicationSaved={handleApplicationSaved}
            onNavigateToExtension={() => setActiveTab('extension')}
          />
        )}

        {activeTab === 'tailor' && (
          <ResumeTailorView
            profile={profile}
            llmConfig={llmConfig}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileVaultView
            profile={profile}
            onProfileUpdated={handleProfileUpdated}
          />
        )}

        {activeTab === 'tracker' && (
          <TrackerView
            applications={applications}
            onApplicationsUpdated={setApplications}
          />
        )}

        {activeTab === 'settings' && (
          <BackendSettingsView
            llmConfig={llmConfig}
            onConfigUpdated={handleLLMConfigUpdated}
            onRefreshConnection={checkConnection}
            isTestingConnection={isTestingConnection}
          />
        )}

        {activeTab === 'extension' && (
          <ChromeExtensionView
            profile={profile}
            llmConfig={llmConfig}
          />
        )}
      </main>

      {/* Footer / Privacy & Architecture Guarantee */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900">OpenSimplify</span>
              <span>•</span>
              <span className="flex items-center text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Privacy-First Local LLM Architecture
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Lock className="w-3 h-3 mr-1 text-slate-400" />
                Zero Telemetry
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span>Supports Ollama, LM Studio, vLLM, OpenRouter, Claude &amp; OpenAI</span>
              <button
                onClick={() => setActiveTab('settings')}
                className="hover:text-slate-900 font-medium flex items-center"
              >
                <Terminal className="w-3 h-3 mr-1" />
                Configure Models
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
