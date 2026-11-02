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
