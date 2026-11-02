import React, { useState } from "react";
import { EventItem, RankedJob } from "../types";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Star,
  Clock,
  Sparkles,
} from "lucide-react";

interface CalendarViewProps {
  jobs: RankedJob[];
  events: EventItem[];
  selectedJobId: number | null;
  onSelectJob: (jobId: number) => void;
  minScore: number;
  setMinScore: (score: number) => void;
  regionFilter: string;
  setRegionFilter: (region: string) => void;
  onlyFavorites: boolean;
  setOnlyFavorites: (fav: boolean) => void;
  favorites: number[];
  regions: string[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  jobs,
  events,
  selectedJobId,
  onSelectJob,
  minScore,
  setMinScore,
  regionFilter,
  setRegionFilter,
  onlyFavorites,
  setOnlyFavorites,
  favorites,
  regions,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  const handleMonthChange = (offset: number) => {
    setCurrentDate(new Date(year, monthIndex + offset, 1));
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  const todayStr = [
    new Date().getFullYear(),
    String(new Date().getMonth() + 1).padStart(2, "0"),
    String(new Date().getDate()).padStart(2, "0"),
  ].join("-");

  // Filtered jobs
  const visibleJobs = jobs.filter(job => {
    if (job.fit.score < minScore) return false;
    if (regionFilter !== "전체" && job.region !== regionFilter) return false;
    if (onlyFavorites && !favorites.includes(job.id)) return false;
    return true;
  });

  const firstDay = new Date(year, monthIndex, 1).getDay();
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const cellCount = Math.ceil((firstDay + totalDays) / 7) * 7;

  const cells = Array.from({ length: cellCount }, (_, i) => {
    const day = i - firstDay + 1;
    const dateObj = new Date(year, monthIndex, day);
    const dateStr = [
      dateObj.getFullYear(),
      String(dateObj.getMonth() + 1).padStart(2, "0"),
      String(dateObj.getDate()).padStart(2, "0"),
    ].join("-");

    return {
      day,
      inMonth: day >= 1 && day <= totalDays,
      date: dateStr,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
      {/* Calendar Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            <button
              onClick={() => handleMonthChange(-1)}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition"
              title="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-base font-bold text-slate-900 px-3 select-none">
              {year}년 {monthIndex + 1}월
            </span>
            <button
              onClick={() => handleMonthChange(1)}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition"
              title="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleGoToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200"
          >
            오늘
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={0}>전체 적합도</option>
            <option value={60}>적합도 60점 이상</option>
            <option value={80}>적합도 80점 이상 (강력 추천)</option>
          </select>

          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="전체">전체 지역</option>
            {regions.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium inline-flex items-center gap-1 transition ${
              onlyFavorites
                ? "bg-amber-50 text-amber-700 border-amber-300 font-semibold"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                onlyFavorites ? "text-amber-500 fill-amber-400" : "text-slate-400"
              }`}
            />
            <span>관심 공고만</span>
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center font-bold text-xs py-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
        <div className="text-rose-500">일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div className="text-blue-600">토</div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map(cell => {
          const isToday = cell.date === todayStr;
          const dueJobs = visibleJobs.filter(job => job.deadline === cell.date);
          const personalEvents = events.filter(
            event =>
              event.date === cell.date &&
              visibleJobs.some(j => j.id === event.jobId)
          );

          return (
            <div
              key={cell.date}
              className={`min-h-[105px] sm:min-h-[125px] p-1.5 sm:p-2 rounded-xl border flex flex-col transition-all ${
                !cell.inMonth
                  ? "bg-slate-50/60 border-slate-100 text-slate-400"
                  : isToday
                  ? "bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
                  : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday
                      ? "bg-blue-600 text-white"
                      : !cell.inMonth
                      ? "text-slate-300"
                      : "text-slate-700"
                  }`}
                >
                  {new Date(cell.date + "T12:00:00").getDate()}
                </span>
                {isToday && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-100/80 px-1 rounded">
                    오늘
                  </span>
                )}
              </div>

              {/* Event items container */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] sm:max-h-[100px] scrollbar-none">
                {/* Due Jobs */}
                {dueJobs.map(job => {
                  const isSelected = selectedJobId === job.id;
                  const isHighFit = job.fit.score >= 80;

                  return (
                    <button
                      key={job.id}
                      onClick={() => onSelectJob(job.id)}
                      title={`[${job.source === "saramin" ? "사람인 실시간" : "데모"}] ${job.company} - ${job.title} (${job.fit.score}점)${job.deadlineChanged ? " (마감일 변경됨)" : ""}`}
                      className={`w-full text-left p-1 rounded-md text-[10px] sm:text-[11px] leading-tight font-medium transition block truncate border ${
                        isSelected
                          ? "ring-2 ring-blue-600 border-blue-500 shadow-xs"
                          : ""
                      } ${
                        isHighFit
                          ? "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                          : "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate font-semibold flex items-center gap-1">
                          {job.source === "saramin" ? (
                            <span className="text-[8px] bg-blue-600 text-white px-1 py-0.2 rounded font-bold">
                              사람인
                            </span>
                          ) : job.isCustom ? (
                            <span className="text-[8px] bg-purple-600 text-white px-1 py-0.2 rounded font-bold">
                              직접
                            </span>
                          ) : (
                            <span className="text-[8px] bg-slate-400 text-white px-1 py-0.2 rounded font-bold">
                              데모
                            </span>
                          )}
                          <span className="truncate">{job.company}</span>
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1 rounded ml-1 shrink-0 ${
                            isHighFit
                              ? "bg-emerald-200/80 text-emerald-800"
                              : "bg-blue-200/80 text-blue-800"
                          }`}
                        >
                          {job.fit.score}점
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 truncate flex items-center justify-between mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 inline" />
                          서류 마감
                        </span>
                        {job.deadlineChanged && (
                          <span className="text-[8px] bg-rose-100 text-rose-700 px-1 rounded font-bold">
                            마감연장
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Personal Events */}
                {personalEvents.map(event => {
                  const job = jobs.find(j => j.id === event.jobId);
                  const isSelected = selectedJobId === event.jobId;

                  return (
                    <button
                      key={event.id}
                      onClick={() => onSelectJob(event.jobId)}
                      title={`[${event.type}] ${job?.company}`}
                      className={`w-full text-left p-1 rounded-md text-[10px] sm:text-[11px] leading-tight font-medium transition block truncate border bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 ${
                        isSelected ? "ring-2 ring-amber-500" : ""
                      }`}
                    >
                      <div className="font-semibold truncate">
                        {job?.company || "전형 일정"}
                      </div>
                      <div className="text-[9px] text-amber-700 truncate font-semibold">
                        ★ {event.type}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-slate-700">캘린더 범례:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>적합도 80점 이상 마감</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span>일반 서류 마감</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>면접 / 인적성 / 발표</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          캘린더 항목을 클릭하면 우측 또는 상세창에서 전형 일정을 등록할 수 있습니다.
        </div>
      </div>
    </div>
  );
};
