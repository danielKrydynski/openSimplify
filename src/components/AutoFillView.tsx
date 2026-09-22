import React, { useState } from 'react';
import { Sparkles, Copy, Check, Sliders, Building2, Briefcase, Plus, Trash2, BookmarkPlus, Zap, Puzzle } from 'lucide-react';
import { UserProfile, LLMConfig, FormFieldAnswer, JobApplicationTrackerItem } from '../types';
import { LLMService } from '../services/llmService';
import { StorageService } from '../services/storageService';

interface AutoFillViewProps {
  profile: UserProfile;
  llmConfig: LLMConfig;
  onApplicationSaved?: (app: JobApplicationTrackerItem) => void;
  onNavigateToExtension?: () => void;
}

const PRESET_QUESTIONS: { label: string; question: string; category: FormFieldAnswer['category']; defaultTone: FormFieldAnswer['tone'] }[] = [
  {
    label: 'Why this Company?',
    question: 'Why are you interested in joining our company, and what unique contributions will you bring to the team?',
    category: 'behavioral',
    defaultTone: 'confident'
  },
  {
    label: 'Technical Challenge (STAR)',
    question: 'Describe a significant technical challenge or bottleneck you encountered, your solution, and the measurable outcome.',
    category: 'technical',
    defaultTone: 'technical'
  },
  {
    label: 'Tell Me About Yourself',
    question: 'Tell us about yourself and why your background makes you an ideal fit for this role.',
    category: 'personal',
    defaultTone: 'balanced'
  },
  {
    label: 'Work Authorization & Sponsorship',
    question: 'Are you legally authorized to work in the country of employment, and will you require visa sponsorship now or in the future?',
    category: 'authorization',
    defaultTone: 'concise'
  },
  {
    label: 'Salary Expectations',
    question: 'What are your target compensation and salary expectations for this position?',
    category: 'compensation',
    defaultTone: 'concise'
  },
  {
    label: 'Leadership & Conflict',
    question: 'Tell us about a time you had a technical disagreement with a colleague or stakeholder and how you resolved it constructively.',
    category: 'behavioral',
    defaultTone: 'balanced'
  }
];

export const AutoFillView: React.FC<AutoFillViewProps> = ({ profile, llmConfig, onApplicationSaved, onNavigateToExtension }) => {
  const [targetCompany, setTargetCompany] = useState('Vercel');
  const [targetRole, setTargetRole] = useState('Senior Full-Stack Engineer');
  const [customQuestion, setCustomQuestion] = useState('');
  const [tone, setTone] = useState<FormFieldAnswer['tone']>('confident');
  const [wordLimit, setWordLimit] = useState<number>(150);

  // Active question answers
  const [answersList, setAnswersList] = useState<FormFieldAnswer[]>([
    {
      id: 'ans-init-1',
      fieldName: 'Why are you interested in this role?',
      category: 'behavioral',
      questionPrompt: 'Why are you interested in joining our company and how does your background align with this role?',
      targetRole: 'Senior Full-Stack Engineer',
      companyContext: 'Vercel',
      tone: 'confident',
      wordLimit: 150,
      answer: `I have closely followed Vercel's mission to push the web forward with lightning-fast frontend tooling and edge architectures. Throughout my career at Veloce Cloud Systems and Apex Data Labs, I specialized in architecting high-throughput distributed microservices and reactive interfaces in TypeScript and React. In my current role, I led our frontend migration to modern edge-first paradigms, reducing First Contentful Paint by 42% while scaling event streaming for 45M+ daily requests. I am eager to bring my obsession with developer experience, runtime performance, and system resilience to Vercel's product engineering team.`,
      status: 'completed',
      isCopied: false
    }
  ]);

  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [copiedQuickField, setCopiedQuickField] = useState<string | null>(null);
  const [batchRawInput, setBatchRawInput] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setAnswersList(prev =>
      prev.map(item => (item.id === id ? { ...item, isCopied: true } : item))
    );
    setTimeout(() => {
      setAnswersList(prev =>
        prev.map(item => (item.id === id ? { ...item, isCopied: false } : item))
      );
    }, 2000);
  };

  const handleCopyQuickField = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuickField(fieldKey);
    setTimeout(() => setCopiedQuickField(null), 1800);
  };

  const handleGenerateSingle = async (questionText: string, category: FormFieldAnswer['category'] = 'custom') => {
    if (!questionText.trim()) return;

    const newId = 'ans-' + Date.now();
    const newEntry: FormFieldAnswer = {
      id: newId,
      fieldName: questionText.slice(0, 50) + (questionText.length > 50 ? '...' : ''),
      category,
      questionPrompt: questionText,
      targetRole,
      companyContext: targetCompany,
      tone,
      wordLimit,
      answer: '',
      status: 'generating'
    };

    setAnswersList(prev => [newEntry, ...prev]);

    try {
      const generated = await LLMService.generateFormAnswer(llmConfig, profile, newEntry);
      setAnswersList(prev =>
        prev.map(item =>
          item.id === newId
            ? { ...item, answer: generated, status: 'completed' }
            : item
        )
      );
    } catch (err: any) {
      setAnswersList(prev =>
        prev.map(item =>
          item.id === newId
            ? { ...item, error: err.message, status: 'error' }
            : item
        )
      );
    }
  };

  const handleRegenerate = async (id: string) => {
    const item = answersList.find(a => a.id === id);
    if (!item) return;

    setAnswersList(prev =>
      prev.map(a => (a.id === id ? { ...a, status: 'generating', error: undefined } : a))
    );

    try {
      const updatedAnswer = await LLMService.generateFormAnswer(llmConfig, profile, item);
      setAnswersList(prev =>
        prev.map(a => (a.id === id ? { ...a, answer: updatedAnswer, status: 'completed' } : a))
      );
    } catch (err: any) {
      setAnswersList(prev =>
        prev.map(a => (a.id === id ? { ...a, error: err.message, status: 'error' } : a))
      );
    }
  };

  const handleBatchParseAndGenerate = async () => {
    if (!batchRawInput.trim()) return;
    setIsGeneratingBatch(true);

    // Split input by newlines or question marks
    const lines = batchRawInput
      .split(/\n+/)
      .map(l => l.replace(/^(\d+[\.\)]|\-|\*)\s*/, '').trim())
      .filter(l => l.length > 8);

    setShowBatchModal(false);
    setBatchRawInput('');

    for (const q of lines) {
      await handleGenerateSingle(q);
    }
    setIsGeneratingBatch(false);
  };

  const handleDeleteAnswer = (id: string) => {
    setAnswersList(prev => prev.filter(a => a.id !== id));
  };

  const handleUpdateAnswerText = (id: string, text: string) => {
    setAnswersList(prev =>
      prev.map(a => (a.id === id ? { ...a, answer: text } : a))
    );
  };

  const handleSaveToTracker = () => {
    if (!targetCompany.trim()) return;
    const trackerItem: JobApplicationTrackerItem = {
      id: 'app-' + Date.now(),
      company: targetCompany,
      role: targetRole || 'Software Engineer',
      dateApplied: new Date().toISOString().split('T')[0],
      status: 'applied',
      notes: `Generated ${answersList.length} customized auto-fill answers using ${llmConfig.backend.toUpperCase()} (${llmConfig.model}).`,
      savedAnswersCount: answersList.length
    };

    StorageService.addApplication(trackerItem);
    if (onApplicationSaved) onApplicationSaved(trackerItem);

    setSaveSuccessNotice(`Saved ${targetCompany} (${targetRole}) to your Application Tracker!`);
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Company & Context Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
              <Sparkles className="w-5 h-5 text-emerald-600 mr-2" />
              Job Application AutoFill Assistant
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Auto-generate high-impact, authentic responses tailored to your target company using your local LLM with zero telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onNavigateToExtension && (
              <button
                id="btn-nav-extension"
                onClick={onNavigateToExtension}
                className="px-3.5 py-2 text-xs sm:text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center shadow-2xs"
              >
                <Puzzle className="w-4 h-4 mr-1.5 text-emerald-600" />
                <span>In-Tab Chrome Plugin</span>
              </button>
            )}

            <button
              id="btn-open-batch-autofill"
              onClick={() => setShowBatchModal(true)}
              className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center"
            >
              <Zap className="w-4 h-4 mr-1.5 text-amber-600" />
              Batch Form Filler
            </button>

            <button
              id="btn-save-to-tracker"
              onClick={handleSaveToTracker}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center shadow-xs"
            >
              <BookmarkPlus className="w-4 h-4 mr-1.5" />
              Save to Tracker
            </button>
          </div>
        </div>

        {saveSuccessNotice && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center">
            <Check className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
            {saveSuccessNotice}
          </div>
        )}

        {/* Target Context Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Target Company
            </label>
            <input
              id="input-target-company"
              type="text"
              value={targetCompany}
              onChange={e => setTargetCompany(e.target.value)}
              placeholder="e.g. Stripe, OpenAI, Linear"
              className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Target Role
            </label>
            <input
              id="input-target-role"
              type="text"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <Sliders className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Tone Style
            </label>
            <select
              id="select-answer-tone"
              value={tone}
              onChange={e => setTone(e.target.value as any)}
              className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white"
            >
              <option value="confident">Confident &amp; Impactful</option>
              <option value="balanced">Balanced &amp; Professional</option>
              <option value="technical">Technical &amp; Deep</option>
              <option value="concise">Concise &amp; Direct</option>
              <option value="executive">Executive &amp; Strategic</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Max Length Target: <span className="text-slate-900 font-bold">{wordLimit} words</span>
            </label>
            <input
              id="slider-word-limit"
              type="range"
              min="50"
              max="400"
              step="25"
              value={wordLimit}
              onChange={e => setWordLimit(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 mt-2"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Side Generator & Presets, Right Side Quick Auto-Paste Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Question Input & Answer Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Custom Question Box */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              Ask Any Form Question or Paste from Application
            </h2>
            <div className="relative">
              <textarea
                id="textarea-custom-question"
                rows={3}
                value={customQuestion}
                onChange={e => setCustomQuestion(e.target.value)}
                placeholder="e.g. Tell us about a time you resolved a major production incident under pressure, or Why should we hire you?"
                className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Engine: <strong className="text-slate-800">{llmConfig.backend.toUpperCase()}</strong> ({llmConfig.model})
              </span>
              <button
                id="btn-generate-custom-answer"
                onClick={() => {
                  handleGenerateSingle(customQuestion);
                  setCustomQuestion('');
                }}
                disabled={!customQuestion.trim() || isGeneratingBatch}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center disabled:opacity-50 shadow-xs"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-emerald-400" />
                Generate Answer
              </button>
            </div>

            {/* Quick Presets Chips */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block mb-2">
                Common Application Question Presets (1-Click Fill):
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_QUESTIONS.map((preset, i) => (
                  <button
                    key={i}
                    id={`btn-preset-question-${i}`}
                    onClick={() => handleGenerateSingle(preset.question, preset.category)}
                    className="text-xs px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors border border-slate-200 flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-1 text-slate-500" />
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Answers Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Generated Application Answers ({answersList.length})
              </h3>
              {answersList.length > 0 && (
                <button
                  id="btn-clear-answers"
                  onClick={() => setAnswersList([])}
                  className="text-xs text-slate-500 hover:text-rose-600 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {answersList.map(item => {
              const wordCount = item.answer ? item.answer.trim().split(/\s+/).filter(Boolean).length : 0;
              const isGenerating = item.status === 'generating';

              return (
                <div
                  key={item.id}
                  id={`answer-card-${item.id}`}
                  className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3 transition-all hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                        {item.companyContext && (
                          <span className="text-xs text-slate-500 font-medium">
                            for {item.companyContext}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                        {item.questionPrompt}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        id={`btn-regenerate-${item.id}`}
                        onClick={() => handleRegenerate(item.id)}
                        disabled={isGenerating}
                        title="Regenerate with local LLM"
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-40"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        id={`btn-delete-${item.id}`}
                        onClick={() => handleDeleteAnswer(item.id)}
                        title="Remove answer"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Answer Content */}
                  {isGenerating ? (
                    <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center space-x-3">
                      <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-slate-600 font-medium">
                        Crafting tailored response using {llmConfig.backend.toUpperCase()} ({llmConfig.model})...
                      </span>
                    </div>
                  ) : item.error ? (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                      Generation error: {item.error}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        id={`textarea-answer-${item.id}`}
                        rows={5}
                        value={item.answer}
                        onChange={e => handleUpdateAnswerText(item.id, e.target.value)}
                        className="w-full text-sm leading-relaxed p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
                      />

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>
                          {wordCount} words • {item.answer.length} characters
                        </span>

                        <button
                          id={`btn-copy-answer-${item.id}`}
                          onClick={() => handleCopy(item.answer, item.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center transition-all ${
                            item.isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                          }`}
                        >
                          {item.isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Copied to Clipboard!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 mr-1" />
                              Copy Answer
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Quick Auto-Fill Vault (Copy Any Profile Field with 1-Click) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Copy className="w-4 h-4 mr-1.5 text-slate-700" />
                Simplify Quick-Fill Vault
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any standard field below to copy straight into your job application form.
              </p>
            </div>

            {/* Quick Copy Field Rows */}
            <div className="space-y-2">
              {[
                { label: 'Full Legal Name', val: profile.fullName, key: 'name' },
                { label: 'Email Address', val: profile.email, key: 'email' },
                { label: 'Phone Number', val: profile.phone, key: 'phone' },
                { label: 'Location', val: profile.location, key: 'location' },
                { label: 'LinkedIn Profile', val: profile.linkedinUrl, key: 'linkedin' },
                { label: 'GitHub Profile', val: profile.githubUrl, key: 'github' },
                { label: 'Portfolio Website', val: profile.portfolioUrl, key: 'portfolio' },
                { label: 'Target Salary', val: profile.preferences.targetSalary, key: 'salary' },
                { label: 'Notice Period', val: profile.preferences.noticePeriod, key: 'notice' },
                {
                  label: 'Work Authorization',
                  val: profile.authorization.authorizedInUS
                    ? 'Legally authorized to work in the US. No sponsorship required.'
                    : 'Requires immigration sponsorship.',
                  key: 'auth'
                },
                { label: 'Clearance Level', val: profile.authorization.clearanceLevel || 'None', key: 'clearance' }
              ].map(field => (
                <button
                  key={field.key}
                  id={`btn-quick-fill-${field.key}`}
                  onClick={() => handleCopyQuickField(field.val, field.key)}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                >
                  <div className="truncate mr-2">
                    <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {field.label}
                    </span>
                    <span className="text-xs font-medium text-slate-900 truncate block">
                      {field.val || 'Not provided'}
                    </span>
                  </div>

                  <span className="shrink-0 p-1 rounded text-slate-400 group-hover:text-slate-800">
                    {copiedQuickField === field.key ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Candidate Experience Fast Reference */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-900">
              Target Candidate Highlights
            </h4>
            <div className="space-y-2 text-slate-600">
              <p>
                <strong>Current:</strong> {profile.experiences[0]?.role} @ {profile.experiences[0]?.company}
              </p>
              <p>
                <strong>Top Tech:</strong> {profile.skills.languages.slice(0, 4).join(', ')}
              </p>
              <p>
                <strong>Education:</strong> {profile.education[0]?.degree} ({profile.education[0]?.school})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Form Auto-Fill Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Zap className="w-5 h-5 text-amber-500 mr-2" />
                Batch Form Auto-Fill
              </h3>
              <button
                id="btn-close-batch-modal"
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Paste the entire block of questions from your application form (e.g. Workday, Greenhouse, Lever). Each line with a question will be generated simultaneously!
            </p>

            <textarea
              id="textarea-batch-input"
              rows={6}
              value={batchRawInput}
              onChange={e => setBatchRawInput(e.target.value)}
              placeholder="Why do you want to join our engineering team?&#10;What is your proudest technical achievement?&#10;Describe a time you dealt with ambiguity in a project.&#10;What are your salary expectations?"
              className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                id="btn-run-batch-generate"
                onClick={handleBatchParseAndGenerate}
                disabled={!batchRawInput.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50"
              >
                Auto-Answer All Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
