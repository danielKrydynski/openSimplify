import { UserProfile, LLMConfig, TailoredResumeResult, JobApplicationTrackerItem, PrivacyAuditData } from '../types';

const STORAGE_KEY_PROFILE = 'open_simplify_user_profile_v1';
const STORAGE_KEY_LLM_CONFIG = 'open_simplify_llm_config_v1';
const STORAGE_KEY_RESUMES = 'open_simplify_tailored_resumes_v1';
const STORAGE_KEY_APPLICATIONS = 'open_simplify_applications_v1';
const STORAGE_KEY_AUDIT = 'open_simplify_privacy_audit_v1';

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  backend: 'ollama',
  endpointUrl: 'http://localhost:11434',
  model: 'llama3.2',
  availableModels: ['llama3.2', 'mistral', 'deepseek-r1:8b', 'qwen2.5:7b'],
  temperature: 0.7,
  maxTokens: 1500,
  mode: 'proxy', // Default to proxy for reliable mixed-content handling in web environments
  status: 'idle',
  statusMessage: 'Ready to connect'
};

export const SAMPLE_PROFILE: UserProfile = {
  fullName: 'Alex Morgan',
  headline: 'Senior Full-Stack Engineer | Distributed Systems & High-Scale React',
  summary: 'Senior Software Engineer with 6+ years building fault-tolerant distributed web services, high-throughput microservices, and reactive user interfaces. Passionate about developer tooling, real-time performance optimization, and privacy-first architectures.',
  email: 'alex.morgan.dev@gmail.com',
  phone: '+1 (415) 890-4210',
  location: 'San Francisco, CA (Open to Remote / Hybrid)',
  portfolioUrl: 'https://alexmorgan.dev',
  linkedinUrl: 'https://linkedin.com/in/alexmorgandev',
  githubUrl: 'https://github.com/alexmorgan-code',
  experiences: [
    {
      id: 'exp-1',
      company: 'Veloce Cloud Systems',
      role: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2022-04',
      endDate: 'Present',
      current: true,
      bullets: [
        'Architected a distributed event ingestion pipeline processing 45M+ daily events with sub-80ms p99 latency using Node.js, Go, and Kafka.',
        'Migrated core frontend dashboard from legacy Single Page Architecture to Next.js 14 and Tailwind, reducing First Contentful Paint by 42% and boosting mobile retention.',
        'Spearheaded internal microservices migration to Kubernetes, decreasing deployment failure rates from 8% to under 0.4%.',
        'Mentored 5 junior and mid-level engineers through weekly 1-on-1 code reviews, architectural whiteboarding sessions, and pair programming.'
      ],
      technologies: ['TypeScript', 'Node.js', 'Go', 'React', 'Kubernetes', 'Kafka', 'PostgreSQL', 'Docker']
    },
    {
      id: 'exp-2',
      company: 'Apex Data Labs',
      role: 'Full-Stack Software Engineer',
      location: 'Austin, TX (Remote)',
      startDate: '2019-06',
      endDate: '2022-03',
      current: false,
      bullets: [
        'Built real-time collaborative workspace canvas utilizing WebSockets and CRDTs, supporting 100+ concurrent live editors per room without conflict.',
        'Engineered automated SQL query optimizer middleware in TypeScript, reducing database query timeouts by 65% across 200k active tenants.',
        'Implemented strict zero-trust role-based access control (RBAC) and OAuth 2.0 PKCE authentication flow compliant with SOC-2 type II audit standards.'
      ],
      technologies: ['React', 'TypeScript', 'PostgreSQL', 'Redis', 'WebSockets', 'GraphQL', 'AWS']
    }
  ],
  education: [
    {
      id: 'edu-1',
      school: 'University of California, Berkeley',
      degree: 'B.S. in Computer Science',
      fieldOfStudy: 'Computer Science & Software Engineering',
      graduationYear: '2019',
      gpa: '3.82',
      honors: 'Dean\'s Honors List (6 semesters)'
    }
  ],
  skills: {
    languages: ['TypeScript', 'JavaScript (ES6+)', 'Go', 'Python', 'SQL', 'HTML5/CSS3'],
    frameworks: ['React', 'Next.js', 'Node.js', 'Express', 'Tailwind CSS', 'Vue.js', 'FastAPI'],
    toolsAndCloud: ['Docker', 'Kubernetes', 'AWS (ECS, S3, RDS)', 'Git/GitHub Actions', 'PostgreSQL', 'Redis', 'Kafka'],
    methodologies: ['System Design', 'CI/CD Pipelines', 'Microservices', 'Agile/Scrum', 'Test-Driven Development (Jest, Vitest)']
  },
  projects: [
    {
      id: 'proj-1',
      name: 'LocalFlow AI',
      description: 'Open-source local LLM orchestration framework for private document summarization and semantic search without cloud dependencies.',
      technologies: ['TypeScript', 'Ollama', 'Vector Embeddings', 'React'],
      githubUrl: 'https://github.com/alexmorgan-code/localflow-ai',
      bullets: [
        'Designed pure client-side embedding cache in IndexedDB reducing recurring query latencies by 90%.',
        'Garnered 1,200+ GitHub stars and active open-source community contributions.'
      ]
    }
  ],
  authorization: {
    authorizedInUS: true,
    requiresSponsorshipNow: false,
    requiresSponsorshipFuture: false,
    authorizedInEU: false,
    authorizedInUK: false,
    authorizedInCanada: true,
    visaStatus: 'US Citizen / Canadian Citizen (Dual)',
    clearanceLevel: 'None'
  },
  preferences: {
    desiredTitles: ['Senior Software Engineer', 'Full-Stack Tech Lead', 'Senior Frontend Engineer', 'Staff Engineer'],
    workType: ['Remote', 'Hybrid'],
    minimumSalary: '$165,000',
    targetSalary: '$190,000 - $215,000',
    preferredLocations: ['San Francisco, CA', 'Remote (US/Canada)', 'New York, NY'],
    noticePeriod: '2 weeks',
    openToRelocation: false
  },
  demographics: {
    veteranStatus: 'I am not a protected veteran',
    disabilityStatus: 'No, I do not have a disability',
    gender: 'Decline to self-identify',
    raceEthnicity: 'Decline to self-identify',
    hispanicOrLatino: 'No'
  }
};

export const StorageService = {
  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse stored profile:', e);
    }
    return SAMPLE_PROFILE;
  },

  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  },

  getLLMConfig(): LLMConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LLM_CONFIG);
      if (data) {
        return { ...DEFAULT_LLM_CONFIG, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Failed to parse LLM config:', e);
    }
    return DEFAULT_LLM_CONFIG;
  },

  saveLLMConfig(config: LLMConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY_LLM_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save LLM config:', e);
    }
  },

  getTailoredResumes(): TailoredResumeResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RESUMES);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse resumes:', e);
    }
    return [];
  },

  saveTailoredResume(resume: TailoredResumeResult): void {
    try {
      const current = this.getTailoredResumes();
      const updated = [resume, ...current.filter(r => r.id !== resume.id)].slice(0, 30);
      localStorage.setItem(STORAGE_KEY_RESUMES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save tailored resume:', e);
    }
  },

  deleteTailoredResume(id: string): void {
    try {
      const current = this.getTailoredResumes().filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEY_RESUMES, JSON.stringify(current));
    } catch (e) {
      console.error('Failed to delete tailored resume:', e);
    }
  },

  getApplications(): JobApplicationTrackerItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse applications:', e);
    }
    return [
      {
        id: 'app-sample-1',
        company: 'Stripe',
        role: 'Senior Infrastructure & Frontend Engineer',
        location: 'Remote',
        dateApplied: '2026-09-18',
        status: 'applied',
        notes: 'Applied with tailored resume emphasizing high-scale distributed systems and Kafka throughput.',
        savedAnswersCount: 4
      },
      {
        id: 'app-sample-2',
        company: 'Linear',
        role: 'Product Engineer - Realtime Collaboration',
        location: 'San Francisco, CA (Hybrid)',
        dateApplied: '2026-09-20',
        status: 'interviewing',
        notes: 'First technical screen scheduled. Highlighted WebSockets and CRDT collaborative editor experience.',
        savedAnswersCount: 3
      }
    ];
  },

  saveApplications(apps: JobApplicationTrackerItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(apps));
    } catch (e) {
      console.error('Failed to save applications:', e);
    }
  },

  addApplication(app: JobApplicationTrackerItem): void {
    const list = this.getApplications();
    this.saveApplications([app, ...list.filter(a => a.id !== app.id)]);
  },

  getAuditData(): PrivacyAuditData {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUDIT);
      const storageSize = new Blob([
        localStorage.getItem(STORAGE_KEY_PROFILE) || '',
        localStorage.getItem(STORAGE_KEY_RESUMES) || '',
        localStorage.getItem(STORAGE_KEY_APPLICATIONS) || ''
      ]).size;

      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...parsed,
          externalDataLeaksCount: 0,
          localStorageSizeBytes: storageSize
        };
      }
      return {
        totalGenerations: 6,
        totalTokensEstimated: 4200,
        externalDataLeaksCount: 0,
        localStorageSizeBytes: storageSize
      };
    } catch {
      return {
        totalGenerations: 0,
        totalTokensEstimated: 0,
        externalDataLeaksCount: 0,
        localStorageSizeBytes: 0
      };
    }
  },

  incrementAuditUsage(tokensEstimated: number): void {
    try {
      const current = this.getAuditData();
      const updated: PrivacyAuditData = {
        ...current,
        totalGenerations: current.totalGenerations + 1,
        totalTokensEstimated: current.totalTokensEstimated + tokensEstimated
      };
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to increment audit usage:', e);
    }
  },

  wipeAllLocalData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_PROFILE);
      localStorage.removeItem(STORAGE_KEY_RESUMES);
      localStorage.removeItem(STORAGE_KEY_APPLICATIONS);
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify({
        totalGenerations: 0,
        totalTokensEstimated: 0,
        externalDataLeaksCount: 0,
        localStorageSizeBytes: 0,
        lastWipeDate: new Date().toISOString()
      }));
    } catch (e) {
      console.error('Failed to wipe data:', e);
    }
  },

  exportAllDataAsJSON(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      llmConfig: this.getLLMConfig(),
      resumes: this.getTailoredResumes(),
      applications: this.getApplications()
    };
    return JSON.stringify(backup, null, 2);
  },

  importDataFromJSON(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profile) this.saveProfile(parsed.profile);
      if (parsed.llmConfig) this.saveLLMConfig(parsed.llmConfig);
      if (Array.isArray(parsed.resumes)) {
        localStorage.setItem(STORAGE_KEY_RESUMES, JSON.stringify(parsed.resumes));
      }
      if (Array.isArray(parsed.applications)) {
        this.saveApplications(parsed.applications);
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }
};
