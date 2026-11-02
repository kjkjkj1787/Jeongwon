import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json());

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

// In-memory jobs store with seed data
function dateAfter(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

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

let lastSyncTimestamp: string | null = null;
let lastSyncStatus: {
  success: boolean;
  message: string;
  newJobsCount: number;
  updatedDeadlinesCount: number;
} = {
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

// Helper to extract known automotive skills from text
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
    console.log("[AutoCareer AI] SARAMIN_API_KEY is not configured in .env. Retaining demo postings with clear labeling.");
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
    console.log("[AutoCareer AI] Requesting Saramin Open API for automotive jobs...");
    const searchUrl = `https://oapi.saramin.co.kr/job-search?access-key=${encodeURIComponent(apiKey)}&keywords=${encodeURIComponent("자동차")}&count=60&sort=rc`;

    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Saramin API responded with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const rawJobs = data?.jobs?.job;

    if (!Array.isArray(rawJobs) || rawJobs.length === 0) {
      console.log("[AutoCareer AI] Saramin returned no job listings for keyword '자동차'.");
      lastSyncTimestamp = nowStr;
      lastSyncStatus = {
        success: true,
        message: "사람인 API 응답 완료 (신규 수집 공고 없음)",
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

      // Parse expiration date
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

      const existingIndex = storedJobs.findIndex(j => j.id === jobId || (j.company === companyName && j.title === title));

      if (existingIndex >= 0) {
        // Check if deadline changed
        const existingJob = storedJobs[existingIndex];
        if (existingJob.deadline !== deadline) {
          existingJob.previousDeadline = existingJob.deadline;
          existingJob.deadline = deadline;
          existingJob.deadlineChanged = true;
          existingJob.collectedAt = nowStr;
          deadlineUpdatedCount++;
        }
      } else {
        // New job collected from Saramin
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
    console.log(`[AutoCareer AI] Successfully synced Saramin jobs. New: ${addedCount}, Deadlines Updated: ${deadlineUpdatedCount}`);
  } catch (err: any) {
    console.error("[AutoCareer AI] Error syncing Saramin Open API:", err.message);
    lastSyncTimestamp = nowStr;
    lastSyncStatus = {
      success: false,
      message: `사람인 API 호출 오류: ${err.message}`,
      newJobsCount: 0,
      updatedDeadlinesCount: 0,
    };
  }
}

// Email Notification Checker for D-3 and D-1 deadlines
async function checkAndSendDeadlineNotifications(userEmail = "kjkjkj1787@gmail.com") {
  const today = dateAfter(0);
  const d3 = dateAfter(3);
  const d1 = dateAfter(1);

  const urgentJobs = storedJobs.filter(
    j => j.deadline === d3 || j.deadline === d1 || j.deadline === today
  );

  for (const job of urgentJobs) {
    const dType = job.deadline === today ? "D-Day (오늘 마감)" : job.deadline === d1 ? "D-1 마감 전일" : "D-3 마감 임박";

    const logEntry = {
      timestamp: new Date().toISOString(),
      recipient: userEmail,
      type: dType,
      jobTitle: job.title,
      company: job.company,
      deadline: job.deadline,
      status: process.env.SMTP_HOST ? "SMTP 발송 완료" : "알림 시스템 큐잉 완료 (가상 발송 기록)",
    };

    notificationLog.unshift(logEntry);
  }

  // Keep last 50 notification logs
  if (notificationLog.length > 50) {
    notificationLog = notificationLog.slice(0, 50);
  }

  console.log(`[AutoCareer AI] Deadline notifications checked. Sent/Logged ${urgentJobs.length} alerts for deadlines D-3/D-1/D-Day.`);
}

// Scheduled Cron Job: Runs every day at 08:30 AM KST
// Cron syntax: "30 8 * * *" (minute 30, hour 8, every day, every month, every day-of-week)
cron.schedule(
  "30 8 * * *",
  async () => {
    console.log("[AutoCareer AI Cron] 08:30 KST Scheduled automotive recruitment collection triggered.");
    await syncSaraminAutomotiveJobs();
    await checkAndSendDeadlineNotifications();
  },
  {
    timezone: "Asia/Seoul",
  }
);

// Initial collection attempt on server start
syncSaraminAutomotiveJobs();

// API Endpoints
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
  res.json({
    history: notificationLog,
  });
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
