import React, { useState } from 'react';
import { UserCheck, ShieldCheck, Download, Upload, Plus, Trash2, Check, RefreshCw, Briefcase, GraduationCap, Code2, Globe } from 'lucide-react';
import { UserProfile, WorkExperience, Education } from '../types';
import { StorageService, SAMPLE_PROFILE } from '../services/storageService';

interface ProfileVaultViewProps {
  profile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
}

export const ProfileVaultView: React.FC<ProfileVaultViewProps> = ({ profile, onProfileUpdated }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saveNotice, setSaveNotice] = useState(false);
  const [activeTab, setActiveTab] = useState<'basics' | 'experience' | 'skills' | 'authorization'>('basics');

  const handleSave = () => {
    StorageService.saveProfile(formData);
    onProfileUpdated(formData);
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 2500);
  };

  const handleLoadSample = () => {
    setFormData(SAMPLE_PROFILE);
    StorageService.saveProfile(SAMPLE_PROFILE);
    onProfileUpdated(SAMPLE_PROFILE);
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 2500);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidate_profile_vault_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setFormData(parsed);
        StorageService.saveProfile(parsed);
        onProfileUpdated(parsed);
        setSaveNotice(true);
        setTimeout(() => setSaveNotice(false), 2500);
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  // Experience Bullet helpers
  const handleUpdateBullet = (expId: string, bulletIdx: number, val: string) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp => {
        if (exp.id !== expId) return exp;
        const newBullets = [...exp.bullets];
        newBullets[bulletIdx] = val;
        return { ...exp, bullets: newBullets };
      })
    }));
  };

  const handleAddBullet = (expId: string) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp => {
        if (exp.id !== expId) return exp;
        return { ...exp, bullets: [...exp.bullets, ''] };
      })
    }));
  };

  const handleDeleteBullet = (expId: string, bulletIdx: number) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp => {
        if (exp.id !== expId) return exp;
        return { ...exp, bullets: exp.bullets.filter((_, idx) => idx !== bulletIdx) };
      })
    }));
  };

  const handleAddExperience = () => {
    const newExp: WorkExperience = {
      id: 'exp-' + Date.now(),
      company: 'New Company',
      role: 'Software Engineer',
      location: 'Remote',
      startDate: '2023-01',
      endDate: 'Present',
      current: true,
      bullets: ['Led development of core features delivering measurable impact.'],
      technologies: ['TypeScript', 'React', 'Node.js']
    };
    setFormData(prev => ({ ...prev, experiences: [newExp, ...prev.experiences] }));
  };

  const handleDeleteExperience = (expId: string) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.filter(e => e.id !== expId)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Actions */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
                <UserCheck className="w-5 h-5 text-emerald-600 mr-2" />
                Candidate Profile &amp; Privacy Vault
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Zero Cloud Storage
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Your master resume details are stored 100% locally in your browser. Used by your local LLM to generate custom application responses and tailor ATS resumes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-load-sample-profile"
              onClick={handleLoadSample}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Load Sample Profile
            </button>

            <button
              id="btn-export-profile-json"
              onClick={handleExportJSON}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Export Vault JSON
            </button>

            <label className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center cursor-pointer">
              <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Import JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>

            <button
              id="btn-save-profile"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center shadow-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Save Changes
            </button>
          </div>
        </div>

        {saveNotice && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center">
            <Check className="w-4 h-4 mr-2 text-emerald-600" />
            Profile vault successfully saved to local browser storage!
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 pb-2">
        {[
          { id: 'basics', label: 'Contact & Basics', icon: Globe },
          { id: 'experience', label: 'Work Experience', icon: Briefcase },
          { id: 'skills', label: 'Skills & Education', icon: Code2 },
          { id: 'authorization', label: 'Work Authorization & EEO', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`tab-profile-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 mr-1.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Basics & Contact */}
      {activeTab === 'basics' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900">Personal &amp; Online Presence</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn URL</label>
              <input
                type="text"
                value={formData.linkedinUrl}
                onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub URL</label>
              <input
                type="text"
                value={formData.githubUrl}
                onChange={e => setFormData({ ...formData, githubUrl: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Headline</label>
            <input
              type="text"
              value={formData.headline}
              onChange={e => setFormData({ ...formData, headline: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Master Summary Pitch</label>
            <textarea
              rows={4}
              value={formData.summary}
              onChange={e => setFormData({ ...formData, summary: e.target.value })}
              className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Work Experience */}
      {activeTab === 'experience' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Work Experience History</h2>
            <button
              id="btn-add-experience"
              onClick={handleAddExperience}
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Experience
            </button>
          </div>

          {formData.experiences.map(exp => (
            <div key={exp.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full mr-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          experiences: prev.experiences.map(item => item.id === exp.id ? { ...item, company: val } : item)
                        }));
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Job Title / Role</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          experiences: prev.experiences.map(item => item.id === exp.id ? { ...item, role: val } : item)
                        }));
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Start Date</label>
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          experiences: prev.experiences.map(item => item.id === exp.id ? { ...item, startDate: val } : item)
                        }));
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">End Date</label>
                    <input
                      type="text"
                      value={exp.endDate}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          experiences: prev.experiences.map(item => item.id === exp.id ? { ...item, endDate: val } : item)
                        }));
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteExperience(exp.id)}
                  title="Remove this role"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bullet Points Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Accomplishment Bullets (STAR formula)</span>
                  <button
                    onClick={() => handleAddBullet(exp.id)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Bullet
                  </button>
                </div>

                {exp.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-center space-x-2">
                    <span className="text-slate-400 text-xs">•</span>
                    <input
                      type="text"
                      value={bullet}
                      onChange={e => handleUpdateBullet(exp.id, bIdx, e.target.value)}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <button
                      onClick={() => handleDeleteBullet(exp.id, bIdx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Skills & Education */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Technical Skills Categories</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Programming Languages (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.skills.languages.join(', ')}
                  onChange={e => setFormData({
                    ...formData,
                    skills: { ...formData.skills, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                  })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Frameworks &amp; Libraries (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.skills.frameworks.join(', ')}
                  onChange={e => setFormData({
                    ...formData,
                    skills: { ...formData.skills, frameworks: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                  })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tools, Cloud &amp; Datastores (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.skills.toolsAndCloud.join(', ')}
                  onChange={e => setFormData({
                    ...formData,
                    skills: { ...formData.skills, toolsAndCloud: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                  })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Methodologies &amp; Architectural Concepts
                </label>
                <input
                  type="text"
                  value={formData.skills.methodologies.join(', ')}
                  onChange={e => setFormData({
                    ...formData,
                    skills: { ...formData.skills, methodologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                  })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Education */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <GraduationCap className="w-4 h-4 text-slate-700 mr-2" />
              Education History
            </h2>

            {formData.education.map(edu => (
              <div key={edu.id} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">School / University</label>
                  <input
                    type="text"
                    value={edu.school}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        education: prev.education.map(item => item.id === edu.id ? { ...item, school: val } : item)
                      }));
                    }}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        education: prev.education.map(item => item.id === edu.id ? { ...item, degree: val } : item)
                      }));
                    }}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Field of Study</label>
                  <input
                    type="text"
                    value={edu.fieldOfStudy}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        education: prev.education.map(item => item.id === edu.id ? { ...item, fieldOfStudy: val } : item)
                      }));
                    }}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Graduation Year</label>
                  <input
                    type="text"
                    value={edu.graduationYear}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        education: prev.education.map(item => item.id === edu.id ? { ...item, graduationYear: val } : item)
                      }));
                    }}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Work Authorization & EEO */}
      {activeTab === 'authorization' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Work Authorization &amp; Preferences</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These fields power instant auto-filling for standard Workday, Greenhouse, and Lever eligibility questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800 block">Work Eligibility Checks</span>

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.authorization.authorizedInUS}
                  onChange={e => setFormData({
                    ...formData,
                    authorization: { ...formData.authorization, authorizedInUS: e.target.checked }
                  })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>Legally authorized to work in the United States</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.authorization.requiresSponsorshipNow}
                  onChange={e => setFormData({
                    ...formData,
                    authorization: { ...formData.authorization, requiresSponsorshipNow: e.target.checked }
                  })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>Require visa sponsorship currently (e.g. H-1B transfer, O-1)</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.authorization.requiresSponsorshipFuture}
                  onChange={e => setFormData({
                    ...formData,
                    authorization: { ...formData.authorization, requiresSponsorshipFuture: e.target.checked }
                  })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>Will require visa sponsorship in the future</span>
              </label>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800 block">Compensation &amp; Notice</span>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notice Period</label>
                <input
                  type="text"
                  value={formData.preferences.noticePeriod}
                  onChange={e => setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, noticePeriod: e.target.value }
                  })}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Salary Range</label>
                <input
                  type="text"
                  value={formData.preferences.targetSalary}
                  onChange={e => setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, targetSalary: e.target.value }
                  })}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
