import React, { useState } from "react";
import { RankedJob } from "../types";
import {
  Search,
  Star,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowUpDown,
  Filter,
} from "lucide-react";

interface JobListViewProps {
  jobs: RankedJob[];
  selectedJobId: number | null;
  onSelectJob: (jobId: number) => void;
  statuses: Record<number, string>;
  favorites: number[];
  onToggleFavorite: (jobId: number) => void;
  regions: string[];
}

export const JobListView: React.FC<JobListViewProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  statuses,
  favorites,
  onToggleFavorite,
  regions,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [minScore, setMinScore] = useState<number>(0);
  const [regionFilter, setRegionFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<"score" | "deadline" | "company">("score");

  const today = new Date().toISOString().slice(0, 10);

  const getDDay = (deadline: string) => {
    const diff = Math.ceil(
      (new Date(deadline + "T00:00:00").getTime() -
        new Date(today + "T00:00:00").getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (diff < 0) return { label: "마감", isUrgent: false, isPassed: true };
    if (diff === 0) return { label: "D-Day", isUrgent: true, isPassed: false };
    if (diff <= 3) return { label: `D-${diff}`, isUrgent: true, isPassed: false };
    return { label: `D-${diff}`, isUrgent: false, isPassed: false };
  };

  const filteredJobs = jobs
    .filter(job => {
      if (job.fit.score < minScore) return false;
      if (regionFilter !== "전체" && job.region !== regionFilter) return false;
      const currentStatus = statuses[job.id] || "미지원";
      if (statusFilter !== "전체" && currentStatus !== statusFilter) return false;
      if (onlyFavorites && !favorites.includes(job.id)) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchComp = job.company.toLowerCase().includes(q);
        const matchTitle = job.title.toLowerCase().includes(q);
        const matchSkills = job.skills.some(s => s.toLowerCase().includes(q));
        const matchDesc = job.description.toLowerCase().includes(q);
        if (!matchComp && !matchTitle && !matchSkills && !matchDesc) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "score") {
        return b.fit.score - a.fit.score;
      }
      if (sortBy === "deadline") {
        return a.deadline.localeCompare(b.deadline);
      }
      return a.company.localeCompare(b.company);
    });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="space-y-3 pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="기업명, 직무, 기술 키워드 검색..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>정렬:</span>
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
            >
              <option value="score">적합도 높은순</option>
              <option value="deadline">마감 임박순</option>
              <option value="company">기업 가나다순</option>
            </select>

            <select
              value={minScore}
              onChange={e => setMinScore(Number(e.target.value))}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
            >
              <option value={0}>전체 점수</option>
              <option value={60}>60점 이상</option>
              <option value={80}>80점 이상</option>
            </select>

            <select
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none"
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
              className={`p-1.5 rounded-lg border text-xs inline-flex items-center gap-1 transition ${
                onlyFavorites
                  ? "bg-amber-50 text-amber-700 border-amber-300 font-semibold"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  onlyFavorites
                    ? "text-amber-500 fill-amber-400"
                    : "text-slate-400"
                }`}
              />
              <span className="hidden sm:inline">관심만</span>
            </button>
          </div>
        </div>

        {/* Count summary */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div>
            총 <strong className="text-slate-800">{filteredJobs.length}</strong>
            개의 채용공고
          </div>
          {filteredJobs.length > 0 && (
            <div className="text-[11px] text-slate-400">
              카드를 클릭하면 상세 점수 내역 및 전형 일정을 관리할 수 있습니다.
            </div>
          )}
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredJobs.map(job => {
          const isSelected = selectedJobId === job.id;
          const isFav = favorites.includes(job.id);
          const currentStatus = statuses[job.id] || "미지원";
          const dday = getDDay(job.deadline);
          const isHighFit = job.fit.score >= 80;

          return (
            <div
              key={job.id}
              onClick={() => onSelectJob(job.id)}
              className={`cursor-pointer p-4 rounded-xl border transition-all text-left flex flex-col justify-between gap-3 ${
                isSelected
                  ? "border-blue-600 bg-blue-50/20 ring-2 ring-blue-500/20 shadow-sm"
                  : "bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-xs"
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    {job.source === "saramin" ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                        사람인 실시간
                      </span>
                    ) : job.isCustom ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                        직접 등록
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        데모 공고
                      </span>
                    )}
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {job.industry}
                    </span>
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200">
                      {job.region}
                    </span>
                    {job.deadlineChanged && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                        마감일 변경됨 ({job.previousDeadline} ➔ {job.deadline})
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {job.company}
                  </h3>
                  <div className="text-xs font-semibold text-blue-700 mt-0.5">
                    {job.title}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div
                    className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 ${
                      isHighFit
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                  >
                    <span>{job.fit.score}점</span>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onToggleFavorite(job.id);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-amber-500 transition"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isFav ? "text-amber-400 fill-amber-400" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Description preview */}
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                {job.description}
              </p>

              {/* Matched skills chips */}
              <div className="flex items-center gap-1 flex-wrap text-[11px]">
                <span className="text-slate-400 font-medium">요구:</span>
                {job.skills.map(s => {
                  const isMatched = job.fit.matchedSkills.includes(s);
                  return (
                    <span
                      key={s}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        isMatched
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {s}
                    </span>
                  );
                })}
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                      dday.isUrgent
                        ? "bg-rose-100 text-rose-700 font-bold"
                        : dday.isPassed
                        ? "bg-slate-100 text-slate-400"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {dday.label}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {job.deadline} 마감
                  </span>
                </div>

                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {currentStatus}
                </span>
              </div>
            </div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-medium">
              선택한 조건에 부합하는 채용공고가 없습니다.
            </p>
            <p className="text-xs text-slate-400">
              필터 조건을 완화하거나 상단의 [+ 공고 직접 등록]을 통해 관심 기업을 추가해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
