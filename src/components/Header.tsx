import React from "react";
import {
  Calendar,
  ListFilter,
  Kanban,
  Sparkles,
  Plus,
  SlidersHorizontal,
  CalendarArrowDown,
  Car,
  RefreshCw,
  LogIn,
  LogOut,
  Bell,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { User } from "firebase/auth";

export type ViewMode =
  | "calendar"
  | "list"
  | "kanban"
  | "diagnostics"
  | "resume"
  | "resume-analysis";

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenProfile: () => void;
  onOpenAddJob: () => void;
  onExportICS: () => void;
  onSyncSaramin: () => void;
  isSyncing: boolean;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenNotificationModal: () => void;
  apiKeyConfigured: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenProfile,
  onOpenAddJob,
  onExportICS,
  onSyncSaramin,
  isSyncing,
  user,
  onLogin,
  onLogout,
  onOpenNotificationModal,
  apiKeyConfigured,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
              <Car className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  Auto Career AI
                </h1>
                {apiKeyConfigured ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    사람인 API 연동됨
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    데모 공고 모드
                  </span>
                )}
                <span className="text-[10px] text-slate-400 border border-slate-700/60 px-1.5 py-0.5 rounded bg-slate-800/80">
                  매일 08:30 KST 수집
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                자동차 취업 캘린더 · 직무 적합도 기반 채용 관리 시스템
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Saramin Sync Button */}
            <button
              onClick={onSyncSaramin}
              disabled={isSyncing}
              title="사람인 채용공고 실시간 수집 및 마감일 갱신"
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                isSyncing
                  ? "bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed"
                  : "bg-blue-900/60 text-blue-200 border-blue-700/70 hover:bg-blue-800 hover:text-white"
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-blue-400 ${
                  isSyncing ? "animate-spin text-blue-300" : ""
                }`}
              />
              <span>{isSyncing ? "수집 동기화 중..." : "사람인 공고 수집"}</span>
            </button>

            {/* Email Notification Button */}
            <button
              onClick={onOpenNotificationModal}
              title="채용 마감 D-3 / D-1 이메일 알림 설정"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>마감 알림</span>
            </button>

            {/* ICS Export Button */}
            <button
              onClick={onExportICS}
              title="구글 캘린더, 아웃룩, 애플 캘린더로 일정 내보내기"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
            >
              <CalendarArrowDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>캘린더(.ics)</span>
            </button>

            {/* Profile Settings */}
            <button
              onClick={onOpenProfile}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span>내 프로필</span>
            </button>

            {/* Firebase Auth Account Button */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-700">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 rounded-lg text-xs text-slate-200 border border-slate-700 truncate max-w-[140px]"
                  title={user.email || user.displayName || "로그인됨"}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="truncate">{user.displayName || user.email?.split("@")[0]}</span>
                </div>
                <button
                  onClick={onLogout}
                  title="로그아웃"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google 로그인</span>
              </button>
            )}
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-800/80 pt-2 pb-2.5 scrollbar-none text-xs">
          <button
            onClick={() => onViewChange("calendar")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition ${
              currentView === "calendar"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>월간 캘린더</span>
          </button>

          <button
            onClick={() => onViewChange("list")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition ${
              currentView === "list"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>채용공고 목록</span>
          </button>

          <button
            onClick={() => onViewChange("kanban")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition ${
              currentView === "kanban"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>지원 전형 칸반 보드</span>
          </button>

          <button
            onClick={() => onViewChange("diagnostics")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition ${
              currentView === "diagnostics"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>스펙 매칭 진단</span>
          </button>

          <button
            onClick={() => onViewChange("resume")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition ${
              currentView === "resume"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>이력서 관리</span>
          </button>

          <button
            onClick={() => onViewChange("resume-analysis")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition ${
              currentView === "resume-analysis"
                ? "bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI 합격자 비교 분석</span>
          </button>
        </div>
      </div>
    </header>
  );
};
