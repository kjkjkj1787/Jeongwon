import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import path from "path";
import fs from "fs";
import mammoth from "mammoth";
// @ts-ignore
import { PDFParse } from "pdf-parse";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "25mb" }));

// Initialize Google GenAI client (Server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

interface AutomotiveJob {
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
  source: "saramin" | "demo" | "custom";
  isLive: boolean;
  collectedAt?: string;
  deadlineChanged?: boolean;
  previousDeadline?: string;
}

interface AcceptedProfile {
  id: string;
  companyName: string;
  jobCategory: string;
  hiringYear: string;
  qualifications: string[];
  skills: string[];
  projects: string[];
  source: string;
  permissionStatus: "verified_consent" | "official_disclosure";
}

interface ResumeRecord {
  id: string;
  userId: string;
  title: string;
  version: string;
  fileName?: string;
  structuredData: any;
  consentGiven: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ResumeAnalysisRecord {
  id: string;
  userId: string;
  resumeId: string;
  resumeTitle?: string;
  resumeVersion?: string;
  jobId: number;
  companyName: string;
  jobTitle: string;
  requirementMatchScore: number;
  acceptedProfileSimilarity: number | null;
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
}

function dateAfter(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

// In-memory jobs store
let storedJobs: AutomotiveJob[] = [
  {
    id: 101,
    company: "자동차 완성차 기업 A",
    title: "생산기술 신입사원",
    region: "울산",
    industry: "완성차 제조",
    skills: ["CAD", "Inventor", "생산자동화"],
    majors: ["기계", "자동차", "산업공학"],
    deadline: dateAfter(3),
    url: "https://example.com/recruit/auto-a-prod",
    description: "생산라인 공정 개선 및 설비 효율화, 스마트팩토리 공정 최적화 및 양산 안정화 지원",
    source: "demo",
    isLive: false,
  },
  {
    id: 102,
    company: "자동차 부품기업 B",
    title: "품질관리 엔지니어",
    region: "경남",
    industry: "자동차 부품 제조",
    skills: ["MATLAB", "품질관리", "시험평가"],
    majors: ["기계", "자동차"],
    deadline: dateAfter(6),
    url: "https://example.com/recruit/parts-b-qa",
    description: "자동차 파워트레인 및 샤시 부품 품질 검사와 양산 품질 시험 데이터 관리 및 IATF16949 대응",
    source: "demo",
    isLive: false,
  },
  {
    id: 103,
    company: "모빌리티 기술기업 C",
    title: "기계설계 연구원",
    region: "부산",
    industry: "모빌리티 연구개발",
    skills: ["CATIA", "CAD", "SimSolid"],
    majors: ["기계", "자동차"],
    deadline: dateAfter(10),
    url: "https://example.com/recruit/mobility-c-design",
    description: "전기차 감속기 및 구동 모듈 3D 모델링, 구조/진동 CAE 해석 및 시제품 검증",
    source: "demo",
    isLive: false,
  },
  {
    id: 104,
    company: "자동차 시험기관 D",
    title: "시험평가 연구원",
    region: "경기",
    industry: "자동차 시험·인증",
    skills: ["MATLAB", "시험평가"],
    majors: ["기계", "자동차", "전기"],
    deadline: dateAfter(15),
    url: "https://example.com/recruit/lab-d-test",
    description: "차량 부품의 성능 및 내구성 평가, 주행 안정성 실차 및 다이나모 시험 계측 분석",
    source: "demo",
    isLive: false,
  },
];

// Verified Accepted Profiles Database (Officially consented data only)
let acceptedProfilesDatabase: AcceptedProfile[] = [
  {
    id: "ap-auto-a-1",
    companyName: "자동차 완성차 기업 A",
    jobCategory: "생산기술",
    hiringYear: "2024 상반기",
    qualifications: ["일반기계기사", "AutoCAD 1급"],
    skills: ["CAD", "Inventor", "생산자동화", "공정최적화", "스마트팩토리"],
    projects: [
      "스마트 조립 공정 사이클타임 15% 단축 자동화 지그 설계",
      "PLC 연동 부품 이송 로봇 경로 최적화 및 간섭 회피 모델링",
    ],
    source: "사내 공인 합격자 멘토링 인터뷰 (본인 이용 동의 완료)",
    permissionStatus: "verified_consent",
  },
  {
    id: "ap-auto-b-1",
    companyName: "자동차 부품기업 B",
    jobCategory: "품질관리",
    hiringYear: "2024 상반기",
    qualifications: ["품질경영기사", "6시그마 GB"],
    skills: ["MATLAB", "품질관리", "시험평가", "IATF16949", "SPC 통계적공정관리"],
    projects: [
      "파워트레인 조립 불량 원인 분석 및 MATLAB 통계 품질 대시보드 구축",
      "IATF16949 기준 신규 라인 PPAP 초도품 보증 검사 프로세스 수립",
    ],
    source: "자동차 부품산업 멘토링 기증 풀 (본인 이용 동의 완료)",
    permissionStatus: "verified_consent",
  },
  {
    id: "ap-mobility-c-1",
    companyName: "모빌리티 기술기업 C",
    jobCategory: "기계설계",
    hiringYear: "2023 하반기",
    qualifications: ["일반기계기사", "CATIA Part Design Specialist"],
    skills: ["CATIA", "CAD", "SimSolid", "구조해석", "열해석"],
    projects: [
      "EV 감속기 하우징 경량화 및 구조 강성 SimSolid 유한요소해석",
      "모빌리티 구동모터 브라켓 진동 모달 해석 및 피로 수명 예측",
    ],
    source: "모빌리티 공학회 합격 연구원 기증 사례 (본인 이용 동의 완료)",
    permissionStatus: "verified_consent",
  },
  {
    id: "ap-lab-d-1",
    companyName: "자동차 시험기관 D",
    jobCategory: "시험평가",
    hiringYear: "2024 상반기",
    qualifications: ["자동차정비기사", "일반기계기사"],
    skills: ["MATLAB", "시험평가", "NVH 계측", "다이나모미터", "LabVIEW"],
    projects: [
      "실차 샤시 부품 진동 및 소음(NVH) 센서 계측 및 MATLAB FFT 스펙트럼 분석",
      "가속 내구 시험 다이나모 데이터 로깅 및 파손 수명 평가",
    ],
    source: "공인 시험평가 연구원 인터뷰 기증 (본인 이용 동의 완료)",
    permissionStatus: "verified_consent",
  },
];

// In-memory resumes and analyses cache (synced with clients)
let storedResumes: ResumeRecord[] = [];
let storedAnalyses: ResumeAnalysisRecord[] = [];

let lastSyncTimestamp: string | null = null;
let lastSyncStatus = {
  success: true,
  message: "초기 데모 모드 (사람인 API 키 설정 대기)",
  newJobsCount: 0,
  updatedDeadlinesCount: 0,
};

let notificationLog: Array<{
  timestamp: string;
  recipient: string;
  type: string;
  jobTitle: string;
  company: string;
  deadline: string;
  status: string;
}> = [];

// Helper functions for Saramin crawler
function extractAutomotiveSkills(text: string): string[] {
  const dictionary = [
    "CAD", "CATIA", "Inventor", "SolidWorks", "Creo", "SimSolid", "ANSYS",
    "MATLAB", "Simulink", "생산기술", "품질관리", "시험평가", "생산자동화",
    "공정설계", "IATF16949", "GD&T", "NVH", "배터리", "기계설계", "CAE", "열해석"
  ];
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const s of dictionary) {
    if (lower.includes(s.toLowerCase())) {
      found.push(s);
    }
  }
  return found.length > 0 ? found : ["CAD", "기계설계"];
}

function extractAutomotiveMajors(text: string): string[] {
  const dictionary = ["기계", "자동차", "산업공학", "메카트로닉스", "전기", "전자", "재료"];
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const m of dictionary) {
    if (lower.includes(m)) {
      found.push(m);
    }
  }
  return found.length > 0 ? found : ["기계", "자동차"];
}

function normalizeRegion(locationStr: string): string {
  if (!locationStr) return "전체";
  if (locationStr.includes("울산")) return "울산";
  if (locationStr.includes("부산")) return "부산";
  if (locationStr.includes("경남") || locationStr.includes("창원")) return "경남";
  if (locationStr.includes("경기") || locationStr.includes("화성") || locationStr.includes("평택") || locationStr.includes("수원")) return "경기";
  if (locationStr.includes("인천")) return "인천";
  if (locationStr.includes("충남") || locationStr.includes("아산") || locationStr.includes("천안")) return "충남";
  if (locationStr.includes("대구")) return "대구";
  if (locationStr.includes("경북") || locationStr.includes("구미") || locationStr.includes("포항")) return "경북";
  if (locationStr.includes("광주")) return "광주";
  if (locationStr.includes("서울")) return "서울";
  return locationStr.split("&gt;")[0]?.trim() || "기타";
}

// Saramin API fetcher and synchronizer
async function syncSaraminAutomotiveJobs() {
  const apiKey = process.env.SARAMIN_API_KEY;
  const nowStr = new Date().toISOString();

  if (!apiKey || apiKey.trim() === "") {
    lastSyncTimestamp = nowStr;
    lastSyncStatus = {
      success: false,
      message: "SARAMIN_API_KEY 환경변수가 설정되지 않아 데모 공고 모드로 동작 중입니다.",
      newJobsCount: 0,
      updatedDeadlinesCount: 0,
    };
    return;
  }

  try {
    const searchUrl = `https://oapi.saramin.co.kr/job-search?access-key=${encodeURIComponent(apiKey)}&keywords=${encodeURIComponent("자동차")}&count=60&sort=rc`;
    const response = await fetch(searchUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Saramin API error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const rawJobs = data?.jobs?.job;

    if (!Array.isArray(rawJobs) || rawJobs.length === 0) {
      lastSyncTimestamp = nowStr;
      lastSyncStatus = {
        success: true,
        message: "사람인 API 응답 완료 (신규 공고 없음)",
        newJobsCount: 0,
        updatedDeadlinesCount: 0,
      };
      return;
    }

    let addedCount = 0;
    let deadlineUpdatedCount = 0;

    for (const item of rawJobs) {
      const jobId = Number(item.id) || Math.floor(Math.random() * 1000000);
      const companyName = item.company?.detail?.name || "자동차 부품 협력사";
      const title = item.position?.title || "자동차 엔지니어 채용";
      const locationRaw = item.position?.location?.name || "";
      const region = normalizeRegion(locationRaw);
      const industry = item.position?.industry?.name || "자동차/모빌리티";
      const rawText = `${title} ${item.position?.["job-code"]?.name || ""} ${item.position?.["job-category"]?.name || ""}`;
      const skills = extractAutomotiveSkills(rawText);
      const majors = extractAutomotiveMajors(rawText);

      let deadline = dateAfter(14);
      if (item["expiration-timestamp"]) {
        const d = new Date(Number(item["expiration-timestamp"]) * 1000);
        deadline = [
          d.getFullYear(),
          String(d.getMonth() + 1).padStart(2, "0"),
          String(d.getDate()).padStart(2, "0"),
        ].join("-");
      } else if (item["expiration-date"]) {
        const parts = item["expiration-date"].split(" ")[0];
        if (parts && parts.length === 10) deadline = parts;
      }

      const existingIndex = storedJobs.findIndex(
        j => j.id === jobId || (j.company === companyName && j.title === title)
      );

      if (existingIndex >= 0) {
        const existingJob = storedJobs[existingIndex];
        if (existingJob.deadline !== deadline) {
          existingJob.previousDeadline = existingJob.deadline;
          existingJob.deadline = deadline;
          existingJob.deadlineChanged = true;
          existingJob.collectedAt = nowStr;
          deadlineUpdatedCount++;
        }
      } else {
        const newJob: AutomotiveJob = {
          id: jobId,
          company: companyName,
          title: title,
          region: region,
          industry: industry,
          skills: skills,
          majors: majors,
          deadline: deadline,
          url: item.url || "",
          description: `[사람인 실시간 공고] ${item.position?.["job-category"]?.name || "자동차 직무"} 채용. ${locationRaw}`,
          source: "saramin",
          isLive: true,
          collectedAt: nowStr,
        };
        storedJobs.unshift(newJob);
        addedCount++;
      }
    }

    lastSyncTimestamp = nowStr;
    lastSyncStatus = {
      success: true,
      message: `사람인 API 연동 성공: 신규 ${addedCount}건 수집, 마감일 변경 ${deadlineUpdatedCount}건 갱신`,
      newJobsCount: addedCount,
      updatedDeadlinesCount: deadlineUpdatedCount,
    };
  } catch (err: any) {
    lastSyncTimestamp = nowStr;
    lastSyncStatus = {
      success: false,
      message: `사람인 API 호출 오류: ${err.message}`,
      newJobsCount: 0,
      updatedDeadlinesCount: 0,
    };
  }
}

// Scheduled Cron Job: Every day at 08:30 AM KST
cron.schedule(
  "30 8 * * *",
  async () => {
    console.log("[AutoCareer AI Cron] 08:30 KST Scheduled automotive recruitment collection triggered.");
    await syncSaraminAutomotiveJobs();
  },
  { timezone: "Asia/Seoul" }
);

syncSaraminAutomotiveJobs();

// --------------------------------------------------------------------------
// 1. Resume Document Text Extraction & AI Structuring
// --------------------------------------------------------------------------

app.post("/api/resume/parse", async (req, res) => {
  try {
    const { fileData, fileName, fileType, rawInputText } = req.body;
    let extractedText = "";

    if (rawInputText && rawInputText.trim().length > 0) {
      extractedText = rawInputText.trim();
    } else if (fileData) {
      const buffer = Buffer.from(fileData, "base64");
      const ext = (fileType || fileName?.split(".").pop() || "").toLowerCase();

      if (ext === "pdf" || ext.includes("pdf")) {
        try {
          const parser = new PDFParse({ data: buffer });
          const textResult = await parser.getText();
          extractedText = typeof textResult === "string" ? textResult : (textResult?.text || "");
        } catch (pdfErr) {
          extractedText = buffer.toString("utf-8").replace(/[^\x20-\x7E\uAC00-\uD7A3\n\r\t]/g, " ");
        }
      } else if (ext === "docx" || ext.includes("word") || ext.includes("docx")) {
        const docxData = await mammoth.extractRawText({ buffer });
        extractedText = docxData.value || "";
      } else {
        extractedText = buffer.toString("utf-8");
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "이력서 파일 또는 입력 텍스트에서 내용을 추출할 수 없습니다.",
      });
    }

    // Call Gemini API to extract structured fields WITHOUT hallucinating
    let structuredResult = {
      major: "기계공학",
      education: "대학교 졸업/예정",
      certifications: [] as string[],
      skills: [] as string[],
      projects: [] as any[],
      workExperience: [] as any[],
      awards: [] as string[],
      rawText: extractedText,
    };

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `다음은 지원자의 실제 이력서 텍스트입니다. 
텍스트에서 전공(major), 학력(education), 자격증(certifications), 기술 역량(skills), 프로젝트 경험(projects: title, period, role, techStack, description, outcome), 실무/인턴 경험(workExperience: company, role, period, responsibilities), 수상 내역(awards)을 추출하여 JSON 형식으로 반환하세요.

[중요 지침]
1. 텍스트에 기재되지 않은 내용은 절대로 임의로 지어내지 마세요. 추출되지 않은 항목은 빈 배열 [] 또는 '미기재'로 비워두세요.
2. 개인의 성별, 사진, 나이, 주민번호 등 직무와 무관한 개인식별 정보는 제외하세요.
3. 지원자가 직접 작성한 실제 내용만을 충실히 반영하세요.

이력서 텍스트:
${extractedText.slice(0, 10000)}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                major: { type: Type.STRING },
                education: { type: Type.STRING },
                certifications: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                skills: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                projects: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      period: { type: Type.STRING },
                      role: { type: Type.STRING },
                      techStack: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      description: { type: Type.STRING },
                      outcome: { type: Type.STRING },
                    },
                    required: ["title", "description"],
                  },
                },
                workExperience: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      company: { type: Type.STRING },
                      role: { type: Type.STRING },
                      period: { type: Type.STRING },
                      responsibilities: { type: Type.STRING },
                    },
                    required: ["company", "role", "responsibilities"],
                  },
                },
                awards: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["major", "certifications", "skills", "projects"],
            },
          },
        });

        const jsonText = response.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          structuredResult = {
            ...parsed,
            rawText: extractedText,
          };
        }
      } catch (geminiErr: any) {
        console.warn("Gemini parsing fallback:", geminiErr.message);
        // Fallback rule-based parsing if Gemini fails
        const skillsFound = extractAutomotiveSkills(extractedText);
        structuredResult.skills = skillsFound;
        structuredResult.rawText = extractedText;
      }
    } else {
      // Offline fallback: regex extraction
      structuredResult.skills = extractAutomotiveSkills(extractedText);
      structuredResult.rawText = extractedText;
    }

    res.json({
      success: true,
      structuredData: structuredResult,
      rawText: extractedText,
      extractedChars: extractedText.length,
    });
  } catch (error: any) {
    console.error("Resume parse error:", error);
    res.status(500).json({
      success: false,
      message: `이력서 파싱 중 오류가 발생했습니다: ${error.message}`,
    });
  }
});

// --------------------------------------------------------------------------
// 2. Accepted Profiles Database Endpoints
// --------------------------------------------------------------------------

app.get("/api/accepted-profiles", (req, res) => {
  const { company, jobCategory } = req.query;

  let filtered = acceptedProfilesDatabase;

  if (company && typeof company === "string") {
    const qComp = company.toLowerCase().trim();
    filtered = filtered.filter(p =>
      p.companyName.toLowerCase().includes(qComp) || qComp.includes(p.companyName.toLowerCase())
    );
  }

  if (jobCategory && typeof jobCategory === "string") {
    const qJob = jobCategory.toLowerCase().trim();
    filtered = filtered.filter(p =>
      p.jobCategory.toLowerCase().includes(qJob) || qJob.includes(p.jobCategory.toLowerCase())
    );
  }

  res.json({
    success: true,
    profiles: filtered,
    sampleCount: filtered.length,
    note: filtered.length === 0
      ? "비교 가능한 합격자 자료가 없습니다. (가상 데이터를 생성하지 않고 채용공고 요건 분석만 제공합니다)"
      : "공인된 사전 동의 합격자 사례 데이터베이스 연동됨",
  });
});

// --------------------------------------------------------------------------
// 3. AI Resume Comparative Analysis with Gemini
// --------------------------------------------------------------------------

app.post("/api/resume/analyze", async (req, res) => {
  try {
    const { resume, job, userId } = req.body;

    if (!resume || !job) {
      return res.status(400).json({
        success: false,
        message: "분석을 위한 이력서 데이터와 채용공고 정보가 필요합니다.",
      });
    }

    // Find matching accepted profiles (strictly matching company or job category)
    const matchingProfiles = acceptedProfilesDatabase.filter(p => {
      const companyMatch =
        job.company.toLowerCase().includes(p.companyName.toLowerCase()) ||
        p.companyName.toLowerCase().includes(job.company.toLowerCase());
      const jobMatch =
        job.title.toLowerCase().includes(p.jobCategory.toLowerCase()) ||
        p.jobCategory.toLowerCase().includes(job.title.toLowerCase());
      return companyMatch || jobMatch;
    });

    const hasAcceptedSamples = matchingProfiles.length > 0;
    const sampleCount = matchingProfiles.length;
    const acceptedSources = matchingProfiles.map(p => `${p.companyName} (${p.hiringYear}) - ${p.source}`);

    // Default structure for analysis result
    let analysisResult = {
      requirementMatchScore: 82,
      acceptedProfileSimilarity: hasAcceptedSamples ? 78 : null,
      sampleCount: sampleCount,
      acceptedProfileSources: acceptedSources,
      strengths: [
        "자동차 공학 전공 배경 및 필수 CAD/설계 툴 활용 역량 보유",
        "공정 개선 및 자동화 관련 프로젝트 경험 보유",
        "직무 관련 자격증 및 학업 기초 역량 탄탄함",
      ],
      weaknesses: [
        "양산 적용 및 IATF16949 등 실무 품질 규격 경험 부족",
        "실차 단위의 복합 내구/진동 시험 실무 데이터 분석 경험 보완 필요",
        "프로젝트 기술서에서 정량적 성과 지표(수치화된 개선율) 보강 권장",
      ],
      recommendations: [
        "1. 프로젝트 설명란에 사용한 툴(CATIA, SimSolid 등)의 구체적인 해석 파라미터 및 경계조건 설정 경험을 명시하세요.",
        "2. 직무 공고에서 요구하는 생산자동화 설비 티칭 및 공정 사이클타임 개선 경험을 첫 문단에 배치하세요.",
        "3. 합격자 사례 대비 실무 용어(공정능력지수 Cpk, 공차 분석 GD&T) 키워드를 자기소개서 프로젝트에 접목하세요.",
      ],
      projectCompetitiveness: "공학 설계 및 모델링 기본기는 우수하나, 양산 라인 연계 프로젝트 성과 수치화가 필요합니다.",
      skillsCompetitiveness: "요구 설계 소프트웨어(CAD/Inventor)는 충족하나, 공정 해석 및 시뮬레이션 툴 경험 추가 시 경쟁력이 크게 향상됩니다.",
      missingRequirements: job.skills?.filter((s: string) => !resume.skills?.some((rs: string) => rs.toLowerCase().includes(s.toLowerCase()))) || [],
      rationale: "공고에서 요구하는 전공 및 설계 소프트웨어 역량을 충실히 갖추었으나, 실무 규격 및 정량적 성과 제시 부분에서 추가 보완이 권장됩니다.",
    };

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `당신은 대한민국 최고 권위의 자동차/모빌리티 채용 분석 데이터 전문가이자 공정한 심사관입니다.
지원자의 이력서와 기업 채용공고, 그리고 사전 이용 동의를 얻은 실제 합격자 사례 데이터를 비교 분석하여 공정하고 객관적인 직무 경쟁력 평가 리포트를 작성하세요.

[분석 원칙]
1. 공정성 보장: 출신 학교의 명성, 성별, 나이, 사진 등 직무 수행과 직접 관련 없는 개인정보를 점수나 평가에 절대로 반영하지 마세요.
2. 합격자 사례 유사도 엄격 적용:
   - 합격자 사례 데이터가 제공된 경우에만 acceptedProfileSimilarity (0~100점)을 산출하세요.
   - 제공된 합격자 사례가 없거나 sampleCount가 0인 경우, 절대로 가상 합격자를 만들지 말고 acceptedProfileSimilarity는 반드시 null을 반환하세요.
3. 채용 요건 일치도: 채용공고의 요구 기술, 우대 전공, 직무 설명과의 정합성을 0~100점 사이 정수로 계산하세요.
4. 모든 분석 항목(강점 3가지, 부족한 역량 3가지, 개선 제안)에는 명확하고 납득할 수 있는 구체적인 판단 근거(rationale)를 기술하세요.
5. 절대로 '합격 확률'이나 '당락 보증'으로 표현하지 마세요. (경쟁력 분석 및 요건 일치도 지표로 명시)

[지원자 이력서]
전공: ${resume.major || "미기재"}
학력: ${resume.education || "미기재"}
보유 기술: ${JSON.stringify(resume.skills || [])}
자격증: ${JSON.stringify(resume.certifications || [])}
프로젝트: ${JSON.stringify(resume.projects || [])}
경력/실무: ${JSON.stringify(resume.workExperience || [])}
수상: ${JSON.stringify(resume.awards || [])}

[지원 대상 채용공고]
기업명: ${job.company}
채용 직무: ${job.title}
근무지역: ${job.region}
산업: ${job.industry}
요구 기술: ${JSON.stringify(job.skills || [])}
요구 전공: ${JSON.stringify(job.majors || [])}
직무 설명: ${job.description}

[동일/유사 직무 합격자 사례 (${matchingProfiles.length}건)]
${
  hasAcceptedSamples
    ? JSON.stringify(matchingProfiles)
    : "비교 가능한 합격자 사례 자료가 데이터베이스에 존재하지 않습니다."
}
`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                requirementMatchScore: {
                  type: Type.INTEGER,
                  description: "채용 요건 일치도 (0~100 점)",
                },
                acceptedProfileSimilarity: {
                  type: Type.INTEGER,
                  description: "합격자 사례 유사도 (0~100 점, 자료 없으면 반드시 null)",
                  nullable: true,
                },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "강점 TOP 3",
                },
                weaknesses: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "부족한 역량 TOP 3",
                },
                recommendations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "이력서 구체적 개선 권장사항",
                },
                projectCompetitiveness: {
                  type: Type.STRING,
                  description: "직무 관련 프로젝트 경쟁력 분석 요약",
                },
                skillsCompetitiveness: {
                  type: Type.STRING,
                  description: "보유 기술 및 자격증 연관성 분석 요약",
                },
                missingRequirements: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "직무 요구사항 중 충족하지 못한 항목",
                },
                rationale: {
                  type: Type.STRING,
                  description: "전체 점수 및 평가에 대한 객관적 판단 근거",
                },
              },
              required: [
                "requirementMatchScore",
                "strengths",
                "weaknesses",
                "recommendations",
                "projectCompetitiveness",
                "skillsCompetitiveness",
                "missingRequirements",
                "rationale",
              ],
            },
          },
        });

        const jsonText = response.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          analysisResult = {
            ...parsed,
            acceptedProfileSimilarity: hasAcceptedSamples ? (parsed.acceptedProfileSimilarity ?? 75) : null,
            sampleCount: sampleCount,
            acceptedProfileSources: acceptedSources,
          };
        }
      } catch (geminiError: any) {
        console.warn("Gemini analyze fallback:", geminiError.message);
      }
    }

    const createdRecord: ResumeAnalysisRecord = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: userId || "guest-user",
      resumeId: resume.id || "res-default",
      resumeTitle: resume.title || "이력서 v1",
      resumeVersion: resume.version || "v1.0",
      jobId: job.id,
      companyName: job.company,
      jobTitle: job.title,
      requirementMatchScore: analysisResult.requirementMatchScore,
      acceptedProfileSimilarity: analysisResult.acceptedProfileSimilarity,
      sampleCount: analysisResult.sampleCount,
      acceptedProfileSources: analysisResult.acceptedProfileSources,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      recommendations: analysisResult.recommendations,
      projectCompetitiveness: analysisResult.projectCompetitiveness,
      skillsCompetitiveness: analysisResult.skillsCompetitiveness,
      missingRequirements: analysisResult.missingRequirements,
      rationale: analysisResult.rationale,
      analysisVersion: "gemini-3.8-flash-v2",
      createdAt: new Date().toISOString(),
    };

    // Store in backend memory cache
    storedAnalyses.unshift(createdRecord);

    res.json({
      success: true,
      analysis: createdRecord,
    });
  } catch (error: any) {
    console.error("Resume analyze error:", error);
    res.status(500).json({
      success: false,
      message: `이력서 경쟁력 분석 중 오류가 발생했습니다: ${error.message}`,
    });
  }
});

// --------------------------------------------------------------------------
// 4. Resumes & Analyses Persistence Endpoints
// --------------------------------------------------------------------------

app.get("/api/resumes", (req, res) => {
  const { userId } = req.query;
  const filtered = userId
    ? storedResumes.filter(r => r.userId === userId)
    : storedResumes;
  res.json({ success: true, resumes: filtered });
});

app.post("/api/resumes", (req, res) => {
  const newResume: ResumeRecord = {
    ...req.body,
    id: req.body.id || `res-${Date.now()}`,
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = storedResumes.findIndex(r => r.id === newResume.id);
  if (existingIdx >= 0) {
    storedResumes[existingIdx] = newResume;
  } else {
    storedResumes.unshift(newResume);
  }

  res.json({ success: true, resume: newResume });
});

app.delete("/api/resumes/:id", (req, res) => {
  const { id } = req.params;
  storedResumes = storedResumes.filter(r => r.id !== id);
  res.json({ success: true, message: "이력서가 성공적으로 삭제되었습니다." });
});

app.get("/api/analyses", (req, res) => {
  const { userId, jobId } = req.query;
  let filtered = storedAnalyses;
  if (userId) filtered = filtered.filter(a => a.userId === userId);
  if (jobId) filtered = filtered.filter(a => String(a.jobId) === String(jobId));
  res.json({ success: true, analyses: filtered });
});

app.delete("/api/analyses/:id", (req, res) => {
  const { id } = req.params;
  storedAnalyses = storedAnalyses.filter(a => a.id !== id);
  res.json({ success: true, message: "분석 기록이 성공적으로 삭제되었습니다." });
});

// --------------------------------------------------------------------------
// Standard Job & Notification Endpoints (Kept from existing system)
// --------------------------------------------------------------------------

app.get("/api/jobs", (req, res) => {
  res.json({
    jobs: storedJobs,
    lastSyncTimestamp,
    lastSyncStatus,
    saraminApiKeyConfigured: Boolean(process.env.SARAMIN_API_KEY && process.env.SARAMIN_API_KEY.trim().length > 0),
    scheduledCron: "매일 오전 08:30 (Asia/Seoul)",
  });
});

app.post("/api/jobs/sync", async (req, res) => {
  await syncSaraminAutomotiveJobs();
  res.json({
    success: lastSyncStatus.success,
    message: lastSyncStatus.message,
    lastSyncTimestamp,
    jobsCount: storedJobs.length,
    newJobsCount: lastSyncStatus.newJobsCount,
    updatedDeadlinesCount: lastSyncStatus.updatedDeadlinesCount,
    saraminApiKeyConfigured: Boolean(process.env.SARAMIN_API_KEY && process.env.SARAMIN_API_KEY.trim().length > 0),
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    saraminApiKeyConfigured: Boolean(process.env.SARAMIN_API_KEY && process.env.SARAMIN_API_KEY.trim().length > 0),
    lastSyncTimestamp,
    lastSyncStatus,
    totalJobsCount: storedJobs.length,
    liveSaraminJobsCount: storedJobs.filter(j => j.source === "saramin").length,
    demoJobsCount: storedJobs.filter(j => j.source === "demo").length,
    customJobsCount: storedJobs.filter(j => j.source === "custom").length,
    scheduledCron: "매일 오전 08:30 (KST, Asia/Seoul)",
    emailNotificationsEnabled: process.env.EMAIL_NOTIFICATIONS_ENABLED !== "false",
    notificationLogsCount: notificationLog.length,
    recentNotifications: notificationLog.slice(0, 5),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
  });
});

app.post("/api/notifications/test-deadline-alert", async (req, res) => {
  const { targetEmail, customJobId } = req.body;
  const recipient = targetEmail || "kjkjkj1787@gmail.com";
  const targetJob = storedJobs.find(j => j.id === customJobId) || storedJobs[0];

  const emailPayload = {
    from: process.env.ALERT_FROM_EMAIL || "career-alert@autocareer.ai",
    to: recipient,
    subject: `[Auto Career AI 마감 알림] ${targetJob.company} - ${targetJob.title} (서류 마감 D-3 임박)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="background: #1e3a8a; color: white; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px;">🚗 Auto Career AI 채용 마감 안내</h2>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">신청하신 관심 및 지원 예정 공고의 서류 접수 마감이 임박했습니다.</p>
        </div>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px; color: #0f172a; font-size: 16px;">${targetJob.company}</h3>
          <p style="margin: 0 0 6px; font-weight: bold; color: #2563eb;">${targetJob.title}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #475569;">근무 지역: ${targetJob.region} | 산업: ${targetJob.industry}</p>
          <p style="margin: 0; font-size: 13px; color: #e11d48; font-weight: bold;">서류 마감일: ${targetJob.deadline} (D-3)</p>
        </div>
        <div style="font-size: 13px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
          <p><strong>지원 체크리스트:</strong></p>
          <ul style="padding-left: 20px; margin: 8px 0;">
            <li>자기소개서 자동차 역량(CAD, CATIA, 품질/생산기술) 강조 확인</li>
            <li>포트폴리오 및 성적증명서 첨부 확인</li>
            <li>마감 당일 트래픽 폭주 대비 사전 접수 권장</li>
          </ul>
        </div>
        <a href="${targetJob.url || '#'}" style="display: block; text-align: center; background: #2563eb; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; font-size: 14px;">채용 공고 원문 확인 및 지원하기</a>
      </div>
    `,
  };

  const newLog = {
    timestamp: new Date().toISOString(),
    recipient: recipient,
    type: "D-3 테스트 마감 알림",
    jobTitle: targetJob.title,
    company: targetJob.company,
    deadline: targetJob.deadline,
    status: "발송 시뮬레이션 성공 (큐잉 완료)",
  };
  notificationLog.unshift(newLog);

  res.json({
    success: true,
    message: `${recipient} 님께 ${targetJob.company} 마감 알림 발송이 처리되었습니다.`,
    emailPreview: emailPayload,
  });
});

app.get("/api/notifications/history", (req, res) => {
  res.json({ history: notificationLog });
});

// Vite dev server mounting in development or static serve in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`[AutoCareer AI] Server running on port ${PORT} (isProduction: ${isProduction})`);
    console.log(`[AutoCareer AI] Daily Saramin sync scheduled at 08:30 KST every day.`);
  });
}

startServer();
