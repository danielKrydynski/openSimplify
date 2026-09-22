import React, { useState } from 'react';
import { FileText, Sparkles, Check, Copy, Download, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Eye, BookOpen } from 'lucide-react';
import { UserProfile, LLMConfig, TailoredResumeResult } from '../types';
import { LLMService } from '../services/llmService';
import { StorageService } from '../services/storageService';

interface ResumeTailorViewProps {
  profile: UserProfile;
  llmConfig: LLMConfig;
}

const SAMPLE_JOB_DESCRIPTION = `Stripe - Staff / Senior Full-Stack Engineer, Infrastructure & Core Developer Experience

About the Role:
We are looking for an experienced Senior/Staff Full-Stack Engineer to build reliable, high-throughput developer platforms and core microservices. You will architect distributed systems handling millions of financial events while delivering world-class frontend dashboards with sub-second responsiveness.

Key Responsibilities:
- Design and scale distributed event pipelines with high availability, sub-100ms latency, and strict consistency.
- Modernize web dashboard infrastructure using TypeScript, React, Next.js, and edge computing paradigms.
- Optimize high-scale relational databases (PostgreSQL) and event streams (Kafka).
- Collaborate across cross-functional infrastructure teams and champion CI/CD resilience and observability.

Qualifications:
- 5+ years building complex production software in TypeScript, Go, or Python.
- Proven experience with distributed messaging systems (Kafka, RabbitMQ) and relational datastores (PostgreSQL).
- Deep expertise in modern frontend state management, React performance optimization, and Web vitals.
- Strong grounding in system design, microservices, and Docker/Kubernetes container orchestration.`;

export const ResumeTailorView: React.FC<ResumeTailorViewProps> = ({ profile, llmConfig }) => {
  const [targetCompany, setTargetCompany] = useState('Stripe');
  const [targetRole, setTargetRole] = useState('Senior Full-Stack Engineer, Core Infrastructure');
  const [jobDescription, setJobDescription] = useState(SAMPLE_JOB_DESCRIPTION);
  const [isTailoring, setIsTailoring] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'diff' | 'preview'>('diff');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedFullResume, setCopiedFullResume] = useState(false);

  // Saved/active tailored result
  const [tailoredResult, setTailoredResult] = useState<TailoredResumeResult | null>(() => {
    const saved = StorageService.getTailoredResumes();
    return saved.length > 0 ? saved[0] : null;
  });

  const handleTailorResume = async () => {
    if (!jobDescription.trim()) return;
    setIsTailoring(true);

    try {
      const result = await LLMService.tailorResume(
        llmConfig,
        profile,
        targetRole,
        targetCompany,
        jobDescription
      );
      setTailoredResult(result);
    } catch (err) {
      console.error('Failed to tailor resume:', err);
    } finally {
      setIsTailoring(false);
    }
  };

  const handleLoadSampleJD = () => {
    setTargetCompany('Stripe');
    setTargetRole('Senior Full-Stack Engineer, Core Infrastructure');
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
  };

  const generateMarkdownResume = (result: TailoredResumeResult): string => {
    const lines: string[] = [];
    lines.push(`# ${profile.fullName}`);
    lines.push(`${profile.email} | ${profile.phone} | ${profile.location}`);
    lines.push(`${profile.linkedinUrl} | ${profile.githubUrl} | ${profile.portfolioUrl}`);
    lines.push('');
    lines.push('## PROFESSIONAL SUMMARY');
    lines.push(result.tailoredSummary);
    lines.push('');
    lines.push('## CORE COMPETENCIES & SKILLS');
    lines.push(`**Key Skills:** ${result.suggestedTopSkills.join(' • ')}`);
    lines.push(`**Languages:** ${profile.skills.languages.join(', ')}`);
    lines.push(`**Frameworks & Web:** ${profile.skills.frameworks.join(', ')}`);
    lines.push(`**Infrastructure & Cloud:** ${profile.skills.toolsAndCloud.join(', ')}`);
    lines.push('');
    lines.push('## WORK EXPERIENCE');

    result.tailoredExperiences.forEach(exp => {
      const originalExp = profile.experiences.find(e => e.id === exp.experienceId);
      const dates = originalExp ? `${originalExp.startDate} - ${originalExp.endDate}` : '';
      const loc = originalExp ? ` | ${originalExp.location}` : '';
      lines.push(`### ${exp.role} — ${exp.company}${loc}`);
      lines.push(`*${dates}*`);
      lines.push('');
      exp.bulletDiffs.forEach(b => {
        lines.push(`- ${b.tailored}`);
      });
      lines.push('');
    });

    lines.push('## EDUCATION');
    profile.education.forEach(edu => {
      lines.push(`### ${edu.degree} — ${edu.school} (${edu.graduationYear})`);
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}${edu.honors ? ` • ${edu.honors}` : ''}`);
    });

    return lines.join('\n');
  };

  const handleCopyFullResume = () => {
    if (!tailoredResult) return;
    const text = generateMarkdownResume(tailoredResult);
    navigator.clipboard.writeText(text);
    setCopiedFullResume(true);
    setTimeout(() => setCopiedFullResume(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!tailoredResult) return;
    const text = generateMarkdownResume(tailoredResult);
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.fullName.replace(/\s+/g, '_')}_Tailored_Resume_${targetCompany}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    if (!tailoredResult) return;
    navigator.clipboard.writeText(tailoredResult.tailoredSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
              <FileText className="w-5 h-5 text-emerald-600 mr-2" />
              ATS Resume Tailoring Engine
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Analyze target job descriptions, calculate ATS keyword gaps, and rewrite experience bullets using high-impact STAR / XYZ metrics.
            </p>
          </div>
          <button
            id="btn-load-sample-jd"
            onClick={handleLoadSampleJD}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center self-start"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Load Sample Job Posting
          </button>
        </div>
      </div>

      {/* Inputs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Description & Target Info */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <Sparkles className="w-4 h-4 text-emerald-500 mr-1.5" />
            Target Job Posting Details
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name
              </label>
              <input
                id="input-tailor-company"
                type="text"
                value={targetCompany}
                onChange={e => setTargetCompany(e.target.value)}
                placeholder="e.g. Stripe"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Role Title
              </label>
              <input
                id="input-tailor-role"
                type="text"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Full-Stack Engineer"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paste Job Description
              </label>
              <textarea
                id="textarea-job-description"
                rows={9}
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the requirements, qualifications, and responsibilities here..."
                className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
              />
            </div>

            <button
              id="btn-run-tailor"
              onClick={handleTailorResume}
              disabled={isTailoring || !jobDescription.trim()}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 shadow-xs"
            >
              {isTailoring ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin text-emerald-400" />
                  Tailoring with {llmConfig.backend.toUpperCase()}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-400" />
                  Tailor Resume to Job
                </>
              )}
            </button>

            <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 border border-slate-200">
              💡 <strong>Privacy Guarantee:</strong> This optimization executes locally on your configured LLM ({llmConfig.backend}). None of your resume credentials leave your device.
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Tailoring Analysis & Comparison */}
        <div className="lg:col-span-2 space-y-6">
          {tailoredResult ? (
            <div className="space-y-6">
              {/* ATS Score & Keyword Match Card */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {/* Visual Score Ring */}
                    <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-full bg-emerald-50 border-4 border-emerald-500 text-emerald-900 font-extrabold text-lg">
                      {tailoredResult.atsMatchScore}%
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                          ATS Match Rating: Strong Fit
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {tailoredResult.targetJobTitle} @ {tailoredResult.targetCompany}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 max-w-xl">
                        {tailoredResult.atsScoreExplanation}
                      </p>
                    </div>
                  </div>

                  {/* Export Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      id="btn-copy-full-resume"
                      onClick={handleCopyFullResume}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center"
                    >
                      {copiedFullResume ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                      {copiedFullResume ? 'Copied!' : 'Copy Markdown'}
                    </button>
                    <button
                      id="btn-download-resume"
                      onClick={handleDownloadMarkdown}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Export .md
                    </button>
                  </div>
                </div>

                {/* Keyword Analysis Tags */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-700 flex items-center mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                      Matched ATS Keywords ({tailoredResult.matchedKeywords.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tailoredResult.matchedKeywords.map((kw, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-700 flex items-center mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 mr-1" />
                      Identified Skill Gaps to Address
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tailoredResult.missingKeywords.map((kw, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

                {/* Tailored Summary */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Tailored Professional Summary (Positioned for {tailoredResult.targetCompany})
                  </h3>
                  <button
                    id="btn-copy-tailored-summary"
                    onClick={handleCopySummary}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center"
                  >
                    {copiedSummary ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copiedSummary ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {tailoredResult.tailoredSummary}
                </div>
                {tailoredResult.customPitchSnippet && (
                  <div className="text-xs text-slate-500 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50">
                    <strong>Elevator Pitch Snippet:</strong> &ldquo;{tailoredResult.customPitchSnippet}&rdquo;
                  </div>
                )}
              </div>

              {/* Subtabs: Side-by-Side Diff vs Formatted Preview */}
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <button
                  id="tab-view-diff"
                  onClick={() => setActiveSubTab('diff')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    activeSubTab === 'diff'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  Side-by-Side Bullet Optimization Diff
                </button>
                <button
                  id="tab-view-preview"
                  onClick={() => setActiveSubTab('preview')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center ${
                    activeSubTab === 'preview'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Full Formatted Document Preview
                </button>
              </div>

              {/* Subtab 1: Side by Side Diff */}
              {activeSubTab === 'diff' ? (
                <div className="space-y-4">
                  {tailoredResult.tailoredExperiences.map(exp => (
                    <div key={exp.experienceId} className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {exp.role} • {exp.company}
                          </h4>
                          <span className="text-xs text-slate-500">
                            STAR method revisions with quantified impact
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {exp.bulletDiffs.map((diff, i) => (
                          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                            {/* Original */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Original Resume Bullet
                              </span>
                              <p className="text-slate-600 leading-relaxed">
                                {diff.original}
                              </p>
                            </div>

                            {/* Tailored */}
                            <div className="space-y-1 md:border-l md:border-slate-200 md:pl-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center">
                                  <Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
                                  Tailored with Impact Metrics
                                </span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  {diff.impactScoreChange}
                                </span>
                              </div>
                              <p className="text-slate-900 font-medium leading-relaxed">
                                {diff.tailored}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Subtab 2: Full Document Formatted View */
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs font-serif text-slate-800 space-y-5">
                  <div className="text-center border-b border-slate-200 pb-4">
                    <h2 className="text-xl font-bold font-sans tracking-tight text-slate-900">
                      {profile.fullName}
                    </h2>
                    <p className="text-xs font-sans text-slate-600 mt-1">
                      {profile.email} • {profile.phone} • {profile.location}
                    </p>
                    <p className="text-xs font-sans text-slate-500 mt-0.5">
                      {profile.linkedinUrl} • {profile.githubUrl}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold font-sans uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2">
                      Professional Summary
                    </h3>
                    <p className="text-xs font-sans text-slate-700 leading-relaxed">
                      {tailoredResult.tailoredSummary}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold font-sans uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2">
                      Core Technical Skills
                    </h3>
                    <p className="text-xs font-sans text-slate-700">
                      <strong>Target Competencies:</strong> {tailoredResult.suggestedTopSkills.join(' • ')}
                    </p>
                    <p className="text-xs font-sans text-slate-700 mt-1">
                      <strong>Languages &amp; Tools:</strong> {profile.skills.languages.concat(profile.skills.frameworks).join(', ')}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold font-sans uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-3">
                      Experience
                    </h3>
                    <div className="space-y-4">
                      {tailoredResult.tailoredExperiences.map(exp => (
                        <div key={exp.experienceId} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-sans">
                            <span className="font-bold text-slate-900">{exp.role}</span>
                            <span className="font-semibold text-slate-700">{exp.company}</span>
                          </div>
                          <ul className="list-disc list-inside text-xs font-sans text-slate-700 space-y-1 pl-1">
                            {exp.bulletDiffs.map((b, i) => (
                              <li key={i} className="leading-relaxed">
                                {b.tailored}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Ready to Tailor Your Resume
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Paste the job description on the left or click &ldquo;Load Sample Job Posting&rdquo; to analyze ATS keywords and optimize your experience bullets with your local LLM.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
