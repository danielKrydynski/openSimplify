import React from 'react';
import { Sparkles, FileText, UserCheck, Cpu, Briefcase, ShieldCheck, RefreshCw, Puzzle } from 'lucide-react';
import { LLMConfig } from '../types';

interface NavbarProps {
  activeTab: 'autofill' | 'tailor' | 'profile' | 'settings' | 'tracker' | 'extension';
  setActiveTab: (tab: 'autofill' | 'tailor' | 'profile' | 'settings' | 'tracker' | 'extension') => void;
  llmConfig: LLMConfig;
  onRefreshConnection: () => void;
  isTestingConnection: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  llmConfig,
  onRefreshConnection,
  isTestingConnection
}) => {
  const isConnected = llmConfig.status === 'connected';

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Privacy Indicator */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                  OpenSimplify
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  100% Local &amp; Private
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Open-source local &amp; cloud LLM job auto-filler &amp; resume tailor
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1">
            <button
              id="nav-tab-autofill"
              onClick={() => setActiveTab('autofill')}
              className={`flex items-center px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'autofill'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              AutoFill
            </button>

            <button
              id="nav-tab-tailor"
              onClick={() => setActiveTab('tailor')}
              className={`flex items-center px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'tailor'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Resume Tailor
            </button>

            <button
              id="nav-tab-profile"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-4 h-4 mr-1.5" />
              Profile Vault
            </button>

            <button
              id="nav-tab-tracker"
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'tracker'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-4 h-4 mr-1.5" />
              Tracker
            </button>

            <button
              id="nav-tab-extension"
              onClick={() => setActiveTab('extension')}
              className={`flex items-center px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'extension'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Puzzle className="w-4 h-4 mr-1.5 text-emerald-500" />
              <span>Chrome Plugin</span>
              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                In-Tab
              </span>
            </button>

            <button
              id="nav-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Cpu className="w-4 h-4 mr-1.5" />
              LLM Backend
            </button>
          </nav>

          {/* Active Backend Status Badge */}
          <div className="hidden lg:flex items-center space-x-2">
            <button
              id="btn-quick-status"
              onClick={() => setActiveTab('settings')}
              title="Click to configure local LLM backend"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 transition-colors text-left"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected
                    ? 'bg-emerald-500 animate-pulse'
                    : llmConfig.status === 'testing'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-slate-400'
                }`}
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {llmConfig.backend.toUpperCase()}: {llmConfig.model || 'Model'}
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">
                  {isConnected
                    ? `${llmConfig.latencyMs || 25}ms latency`
                    : 'Offline / Fallback Ready'}
                </span>
              </div>
            </button>

            <button
              id="btn-recheck-connection"
              onClick={onRefreshConnection}
              disabled={isTestingConnection}
              title="Ping backend"
              aria-label="Ping backend"
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isTestingConnection ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
