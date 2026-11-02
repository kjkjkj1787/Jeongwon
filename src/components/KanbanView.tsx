import React from "react";
import { RankedJob, STATUS_OPTIONS, StatusType } from "../types";
import {
  Building2,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";

interface KanbanViewProps {
  jobs: RankedJob[];
  statuses: Record<number, string>;
  onStatusChange: (jobId: number, newStatus: string) => void;
  onSelectJob: (jobId: number) => void;
  selectedJobId: number | null;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  jobs,
  statuses,
  onStatusChange,
  onSelectJob,
  selectedJobId,
}) => {
  const getNextStatus = (current: string): string | null => {
    const idx = STATUS_OPTIONS.indexOf(current as StatusType);
    if (idx >= 0 && idx < STATUS_OPTIONS.length - 2) {
      return STATUS_OPTIONS[idx + 1];
    }
    return null;
  };

  const getPrevStatus = (current: string): string | null => {
    const idx = STATUS_OPTIONS.indexOf(current as StatusType);
    if (idx > 0 && idx <= STATUS_OPTIONS.length - 2) {
      return STATUS_OPTIONS[idx - 1];
    }
    return null;
  };

  // Group columns (we can display the main flow columns + outcome columns)
  const columns: { title: string; color: string; badgeColor: string }[] = [
    { title: "미지원", color: "border-slate-200 bg-slate-50/50", badgeColor: "bg-slate-100 text-slate-700" },
    { title: "지원 예정", color: "border-amber-200 bg-amber-50/30", badgeColor: "bg-amber-100 text-amber-800" },
    { title: "지원 완료", color: "border-blue-200 bg-blue-50/30", badgeColor: "bg-blue-100 text-blue-800" },
    { title: "서류 합격", color: "border-cyan-200 bg-cyan-50/30", badgeColor: "bg-cyan-100 text-cyan-800" },
    { title: "면접 진행", color: "border-purple-200 bg-purple-50/30", badgeColor: "bg-purple-100 text-purple-800" },
    { title: "최종 합격", color: "border-emerald-200 bg-emerald-50/30", badgeColor: "bg-emerald-100 text-emerald-800" },
    { title: "불합격", color: "border-rose-200 bg-rose-50/30", badgeColor: "bg-rose-100 text-rose-800" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            지원 전형 단계별 칸반 파이프라인
          </h2>
          <p className="text-xs text-slate-500">
            각 전형 단계별 진행 현황을 한눈에 파악하고 다음 단계로 상태를 변경할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
        {columns.map(col => {
          const colJobs = jobs.filter(job => {
            const current = statuses[job.id] || "미지원";
            return current === col.title;
          });

          return (
            <div
              key={col.title}
              className={`w-72 shrink-0 rounded-2xl border p-3 flex flex-col ${col.color}`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/60">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${col.badgeColor}`}>
                    {col.title}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    ({colJobs.length})
                  </span>
                </div>
              </div>

              {/* Column cards container */}
              <div className="space-y-2.5 min-h-[360px] flex-1">
                {colJobs.map(job => {
                  const isSelected = selectedJobId === job.id;
                  const next = getNextStatus(col.title);
                  const prev = getPrevStatus(col.title);

                  return (
                    <div
                      key={job.id}
                      onClick={() => onSelectJob(job.id)}
                      className={`cursor-pointer bg-white rounded-xl p-3 border shadow-2xs hover:shadow-xs transition text-left space-y-2 ${
                        isSelected
                          ? "ring-2 ring-blue-600 border-blue-500"
                          : "border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {job.company}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {job.title}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                            job.fit.score >= 80
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {job.fit.score}점
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {job.deadline} 마감
                        </span>
                        <span className="text-slate-400">{job.region}</span>
                      </div>

                      {/* Quick stage transition buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-1 text-[10px]">
                        {prev ? (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onStatusChange(job.id, prev);
                            }}
                            className="p-1 rounded text-slate-500 hover:bg-slate-100 inline-flex items-center gap-0.5"
                            title={`이전 단계: ${prev}`}
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>{prev}</span>
                          </button>
                        ) : (
                          <div />
                        )}

                        {next && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onStatusChange(job.id, next);
                            }}
                            className="p-1 px-1.5 rounded bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 inline-flex items-center gap-0.5 ml-auto"
                            title={`다음 단계: ${next}`}
                          >
                            <span>{next}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colJobs.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-300 text-xs border border-dashed border-slate-200 rounded-xl">
                    <span>공고 없음</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
