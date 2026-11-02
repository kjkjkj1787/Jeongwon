import { EventItem, Job } from "../types";

export function exportToICS(jobs: Job[], events: EventItem[]): void {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Auto Career AI//Job Tracker//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:자동차 취업 일정 (Auto Career AI)",
    "X-WR-TIMEZONE:Asia/Seoul",
  ];

  const nowStr = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  // 1. Add Job Deadlines
  jobs.forEach(job => {
    if (!job.deadline) return;
    const cleanDate = job.deadline.replace(/-/g, "");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:job-deadline-${job.id}-${cleanDate}@autocareer.ai`);
    lines.push(`DTSTAMP:${nowStr}`);
    lines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
    lines.push(`DTEND;VALUE=DATE:${cleanDate}`);
    lines.push(`SUMMARY:[마감] ${job.company} - ${job.title}`);
    lines.push(
      `DESCRIPTION:서류 마감일\\n기업: ${job.company}\\n직무: ${job.title}\\n지역: ${job.region}\\n요구기술: ${job.skills.join(", ")}${job.url ? "\\n공고 링크: " + job.url : ""}`
    );
    lines.push(`LOCATION:${job.region}`);
    lines.push("STATUS:CONFIRMED");
    lines.push("END:VEVENT");
  });

  // 2. Add Personal Events (Interviews, Exams, etc.)
  events.forEach(evt => {
    const job = jobs.find(j => j.id === evt.jobId);
    const cleanDate = evt.date.replace(/-/g, "");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:event-${evt.id}-${cleanDate}@autocareer.ai`);
    lines.push(`DTSTAMP:${nowStr}`);
    lines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
    lines.push(`DTEND;VALUE=DATE:${cleanDate}`);
    lines.push(`SUMMARY:[${evt.type}] ${job ? job.company : "채용 전형"}`);
    lines.push(
      `DESCRIPTION:전형 일정: ${evt.type}\\n대상 기업: ${job ? job.company : ""}\\n직무: ${job ? job.title : ""}${evt.memo ? "\\n메모: " + evt.memo : ""}`
    );
    if (job?.region) {
      lines.push(`LOCATION:${job.region}`);
    }
    lines.push("STATUS:CONFIRMED");
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");

  const icsContent = lines.join("\r\n");
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `auto_career_calendar_${new Date().toISOString().slice(0, 10)}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
