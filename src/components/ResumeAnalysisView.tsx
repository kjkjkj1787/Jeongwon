import React, { useState } from "react";
import { Job, ResumeRecord, ResumeAnalysisRecord } from "../types";
import {
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Building2,
  ShieldCheck,
  FileText,
  Clock,
  Trash2,
  BarChart3,
  HelpCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface ResumeAnalysisViewProps {
  jobs: Job[];
  resumes: ResumeRecord[];
  analyses: ResumeAnalysisRecord[];
  selectedJobId: number | null;
  onSelectJobId: (jobId: number) => void;
  activeResumeId: string | null;
  onSelectActiveResumeId: (resumeId: string) => void;
  onSaveAnalysis: (analysis: ResumeAnalysisRecord) => void;
  onDeleteAnalysis: (analysisId: string) => void;
  onNavigateToResumes: () => void;
}

export const ResumeAnalysisView: React.FC<ResumeAnalysisViewProps> = ({
  jobs,
  resumes,
  analyses,
  selectedJobId,
  onSelectJobId,
  activeResumeId,
  onSelectActiveResumeId,
  onSaveAnalysis,
  onDeleteAnalysis,
  onNavigateToResumes,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<ResumeAnalysisRecord | null>(() => {
    if (analyses.length > 0) return analyses[0];
    return null;
  });
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const targetJob = jobs.find(j => j.id === selectedJobId) || jobs[0];
  const targetResume = resumes.find(r => r.id === activeResumeId) || resumes[0];

  const handleRunAnalysis = async () => {
    if (!targetResume) {
      setAnalysisError("분석할 이력서가 없습니다. 먼저 이력서를 등록해 주세요.");
      return;
    }
    if (!targetJob) {
      setAnalysisError("비교할 채용공고를 선택해 주세요.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: targetResume.structuredData,
          job: targetJob,
          userId: "current-user",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "분석 요청에 실패했습니다.");
      }

      const record: ResumeAnalysisRecord = {
        ...data.analysis,
        resumeId: targetResume.id,
        resumeTitle: targetResume.title,
        resumeVersion: targetResume.version,
        jobId: targetJob.id,
        companyName: targetJob.company,
        jobTitle: targetJob.title,
      };

      setCurrentAnalysis(record);
      onSaveAnalysis(record);
    } catch (err: any) {
      setAnalysisError(err.message || "분석 실행 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              AI 합격자 이력서 비교 경쟁력 분석실
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            지원하려는 기업의 채용공고와 공인된 실제 합격자 사례 데이터를 비교 분석하여 구체적인 보완점을 도출합니다.
          </p>
        </div>

        {resumes.length === 0 && (
          <button
            onClick={onNavigateToResumes}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
          >
            <span>이력서 먼저 등록하기 &rarr;</span>
          </button>
        )}
      </div>

      {/* Target Selection Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end">
        {/* Job Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            비교 대상 채용공고
          </label>
          <select
            value={targetJob ? targetJob.id : ""}
            onChange={e => onSelectJobId(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                [{j.company}] {j.title} ({j.region})
              </option>
            ))}
          </select>
        </div>

        {/* Resume Version Selector */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">
              내 이력서 버전
            </label>
            <button
              onClick={onNavigateToResumes}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
            >
              + 새 버전 등록
            </button>
          </div>
          <select
            value={targetResume ? targetResume.id : ""}
            onChange={e => onSelectActiveResumeId(e.target.value)}
            disabled={resumes.length === 0}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {resumes.map(r => (
              <option key={r.id} value={r.id}>
                {r.title} ({r.version})
              </option>
            ))}
            {resumes.length === 0 && (
              <option value="">등록된 이력서 없음</option>
            )}
          </select>
        </div>

        {/* Execute Button */}
        <div>
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || resumes.length === 0}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>
              {isAnalyzing
                ? "공고 및 합격자 사례 비교 중..."
                : "AI 이력서 경쟁력 분석 실행"}
            </span>
          </button>
        </div>
      </div>

      {analysisError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{analysisError}</span>
        </div>
      )}

      {/* Main Analysis Results Card */}
      {currentAnalysis ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Target Info Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs flex-wrap gap-2">
            <div>
              <span className="font-semibold text-blue-900">
                분석 대상: {currentAnalysis.companyName} - {currentAnalysis.jobTitle}
              </span>
              <span className="text-slate-500 ml-2">
                (이력서: {currentAnalysis.resumeTitle} {currentAnalysis.resumeVersion})
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              분석 일시: {currentAnalysis.createdAt.replace("T", " ").slice(0, 16)}
            </div>
          </div>

          {/* Top Score Comparison Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Job Requirement Match Score */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500">
                    기업 채용 요건 일치도
                  </span>
                  <p className="text-[11px] text-slate-400">
                    전공, 요구 기술, 프로젝트 적합성 정밀 매칭
                  </p>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-700">
                  {currentAnalysis.requirementMatchScore}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    / 100점
                  </span>
                </div>
              </div>

              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                  style={{ width: `${currentAnalysis.requirementMatchScore}%` }}
                />
              </div>

              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {currentAnalysis.rationale}
              </div>
            </div>

            {/* 2. Accepted Profile Similarity Score */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500">
                    공인 합격자 사례 유사도
                  </span>
                  <p className="text-[11px] text-slate-400">
                    동일/유사 기업 및 직무 합격자 스펙 경험치 비교
                  </p>
                </div>
                {currentAnalysis.acceptedProfileSimilarity !== null ? (
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                    {currentAnalysis.acceptedProfileSimilarity}
                    <span className="text-xs font-normal text-slate-400 ml-1">
                      / 100점
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">
                    사례 미보유
                  </span>
                )}
              </div>

              {currentAnalysis.acceptedProfileSimilarity !== null ? (
                <>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-700"
                      style={{
                        width: `${currentAnalysis.acceptedProfileSimilarity}%`,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    ✓ 검증된 합격자 데이터베이스 {currentAnalysis.sampleCount}건과 비교되었습니다.
                  </div>
                </>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <strong>비교 가능한 공인 합격자 사례가 없습니다.</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    * 가상 데이터를 임의로 지어내지 않으며, 채용공고의 실질 요건 일치도 분석만을 정직하게 제공합니다.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Legal / Ethics Disclaimer Banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>
                <strong>안내:</strong> 본 점수는 공고 및 합격자 사례 간의 직무 역량 유사도이며, 채용 당락을 보증하는 실제 합격 확률이 아닙니다.
              </span>
            </span>
            <span className="text-[10px] text-slate-400 shrink-0">
              출신 학교, 성별, 나이 평가 배제됨
            </span>
          </div>

          {/* Detailed Qualitative Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths TOP 3 */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2.5">
              <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>지원자의 강점 (TOP 3)</span>
              </h3>
              <div className="space-y-2">
                {currentAnalysis.strengths.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white border border-emerald-200 text-xs text-slate-700 leading-relaxed"
                  >
                    <strong className="text-emerald-700 mr-1.5">#{idx + 1}</strong>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses TOP 3 */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2.5">
              <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>보완이 필요한 항목 (TOP 3)</span>
              </h3>
              <div className="space-y-2">
                {currentAnalysis.weaknesses.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white border border-amber-200 text-xs text-slate-700 leading-relaxed"
                  >
                    <strong className="text-amber-700 mr-1.5">#{idx + 1}</strong>
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project & Skills Competitiveness Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>프로젝트 경쟁력 평가</span>
              </h4>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {currentAnalysis.projectCompetitiveness}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>보유 기술 및 자격증 연관성</span>
              </h4>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {currentAnalysis.skillsCompetitiveness}
              </p>
            </div>
          </div>

          {/* Unfulfilled / Missing Requirements */}
          {currentAnalysis.missingRequirements?.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <h4 className="text-xs font-bold text-slate-800">
                공고 요구사항 중 추가 보강 권장 역량
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {currentAnalysis.missingRequirements.map(req => (
                  <span
                    key={req}
                    className="px-2 py-1 rounded bg-slate-200/80 text-slate-700 text-xs font-medium"
                  >
                    • {req}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Recommendations */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/60 border border-indigo-200 space-y-3">
            <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              <span>이력서 및 자기소개서 구체적 개선 권장사항</span>
            </h3>
            <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
              {currentAnalysis.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs"
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Accepted Profile Sample Sources List (If any) */}
          {currentAnalysis.acceptedProfileSources && currentAnalysis.acceptedProfileSources.length > 0 && (
            <div className="text-[11px] text-slate-400 space-y-0.5 border-t border-slate-100 pt-3">
              <p className="font-semibold text-slate-500">
                비교 분석에 참조된 합격자 사례 출처:
              </p>
              {currentAnalysis.acceptedProfileSources.map((src, i) => (
                <p key={i}>• {src}</p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            상단에서 기업과 이력서를 선택한 후 [AI 이력서 경쟁력 분석 실행]을 클릭하세요.
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            공고의 요구역량과 검증된 실제 합격자 사례 데이터를 바탕으로 강점과 구체적인 보완 가이드를 제공합니다.
          </p>
        </div>
      )}

      {/* Analysis History List */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>분석 기록 및 재조회 ({analyses.length}건)</span>
        </h3>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {analyses.map(item => (
            <div
              key={item.id}
              onClick={() => setCurrentAnalysis(item)}
              className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition ${
                currentAnalysis?.id === item.id
                  ? "border-blue-600 bg-blue-50/20 ring-1 ring-blue-500"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    {item.companyName}
                  </span>
                  <span className="text-[11px] text-blue-700 font-semibold">
                    {item.jobTitle}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({item.resumeVersion})
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  일치도: {item.requirementMatchScore}점 ·{" "}
                  {item.acceptedProfileSimilarity !== null
                    ? `사례 유사도: ${item.acceptedProfileSimilarity}점`
                    : "사례 없음"}
                  {" · "}
                  {item.createdAt.slice(0, 10)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteAnalysis(item.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="기록 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {analyses.length === 0 && (
            <div className="text-center py-5 text-slate-400 text-xs">
              아직 저장된 분석 이력이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
