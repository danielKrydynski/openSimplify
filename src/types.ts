/**
 * Types for Local Job Autofill & Resume Tailor (Open-Source Simplify AI Alternative)
 */

export type LLMBackendType = 'ollama' | 'lmstudio' | 'vllm' | 'localai' | 'custom' | 'openrouter' | 'claude' | 'openai' | 'gemini';

export interface LLMModelMetadata {
  id: string;
  name?: string;
  contextLength?: number;
  isFree?: boolean;
  provider?: string;
  description?: string;
}

export interface LLMConfig {
  backend: LLMBackendType;
  endpointUrl: string;
  model: string;
  availableModels: string[];
  modelsMetadata?: LLMModelMetadata[];
  temperature: number;
  maxTokens: number;
  customHeaders?: Record<string, string>;
  mode: 'proxy' | 'direct'; // Server proxy (handles CORS/Mixed-Content) or Direct client-side fetch
  status: 'connected' | 'error' | 'testing' | 'idle';
  statusMessage?: string;
  latencyMs?: number;
  lastTested?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  technologies: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
  gpa?: string;
  honors?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  role?: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  bullets: string[];
}

export interface SkillCategories {
  languages: string[];
  frameworks: string[];
  toolsAndCloud: string[];
  methodologies: string[];
}

export interface WorkAuthorization {
  authorizedInUS: boolean;
  requiresSponsorshipNow: boolean;
  requiresSponsorshipFuture: boolean;
  authorizedInEU: boolean;
  authorizedInUK: boolean;
  authorizedInCanada: boolean;
  visaStatus: string;
  clearanceLevel: string;
}

export interface DemographicsEEO {
  veteranStatus: string;
  disabilityStatus: string;
  gender: string;
  raceEthnicity: string;
  hispanicOrLatino: string;
}

export interface JobPreferences {
  desiredTitles: string[];
  workType: ('Remote' | 'Hybrid' | 'On-site')[];
  minimumSalary: string;
  targetSalary: string;
  preferredLocations: string[];
  noticePeriod: string;
  openToRelocation: boolean;
}

export interface UserProfile {
  fullName: string;
  headline: string;
  summary: string;
  email: string;
  phone: string;
  location: string;
  portfolioUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  experiences: WorkExperience[];
  education: Education[];
  skills: SkillCategories;
  projects: Project[];
  authorization: WorkAuthorization;
  preferences: JobPreferences;
  demographics: DemographicsEEO;
}

export interface FormFieldAnswer {
  id: string;
  fieldName: string;
  category: 'personal' | 'experience' | 'education' | 'authorization' | 'behavioral' | 'technical' | 'compensation' | 'custom';
  questionPrompt: string;
  targetRole?: string;
  companyContext?: string;
  tone: 'concise' | 'balanced' | 'confident' | 'technical' | 'executive';
  wordLimit?: number;
  answer: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  error?: string;
  isCopied?: boolean;
}

export interface TailoredBulletDiff {
  original: string;
  tailored: string;
  impactScoreChange: string;
  highlightedKeywords: string[];
}

export interface TailoredRoleExperience {
  experienceId: string;
  company: string;
  role: string;
  bulletDiffs: TailoredBulletDiff[];
}

export interface TailoredResumeResult {
  id: string;
  createdAt: string;
  targetJobTitle: string;
  targetCompany: string;
  jobDescriptionText: string;
  atsMatchScore: number;
  atsScoreExplanation: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  tailoredSummary: string;
  tailoredExperiences: TailoredRoleExperience[];
  suggestedTopSkills: string[];
  customPitchSnippet: string;
}

export interface JobApplicationTrackerItem {
  id: string;
  company: string;
  role: string;
  location?: string;
  jobUrl?: string;
  dateApplied: string;
  status: 'drafting' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'archived';
  notes?: string;
  tailoredResumeId?: string;
  savedAnswersCount: number;
}

export interface PrivacyAuditData {
  totalGenerations: number;
  totalTokensEstimated: number;
  externalDataLeaksCount: 0; // Always 0 by architectural design
  localStorageSizeBytes: number;
  lastWipeDate?: string;
}
