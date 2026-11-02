import React, { useState } from "react";
import { EventItem, RankedJob, STATUS_OPTIONS, StatusType, EVENT_TYPES } from "../types";
import { dateAfter } from "../data/initialData";
import {
  X,
  Star,
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Sparkles,
} from "lucide-react";

interface JobDetailDrawerProps {
  job: RankedJob | null;
  onClose: () => void;
  status: string;
  onStatusChange: (status: string) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  events: EventItem[];
  onAddEvent: (event: Omit<EventItem, "id">) => void;
  onDeleteEvent: (eventId: string) => void;
  notes: string;
  onSaveNotes: (notes: string) => void;
  onDeleteJob?: (jobId: number) => void;
  onAnalyzeResume?: (jobId: number) => void;
}

export const JobDetailDrawer: React.FC<JobDetailDrawerProps> = ({
  job,
  onClose,
  status,
  onStatusChange,
  isFavorite,
  onToggleFavorite,
  events,
  onAddEvent,
  onDeleteEvent,
  notes,
  onSaveNotes,
  onDeleteJob,
  onAnalyzeResume,
}) => {
  const [eventType, setEventType] = useState<string>("인적성 검사");
  const [eventDate, setEventDate] = useState<string>(dateAfter(7));
  const [memo, setMemo] = useState<string>(notes);

  React.useEffect(() => {
    setMemo(notes);
  }, [notes, job?.id]);

  if (!job) return null;

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate) return;
    onAddEvent({
      jobId: job.id,
      date: eventDate,
      type: eventType,
    });
  };

  const handleBlurNotes = () => {
    onSaveNotes(memo);
  };

  const jobEvents = events
    .filter(e => e.jobId === job.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {job.source === "saramin" ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                사람인 실시간 공고
              </span>
            ) : job.isCustom ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                직접 등록
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                데모 가상 공고
              </span>
            )}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {job.industry}
            </span>
          </div>
          {job.deadlineChanged && (
            <div className="mt-1 text-[11px] p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
              🔔 사람인 마감일 갱신: 기존 {job.previousDeadline} ➔ 변경 {job.deadline}
            </div>
          )}
          <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-500" />
            {job.company}
          </h2>
          <h3 className="text-sm font-semibold text-blue-700">{job.title}</h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleFavorite}
            title={isFavorite ? "관심 공고 해제" : "관심 공고 등록"}
            className={`p-2 rounded-lg border transition ${
              isFavorite
                ? "bg-amber-50 text-amber-500 border-amber-300"
                : "bg-slate-50 text-slate-400 hover:text-slate-600 border-slate-200"
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? "fill-amber-400" : ""}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Details Badges */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-slate-400 font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>근무지</span>
          </div>
          <div className="text-slate-800 font-semibold mt-0.5">
            {job.region}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span>서류 마감일</span>
          </div>
          <div className="text-rose-600 font-semibold mt-0.5">
            {job.deadline}
          </div>
        </div>
      </div>

      {/* Job Description */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 mb-1">직무 내용 요약</h4>
        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
          {job.description}
        </p>
      </div>

      {/* Fit Score & Breakdown */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
            직무 종합 적합도
          </span>
          <span className="text-xl font-extrabold text-blue-700">
            {job.fit.score}
            <span className="text-xs font-normal text-slate-500 ml-0.5">/ 100점</span>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-blue-200/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              job.fit.score >= 80
                ? "bg-emerald-500"
                : job.fit.score >= 60
                ? "bg-blue-600"
                : "bg-slate-400"
            }`}
            style={{ width: `${job.fit.score}%` }}
          />
        </div>

        {/* Breakdown Badges */}
        <div className="grid grid-cols-4 gap-1 text-center pt-1">
          <div className="bg-white/80 p-1.5 rounded-lg border border-blue-100/60">
            <div className="text-[10px] text-slate-500">직무(40)</div>
            <div className="text-xs font-bold text-slate-800">{job.fit.roleScore}</div>
          </div>
          <div className="bg-white/80 p-1.5 rounded-lg border border-blue-100/60">
            <div className="text-[10px] text-slate-500">기술(30)</div>
            <div className="text-xs font-bold text-slate-800">{job.fit.skillScore}</div>
          </div>
          <div className="bg-white/80 p-1.5 rounded-lg border border-blue-100/60">
            <div className="text-[10px] text-slate-500">지역(20)</div>
            <div className="text-xs font-bold text-slate-800">{job.fit.regionScore}</div>
          </div>
          <div className="bg-white/80 p-1.5 rounded-lg border border-blue-100/60">
            <div className="text-[10px] text-slate-500">전공(10)</div>
            <div className="text-xs font-bold text-slate-800">{job.fit.majorScore}</div>
          </div>
        </div>

        {/* Skills Match vs Missing */}
        <div className="pt-2 border-t border-blue-200/40 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-emerald-800 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              보유 일치 기술:
            </span>
            {job.fit.matchedSkills.length > 0 ? (
              job.fit.matchedSkills.map(s => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium text-[11px]"
                >
                  {s}
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-[11px]">일치 기술 없음</span>
            )}
          </div>

          {job.fit.missingSkills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-500 inline-flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                추가 권장 기술:
              </span>
              {job.fit.missingSkills.map(s => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 text-[11px]"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Application Status Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 block">
          지원 전형 상태 관리
        </label>
        <select
          value={status || "미지원"}
          onChange={e => onStatusChange(e.target.value)}
          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Recruitment Milestones & Personal Calendar Events */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>채용 전형 일정 ({jobEvents.length})</span>
          </h4>
        </div>

        {/* Add Event Form */}
        <form onSubmit={handleAddEvent} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                전형 단계
              </label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                {EVENT_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                일정 일자
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>캘린더에 일정 등록</span>
          </button>
        </form>

        {/* Event List */}
        {jobEvents.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {jobEvents.map(evt => (
              <div
                key={evt.id}
                className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900"
              >
                <div>
                  <span className="font-semibold text-amber-950 mr-1.5">
                    {evt.type}
                  </span>
                  <span className="text-[11px] text-amber-700">{evt.date}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteEvent(evt.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="일정 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personal Notes / Memo */}
      <div className="space-y-1.5 pt-3 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>지원 메모 & 자소서 핵심 포인트</span>
        </label>
        <textarea
          rows={3}
          value={memo}
          onChange={e => setMemo(e.target.value)}
          onBlur={handleBlurNotes}
          placeholder="예: 3번 자소서 문항에 CATIA 배터리 모듈 설계 프로젝트 경험 강조. 면접 대비 전기차 열관리 동향 체크"
          className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
        />
        <div className="text-[10px] text-slate-400 text-right">
          입력 후 포커스를 벗어나면 자동 저장됩니다.
        </div>
      </div>

      {/* External Link & Actions */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <button
          onClick={() => onAnalyzeResume && onAnalyzeResume(job.id)}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs transition shadow-xs"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>AI 이력서 경쟁력 분석</span>
        </button>

        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs"
          >
            <span>채용공고 원문 페이지 이동</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <div className="text-center py-2 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200/50">
            데모 공고 또는 등록된 링크가 없습니다.
          </div>
        )}

        {job.isCustom && onDeleteJob && (
          <button
            onClick={() => onDeleteJob(job.id)}
            className="w-full inline-flex items-center justify-center gap-1 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>이 공고 삭제하기</span>
          </button>
        )}
      </div>
    </div>
  );
};
