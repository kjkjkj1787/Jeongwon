export type Job = {
  id: number;
  company: string;
  title: string;
  region: string;
  industry: string;
  skills: string[];
  majors: string[];
  deadline: string;
  url: string;
  description: string;
  isCustom?: boolean;
  source?: "saramin" | "demo" | "custom";
  isLive?: boolean;
  collectedAt?: string;
  deadlineChanged?: boolean;
  previousDeadline?: string;
};

export type EventItem = {
  id: string;
  jobId: number;
  date: string;
  type: string;
  memo?: string;
};

export type Profile = {
  major: string;
  skills: string;
  roles: string;
  regions: string;
};

export type FitResult = {
  score: number;
  roleScore: number;
  skillScore: number;
  regionScore: number;
  majorScore: number;
  matchedSkills: string[];
  missingSkills: string[];
};

export type RankedJob = Job & {
  fit: FitResult;
};

export type StatusType =
  | "미지원"
  | "지원 예정"
  | "지원 완료"
  | "서류 합격"
  | "면접 진행"
  | "최종 합격"
  | "불합격";

export const STATUS_OPTIONS: StatusType[] = [
  "미지원",
  "지원 예정",
  "지원 완료",
  "서류 합격",
  "면접 진행",
  "최종 합격",
  "불합격",
];

export const EVENT_TYPES = [
  "서류 마감",
  "인적성 검사",
  "1차 면접",
  "2차 면접",
  "최종 발표",
  "코딩/실기 테스트",
  "신체검사",
] as const;

// --- New Resume & Competitive Analysis Types ---

export type ResumeProject = {
  title: string;
  period?: string;
  role?: string;
  techStack?: string[];
  description: string;
  outcome?: string;
};

export type WorkExperience = {
  company: string;
  role: string;
  period?: string;
  responsibilities: string;
};

export type StructuredResume = {
  major: string;
  education: string;
  certifications: string[];
  skills: string[];
  projects: ResumeProject[];
  workExperience: WorkExperience[];
  awards: string[];
  rawText?: string;
};

export type ResumeRecord = {
  id: string;
  userId: string;
  title: string;
  version: string;
  fileName?: string;
  structuredData: StructuredResume;
  consentGiven: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AcceptedProfile = {
  id: string;
  companyName: string;
  jobCategory: string;
  hiringYear: string;
  qualifications: string[];
  skills: string[];
  projects: string[];
  source: string;
  permissionStatus: "verified_consent" | "official_disclosure";
};

export type ResumeAnalysisRecord = {
  id: string;
  userId: string;
  resumeId: string;
  resumeTitle?: string;
  resumeVersion?: string;
  jobId: number;
  companyName: string;
  jobTitle: string;
  requirementMatchScore: number; // 0-100
  acceptedProfileSimilarity: number | null; // null if no accepted cases exist
  sampleCount: number;
  acceptedProfileSources?: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  projectCompetitiveness: string;
  skillsCompetitiveness: string;
  missingRequirements: string[];
  rationale: string;
  analysisVersion: string;
  createdAt: string;
};
