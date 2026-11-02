import React, { useState, useEffect, useMemo } from "react";
import { Job, EventItem, Profile, RankedJob } from "./types";
import { demoJobs, initialProfile, dateAfter } from "./data/initialData";
import { calculateFit } from "./utils/fitCalculator";
import { exportToICS } from "./utils/calendarExport";

import { Header } from "./components/Header";
import { CalendarView } from "./components/CalendarView";
import { JobListView } from "./components/JobListView";
import { KanbanView } from "./components/KanbanView";
import { DiagnosticsView } from "./components/DiagnosticsView";
import { JobDetailDrawer } from "./components/JobDetailDrawer";
import { ProfileModal } from "./components/ProfileModal";
import { AddJobModal } from "./components/AddJobModal";
import { NotificationModal } from "./components/NotificationModal";

import {
  auth,
  loginWithGoogle,
  logoutUser,
  testConnection,
} from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  saveUserProfileToFirestore,
  loadUserProfileFromFirestore,
  saveUserJobDataToFirestore,
  loadUserJobDataFromFirestore,
  saveUserEventToFirestore,
  deleteUserEventFromFirestore,
  loadUserEventsFromFirestore,
} from "./services/firestoreSync";

import {
  Sparkles,
  Star,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Plus,
  RefreshCw,
  Bell,
  ShieldCheck,
} from "lucide-react";

function readSaved<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  // 1. Firebase Auth User State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // 2. Persistent State (Synced with localStorage and Firestore)
  const [profile, setProfile] = useState<Profile>(() =>
    readSaved("aca_profile", initialProfile)
  );
  const [jobs, setJobs] = useState<Job[]>(() =>
    readSaved("aca_jobs", demoJobs)
  );
  const [statuses, setStatuses] = useState<Record<number, string>>(() =>
    readSaved("aca_statuses", {})
  );
  const [favorites, setFavorites] = useState<number[]>(() =>
    readSaved("aca_favorites", [])
  );
  const [events, setEvents] = useState<EventItem[]>(() =>
    readSaved("aca_events", [])
  );
  const [notes, setNotes] = useState<Record<number, string>>(() =>
    readSaved("aca_notes", {})
  );

  // 3. Navigation & UI State
  const [currentView, setCurrentView] = useState<
    "calendar" | "list" | "kanban" | "diagnostics"
  >("calendar");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [minScore, setMinScore] = useState<number>(0);
  const [regionFilter, setRegionFilter] = useState<string>("전체");
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 4. Server Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [lastSyncInfo, setLastSyncInfo] = useState<{
    timestamp: string | null;
    message: string;
    scheduledCron: string;
  }>({
    timestamp: null,
    message: "연결 확인 중...",
    scheduledCron: "매일 오전 08:30 (Asia/Seoul)",
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  // Test connection to Firestore on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Listen for Firebase Auth state changes and sync account data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      setAuthReady(true);

      if (currentUser) {
        showToast(`${currentUser.displayName || currentUser.email} 님으로 로그인되었습니다.`);
        try {
          // Load User Profile from Firestore
          const remoteProfile = await loadUserProfileFromFirestore(currentUser.uid);
          if (remoteProfile) {
            setProfile(remoteProfile);
          } else {
            // First time login: seed current profile into Firestore
            await saveUserProfileToFirestore(currentUser.uid, profile, currentUser.email || "");
          }

          // Load User Job Interactivity (status, favorites, notes)
          const remoteJobData = await loadUserJobDataFromFirestore(currentUser.uid);
          if (remoteJobData) {
            setStatuses(prev => ({ ...prev, ...remoteJobData.statuses }));
            setFavorites(prev => Array.from(new Set([...prev, ...remoteJobData.favorites])));
            setNotes(prev => ({ ...prev, ...remoteJobData.notes }));
          }

          // Load User Events
          const remoteEvents = await loadUserEventsFromFirestore(currentUser.uid);
          if (remoteEvents && remoteEvents.length > 0) {
            setEvents(remoteEvents);
          }
        } catch (err: any) {
          console.error("Firestore user sync error:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Local storage backup sync
  useEffect(() => {
    localStorage.setItem("aca_profile", JSON.stringify(profile));
    if (user) {
      saveUserProfileToFirestore(user.uid, profile, user.email || "");
    }
  }, [profile, user]);

  useEffect(() => {
    localStorage.setItem("aca_jobs", JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem("aca_statuses", JSON.stringify(statuses));
  }, [statuses]);

  useEffect(() => {
    localStorage.setItem("aca_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("aca_events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("aca_notes", JSON.stringify(notes));
  }, [notes]);

  // Load jobs from Backend API (Saramin Open API crawler + cache)
  const fetchBackendJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.jobs) && data.jobs.length > 0) {
          setJobs(data.jobs);
        }
        setApiKeyConfigured(Boolean(data.saraminApiKeyConfigured));
        setLastSyncInfo({
          timestamp: data.lastSyncTimestamp,
          message: data.lastSyncStatus?.message || "수집 대기 중",
          scheduledCron: data.scheduledCron || "매일 오전 08:30 (Asia/Seoul)",
        });
      }
    } catch (err) {
      console.error("Failed to fetch jobs from server:", err);
    }
  };

  useEffect(() => {
    fetchBackendJobs();
  }, []);

  // Manual Trigger for Saramin Open API Sync
  const handleSyncSaramin = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/jobs/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchBackendJobs();
        showToast(data.message);
      } else {
        showToast(data.message || "사람인 API 수집에 실패했습니다.");
        await fetchBackendJobs();
      }
    } catch (err: any) {
      showToast(`수집 동기화 실패: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Login / Logout handlers
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      showToast(`로그인 실패: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      showToast("로그아웃되었습니다.");
    } catch (err: any) {
      showToast(`로그아웃 실패: ${err.message}`);
    }
  };

  // Ranked Jobs Calculation (Dynamic Fit based on profile)
  const rankedJobs = useMemo<RankedJob[]>(() => {
    return jobs
      .map(job => ({
        ...job,
        fit: calculateFit(job, profile),
      }))
      .sort((a, b) => b.fit.score - a.fit.score);
  }, [jobs, profile]);

  const activeJob = useMemo(() => {
    if (!selectedJobId) return null;
    return rankedJobs.find(j => j.id === selectedJobId) || null;
  }, [rankedJobs, selectedJobId]);

  // Unique regions
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach(j => set.add(j.region));
    return Array.from(set);
  }, [jobs]);

  // Key Statistics
  const today = dateAfter(0);
  const threeDaysAfter = dateAfter(3);
  const upcomingDeadlinesCount = useMemo(() => {
    return jobs.filter(
      j => j.deadline >= today && j.deadline <= threeDaysAfter
    ).length;
  }, [jobs, today, threeDaysAfter]);

  const liveSaraminCount = useMemo(() => {
    return jobs.filter(j => j.source === "saramin").length;
  }, [jobs]);

  // Handlers for user interactions
  const handleToggleFavorite = async (jobId: number) => {
    const isFav = favorites.includes(jobId);
    const nextFavorites = isFav
      ? favorites.filter(id => id !== jobId)
      : [...favorites, jobId];

    setFavorites(nextFavorites);
    showToast(isFav ? "관심 공고에서 제거되었습니다." : "관심 공고로 등록되었습니다.");

    if (user) {
      await saveUserJobDataToFirestore(
        user.uid,
        jobId,
        statuses[jobId] || "미지원",
        !isFav,
        notes[jobId] || ""
      );
    }
  };

  const handleStatusChange = async (jobId: number, newStatus: string) => {
    setStatuses(prev => ({ ...prev, [jobId]: newStatus }));
    showToast(`지원 상태가 '${newStatus}'(으)로 변경되었습니다.`);

    if (user) {
      await saveUserJobDataToFirestore(
        user.uid,
        jobId,
        newStatus,
        favorites.includes(jobId),
        notes[jobId] || ""
      );
    }
  };

  const handleAddEvent = async (eventData: Omit<EventItem, "id">) => {
    const newEvent: EventItem = {
      ...eventData,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setEvents(prev => [...prev, newEvent]);
    showToast(`'${eventData.type}' 일정이 캘린더에 추가되었습니다.`);

    if (user) {
      await saveUserEventToFirestore(user.uid, newEvent);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    showToast("일정이 삭제되었습니다.");

    if (user) {
      await deleteUserEventFromFirestore(user.uid, eventId);
    }
  };

  const handleSaveNotes = async (jobId: number, noteContent: string) => {
    setNotes(prev => ({ ...prev, [jobId]: noteContent }));

    if (user) {
      await saveUserJobDataToFirestore(
        user.uid,
        jobId,
        statuses[jobId] || "미지원",
        favorites.includes(jobId),
        noteContent
      );
    }
  };

  const handleAddCustomJob = (newJobData: Omit<Job, "id">) => {
    const newId = Math.max(0, ...jobs.map(j => j.id)) + 1;
    const createdJob: Job = {
      ...newJobData,
      id: newId,
      source: "custom",
      isLive: true,
    };
    setJobs(prev => [createdJob, ...prev]);
    setSelectedJobId(newId);
    showToast(`'${newJobData.company}' 공고가 등록되었습니다.`);
  };

  const handleDeleteJob = (jobId: number) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
    if (selectedJobId === jobId) {
      setSelectedJobId(null);
    }
    showToast("공고가 삭제되었습니다.");
  };

  const handleResetData = () => {
    if (window.confirm("공고 및 전형 상태 데이터를 초기값으로 재설정하시겠습니까?")) {
      setJobs(demoJobs);
      setProfile(initialProfile);
      setStatuses({});
      setFavorites([]);
      setEvents([]);
      setNotes({});
      setSelectedJobId(null);
      showToast("데이터가 초기 상태로 재설정되었습니다.");
    }
  };

  const handleExportICS = () => {
    exportToICS(jobs, events);
    showToast("캘린더 파일(.ics)이 다운로드되었습니다. 캘린더 앱에 추가하세요.");
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white antialiased">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main App Navigation Bar */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAddJob={() => setIsAddJobOpen(true)}
        onExportICS={handleExportICS}
        onSyncSaramin={handleSyncSaramin}
        isSyncing={isSyncing}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        apiKeyConfigured={apiKeyConfigured}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* System Integration Status Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            {apiKeyConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                사람인 Open API 활성화
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                데모 공고 모드 (실제 공고와 구분 표기됨)
              </span>
            )}

            {user ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Firestore 클라우드 동기화 중 ({user.email?.split("@")[0]})
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                게스트 로컬 저장소 모드 · Google 로그인 시 클라우드 영구 저장
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              📅 정기 수집: <strong>매일 08:30 KST</strong>
            </span>
            <button
              onClick={handleResetData}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition"
              title="데이터 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기화</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>총 관리 공고 (사람인 {liveSaraminCount}건)</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {jobs.length}
              <span className="text-xs font-normal text-slate-400 ml-1">건</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>적합도 80점 이상 (강력 추천)</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {rankedJobs.filter(j => j.fit.score >= 80).length}
              <span className="text-xs font-normal text-slate-400 ml-1">건</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>관심 저장 공고</span>
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600">
              {favorites.length}
              <span className="text-xs font-normal text-slate-400 ml-1">건</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>3일 내 마감 (D-3 이메일 대상)</span>
              <Clock className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-600">
              {upcomingDeadlinesCount}
              <span className="text-xs font-normal text-slate-400 ml-1">건</span>
            </div>
          </div>
        </div>

        {/* Main Work Area: Left View Component + Right Detail Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Selected View Container */}
          <div className="lg:col-span-8 space-y-4">
            {currentView === "calendar" && (
              <CalendarView
                jobs={rankedJobs}
                events={events}
                selectedJobId={selectedJobId}
                onSelectJob={setSelectedJobId}
                minScore={minScore}
                setMinScore={setMinScore}
                regionFilter={regionFilter}
                setRegionFilter={setRegionFilter}
                onlyFavorites={onlyFavorites}
                setOnlyFavorites={setOnlyFavorites}
                favorites={favorites}
                regions={availableRegions}
              />
            )}

            {currentView === "list" && (
              <JobListView
                jobs={rankedJobs}
                selectedJobId={selectedJobId}
                onSelectJob={setSelectedJobId}
                statuses={statuses}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                regions={availableRegions}
              />
            )}

            {currentView === "kanban" && (
              <KanbanView
                jobs={rankedJobs}
                statuses={statuses}
                onStatusChange={handleStatusChange}
                onSelectJob={setSelectedJobId}
                selectedJobId={selectedJobId}
              />
            )}

            {currentView === "diagnostics" && (
              <DiagnosticsView
                profile={profile}
                jobs={rankedJobs}
                onOpenProfile={() => setIsProfileOpen(true)}
              />
            )}

            {/* Quick High-Fit Jobs horizontal strip when in Calendar view */}
            {currentView === "calendar" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>내 프로필 기반 직무 적합도 높은 추천 공고</span>
                  </h3>
                  <button
                    onClick={() => setCurrentView("list")}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    전체 보기 &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {rankedJobs.slice(0, 4).map(job => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`cursor-pointer p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition ${
                        selectedJobId === job.id
                          ? "border-blue-600 bg-blue-50/20 ring-1 ring-blue-500"
                          : "border-slate-200 hover:border-blue-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          {job.source === "saramin" ? (
                            <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                              사람인
                            </span>
                          ) : (
                            <span className="text-[9px] bg-slate-400 text-white px-1.5 py-0.2 rounded font-bold">
                              데모
                            </span>
                          )}
                          <span className="font-bold text-xs text-slate-900">
                            {job.company}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                          {job.title} · {job.region}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span>서류 마감: {job.deadline}</span>
                          {job.deadlineChanged && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 px-1 rounded font-bold">
                              마감연장
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ${
                          job.fit.score >= 80
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {job.fit.score}점
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Job Detail / Criteria Explanation */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            {activeJob ? (
              <JobDetailDrawer
                job={activeJob}
                onClose={() => setSelectedJobId(null)}
                status={statuses[activeJob.id] || "미지원"}
                onStatusChange={s => handleStatusChange(activeJob.id, s)}
                isFavorite={favorites.includes(activeJob.id)}
                onToggleFavorite={() => handleToggleFavorite(activeJob.id)}
                events={events}
                onAddEvent={handleAddEvent}
                onDeleteEvent={handleDeleteEvent}
                notes={notes[activeJob.id] || ""}
                onSaveNotes={content => handleSaveNotes(activeJob.id, content)}
                onDeleteJob={handleDeleteJob}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    기업 상세정보 &amp; 전형 관리
                  </h3>
                  <p className="text-slate-500 mt-1">
                    캘린더 날짜의 공고 또는 목록의 기업 카드를 클릭하여 전형 일정, 상태, 메모를 기록하세요.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>실시간 직무 적합도 점수 산출 배점</span>
                  </h4>
                  <div className="space-y-1.5 text-slate-600 text-[11px]">
                    <div className="flex justify-between pb-1 border-b border-slate-200">
                      <span>• 희망 직무 (공고 제목/설명 일치)</span>
                      <strong className="text-slate-900">최대 40점</strong>
                    </div>
                    <div className="flex justify-between pb-1 border-b border-slate-200">
                      <span>• 보유 기술 (요구 툴 일치율)</span>
                      <strong className="text-slate-900">최대 30점</strong>
                    </div>
                    <div className="flex justify-between pb-1 border-b border-slate-200">
                      <span>• 희망 지역 (울산/경남/부산/경기 등)</span>
                      <strong className="text-slate-900">최대 20점</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• 전공 연관성 (기계/자동차 등)</span>
                      <strong className="text-slate-900">최대 10점</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-2">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-amber-700" />
                    <span>채용 마감 D-3 / D-1 자동 알림</span>
                  </span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    매일 오전 08:30 KST 수집 시 마감 3일 전과 1일 전 공고를 감지하여 이메일 알림을 발송합니다.
                  </p>
                  <button
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline"
                  >
                    알림 설정 &amp; 테스트 발송 &rarr;
                  </button>
                </div>

                <button
                  onClick={() => setIsAddJobOpen(true)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>새 채용공고 직접 추가하기</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Notice */}
        <footer className="pt-6 pb-4 text-center text-xs text-slate-500 border-t border-slate-200/80 space-y-1">
          <p className="font-medium text-slate-600">
            Auto Career AI · 자동차 취업 캘린더 &amp; 직무 적합도 기반 채용 관리 시스템
          </p>
          <p className="text-[11px] text-slate-400">
            사람인 Open API 정기 수집 (매일 08:30 KST) · Firebase Authentication &amp; Firestore 계정 연동
          </p>
        </footer>
      </main>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSaveProfile={newProfile => {
          setProfile(newProfile);
          showToast("취업 프로필이 성공적으로 저장되었습니다.");
        }}
      />

      <AddJobModal
        isOpen={isAddJobOpen}
        onClose={() => setIsAddJobOpen(false)}
        onAddJob={handleAddCustomJob}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        userEmail={user?.email || "kjkjkj1787@gmail.com"}
      />
    </div>
  );
}
