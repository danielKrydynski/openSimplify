import React, { useState } from 'react';
import { UserProfile, LLMConfig } from '../types';
import { ExtensionService } from '../services/extensionService';
import { 
  Download, 
  Puzzle, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Zap, 
  Terminal, 
  Layers, 
  FileText,
  Bookmark
} from 'lucide-react';

interface ChromeExtensionViewProps {
  profile: UserProfile;
  llmConfig: LLMConfig;
}

export const ChromeExtensionView: React.FC<ChromeExtensionViewProps> = ({ profile, llmConfig }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Sandbox state for interactive in-tab demo
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoLinkedin, setDemoLinkedin] = useState('');
  const [demoGithub, setDemoGithub] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [demoRole, setDemoRole] = useState('');
  const [demoWorkAuth, setDemoWorkAuth] = useState<'yes' | 'no' | ''>('');
  const [demoSponsorship, setDemoSponsorship] = useState<'yes' | 'no' | ''>('');
  const [demoEssay, setDemoEssay] = useState('');
  const [isDemoAiGenerating, setIsDemoAiGenerating] = useState(false);
  const [demoFilledCount, setDemoFilledCount] = useState<number | null>(null);

  const handleDownloadExtension = async () => {
    setIsDownloading(true);
    try {
      const blob = await ExtensionService.generateExtensionZip(profile, llmConfig);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opensimplify-extension-${profile.fullName.toLowerCase().replace(/\s+/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to generate extension zip:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSyncToExtension = () => {
    ExtensionService.syncToActiveTabs(profile, llmConfig);
    setSyncStatus('Vault details broadcasted to active browser tabs!');
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handleCopyBookmarklet = () => {
    const code = ExtensionService.getBookmarkletCode();
    navigator.clipboard.writeText(code);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 3000);
  };

  const handleRunDemoAutofill = () => {
    setDemoName(profile.fullName || 'Alex Morgan');
    setDemoEmail(profile.email || 'alex.morgan.dev@gmail.com');
    setDemoPhone(profile.phone || '+1 (415) 890-4210');
    setDemoLinkedin(profile.linkedinUrl || 'https://linkedin.com/in/alexmorgandev');
    setDemoGithub(profile.githubUrl || 'https://github.com/alexmorgan-code');
    setDemoCompany(profile.experiences?.[0]?.company || 'Veloce Cloud Systems');
    setDemoRole(profile.experiences?.[0]?.role || 'Senior Software Engineer');
    setDemoWorkAuth('yes');
    setDemoSponsorship('no');
    setDemoFilledCount(8);
  };

  const handleDemoAiGenerate = () => {
    setIsDemoAiGenerating(true);
    setTimeout(() => {
      setDemoEssay(
        `In my recent role at ${profile.experiences?.[0]?.company || 'Veloce Cloud Systems'} as a ${profile.experiences?.[0]?.role || 'Senior Software Engineer'}, I architected high-scale distributed microservices and spearheaded performance optimizations that cut latency by 42%. When our core service experienced unexpected burst loads, I conducted root-cause distributed tracing and refactored our caching tier with strict backpressure handling, achieving 99.99% uptime. I am eager to apply this rigorous engineering approach to your team's mission.`
      );
      setIsDemoAiGenerating(false);
    }, 600);
  };

  const handleResetDemo = () => {
    setDemoName('');
    setDemoEmail('');
    setDemoPhone('');
    setDemoLinkedin('');
    setDemoGithub('');
    setDemoCompany('');
    setDemoRole('');
    setDemoWorkAuth('');
    setDemoSponsorship('');
    setDemoEssay('');
    setDemoFilledCount(null);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4 border border-emerald-500/30">
            <Puzzle className="w-3.5 h-3.5" />
            <span>Companion Chrome Extension (Manifest V3)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            In-Tab Job Application Autofill &amp; AI Copilot
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Work directly from the same tab as your job applications on <strong className="text-white">Workday, Greenhouse, Lever, Ashby, and LinkedIn</strong>. 
            The extension adds a floating copilot button to the corner of any application page to autofill form fields in one click and draft customized essay responses using your configured LLM ({llmConfig.backend.toUpperCase()}).
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadExtension}
              disabled={isDownloading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/30 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Bundling Extension...' : 'Download Extension (.zip)'}</span>
            </button>

            <button
              onClick={handleSyncToExtension}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm flex items-center space-x-2 transition-all"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Sync Vault to Extension</span>
            </button>

            <button
              onClick={handleCopyBookmarklet}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm flex items-center space-x-2 transition-all"
              title="Copy instant JavaScript bookmarklet to drag onto bookmarks bar"
            >
              <Bookmark className="w-4 h-4 text-blue-400" />
              <span>{copiedBookmarklet ? 'Bookmarklet Copied!' : 'Copy Zero-Install Bookmarklet'}</span>
            </button>
          </div>

          {downloadSuccess && (
            <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Extension Package Ready!</strong> Unzip the downloaded file and load it in <code>chrome://extensions</code> using the instructions below.
              </span>
            </div>
          )}

          {syncStatus && (
            <div className="mt-4 p-3 bg-blue-950/60 border border-blue-500/40 rounded-xl text-blue-200 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* 30-Second Setup Guide */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-slate-700" />
          <span>30-Second Setup in Google Chrome (or Brave / Edge / Arc)</span>
        </h2>
        <p className="text-slate-500 text-xs mb-6">
          Since OpenSimplify is 100% open-source and respects your privacy, you load it directly from source without any tracking or store gatekeeping.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Download &amp; Unzip</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Click <strong>"Download Extension (.zip)"</strong> above. Extract the archive into a folder on your computer.
              </p>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-3">Pre-configured with your profile</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Open Extensions</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                In Chrome, open a new tab and paste:
                <code className="block mt-1 bg-white p-1.5 rounded border border-slate-200 text-slate-800 text-[11px] select-all font-mono">
                  chrome://extensions
                </code>
              </p>
            </div>
            <span className="text-[11px] text-slate-500 mt-3">Or go to Menu &gt; Extensions &gt; Manage</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Developer Mode</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Turn on the <strong>"Developer mode"</strong> toggle switch in the top-right corner of the extensions page.
              </p>
            </div>
            <span className="text-[11px] text-slate-500 mt-3">Enables unpacked extension loading</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                4
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Load Unpacked</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Click <strong>"Load unpacked"</strong> at top-left and select the extracted <code>opensimplify-extension</code> folder.
              </p>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-3">Ready to autofill on any job tab!</span>
          </div>
        </div>
      </div>

      {/* Supported Platforms */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Supported ATS Job Portals &amp; Platforms</h3>
            <p className="text-xs text-slate-500">Native event simulation ensures React and Vue controlled forms register field values</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
            Universal DOM Mapping
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { name: 'Workday', desc: 'myworkdayjobs.com', tag: 'Full Support' },
            { name: 'Greenhouse', desc: 'boards.greenhouse.io', tag: 'Full Support' },
            { name: 'Lever', desc: 'jobs.lever.co', tag: 'Full Support' },
            { name: 'Ashby', desc: 'jobs.ashbyhq.com', tag: 'Full Support' },
            { name: 'LinkedIn', desc: 'Easy Apply modals', tag: 'Full Support' },
            { name: 'General ATS', desc: 'Taleo, Bamboo, iCIMS', tag: 'Standard Forms' }
          ].map((item, i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
              <p className="font-bold text-xs text-slate-900">{item.name}</p>
              <p className="text-[10px] text-slate-500 truncate mb-1">{item.desc}</p>
              <span className="inline-block text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive In-Tab Copilot Simulator / Test Sandbox */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Live In-Tab Copilot Test Sandbox</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Test how the extension autofills application fields and drafts AI essays in the same tab.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunDemoAutofill}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate In-Tab Autofill</span>
            </button>

            <button
              onClick={handleResetDemo}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-all border border-slate-700"
            >
              Clear Form
            </button>
          </div>
        </div>

        {demoFilledCount !== null && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Successfully simulated filling {demoFilledCount} fields matching your active profile!</span>
            </div>
            <span className="font-mono text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
              Profile: {profile.fullName}
            </span>
          </div>
        )}

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulated Job Application Form (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Simulated Job Application</span>
              <h3 className="text-base font-bold text-slate-900">Senior Staff Software Engineer - Platform</h3>
              <p className="text-xs text-slate-500">Stripe / Acme Corp • San Francisco, CA (Remote Friendly)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  placeholder="First and last name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={demoPhone}
                  onChange={(e) => setDemoPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  value={demoLinkedin}
                  onChange={(e) => setDemoLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub / Code Portfolio</label>
                <input
                  type="url"
                  value={demoGithub}
                  onChange={(e) => setDemoGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Company &amp; Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={demoCompany}
                    onChange={(e) => setDemoCompany(e.target.value)}
                    placeholder="Company"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                  />
                  <input
                    type="text"
                    value={demoRole}
                    onChange={(e) => setDemoRole(e.target.value)}
                    placeholder="Role"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            {/* Work Authorization Radios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Are you legally authorized to work in the US?
                </label>
                <div className="flex items-center space-x-4 text-xs text-slate-700">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="demo_auth"
                      checked={demoWorkAuth === 'yes'}
                      onChange={() => setDemoWorkAuth('yes')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="demo_auth"
                      checked={demoWorkAuth === 'no'}
                      onChange={() => setDemoWorkAuth('no')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Will you now or in the future require visa sponsorship?
                </label>
                <div className="flex items-center space-x-4 text-xs text-slate-700">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="demo_sponsor"
                      checked={demoSponsorship === 'yes'}
                      onChange={() => setDemoSponsorship('yes')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="demo_sponsor"
                      checked={demoSponsorship === 'no'}
                      onChange={() => setDemoSponsorship('no')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Custom Question Textarea with In-Tab AI Solver */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Custom Question: Describe a challenging engineering project and how you solved it.
                </label>
                <button
                  type="button"
                  onClick={handleDemoAiGenerate}
                  disabled={isDemoAiGenerating}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 rounded-md border border-emerald-200 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isDemoAiGenerating ? 'Drafting with LLM...' : 'Draft with In-Tab AI'}</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={demoEssay}
                onChange={(e) => setDemoEssay(e.target.value)}
                placeholder="The in-tab extension detects this question and drafts a tailored STAR-method response using your profile and configured LLM..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Floating Widget In-Tab Preview (1 col) */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 flex flex-col justify-between border border-slate-800">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-xs text-white">In-Tab Floating Copilot</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  {llmConfig.backend.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                When you visit an application tab on Chrome, this discreet drawer floats in the bottom right corner of the page:
              </p>

              <div className="space-y-3">
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center">
                  <button
                    onClick={handleRunDemoAutofill}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-md flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Autofill This Application</span>
                  </button>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Fills standard inputs and dispatches native React DOM events.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-200 block mb-1.5">Quick Copy Vault</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => navigator.clipboard.writeText(profile.linkedinUrl)}
                      className="text-[10px] p-1.5 bg-slate-900 hover:bg-slate-700 rounded text-slate-300 text-left truncate flex items-center justify-between border border-slate-700"
                    >
                      <span>LinkedIn</span>
                      <Copy className="w-2.5 h-2.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(profile.githubUrl)}
                      className="text-[10px] p-1.5 bg-slate-900 hover:bg-slate-700 rounded text-slate-300 text-left truncate flex items-center justify-between border border-slate-700"
                    >
                      <span>GitHub</span>
                      <Copy className="w-2.5 h-2.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(profile.portfolioUrl)}
                      className="text-[10px] p-1.5 bg-slate-900 hover:bg-slate-700 rounded text-slate-300 text-left truncate flex items-center justify-between border border-slate-700"
                    >
                      <span>Portfolio</span>
                      <Copy className="w-2.5 h-2.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(profile.phone)}
                      className="text-[10px] p-1.5 bg-slate-900 hover:bg-slate-700 rounded text-slate-300 text-left truncate flex items-center justify-between border border-slate-700"
                    >
                      <span>Phone</span>
                      <Copy className="w-2.5 h-2.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Zero-Telemetry</span>
              </span>
              <span>OpenSimplify v1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
