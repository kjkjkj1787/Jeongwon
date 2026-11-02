import React from "react";
import { Profile, RankedJob } from "../types";
import { splitKeywords } from "../utils/fitCalculator";
import {
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Building,
  Target,
} from "lucide-react";

interface DiagnosticsViewProps {
  profile: Profile;
  jobs: RankedJob[];
  onOpenProfile: () => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  profile,
  jobs,
  onOpenProfile,
}) => {
  const userSkills = splitKeywords(profile.skills);
  const userRoles = splitKeywords(profile.roles);

  // Calculate demand frequency of all skills in current postings
  const skillDemandMap: Record<string, number> = {};
  jobs.forEach(job => {
    job.skills.forEach(skill => {
      const normalized = skill.toLowerCase();
      skillDemandMap[normalized] = (skillDemandMap[normalized] || 0) + 1;
    });
  });

  const sortedSkillsDemand = Object.entries(skillDemandMap)
    .sort((a, b) => b[1] - a[1])
    .map(([skill, count]) => {
      const userHasIt = userSkills.some(
        u => u.includes(skill) || skill.includes(u)
      );
      return { skill, count, userHasIt };
    });

  // Top high-impact missing skills
  const missingHighImpactSkills = sortedSkillsDemand.filter(s => !s.userHasIt);

  // Average score
  const avgScore = jobs.length
    ? Math.round(jobs.reduce((acc, j) => acc + j.fit.score, 0) / jobs.length)
    : 0;

  const topFitJobs = [...jobs].sort((a, b) => b.fit.score - a.fit.score).slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              자동차 취업 스펙 &amp; 직무 적합도 진단실
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            등록된 채용공고의 실시간 요구 역량과 내 프로필을 비교 분석한 심층 리포트입니다.
          </p>
        </div>

        <button
          onClick={onOpenProfile}
          className="text-xs font-semibold px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition border border-blue-200"
        >
          내 프로필 스펙 수정하기
        </button>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Target className="w-4 h-4 text-blue-600" />
            <span>등록 공고 평균 적합도</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{avgScore}점</span>
            <span className="text-xs text-slate-500">/ 100점 만점</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600">
            {avgScore >= 75
              ? "🚀 목표 직무군과 보유 스펙의 일치도가 매우 높습니다."
              : "💡 추가 기술 키워드 보강 시 점수 향상이 가능합니다."}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>강력 추천 공고 (80점 이상)</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              {jobs.filter(j => j.fit.score >= 80).length}개
            </span>
            <span className="text-xs text-slate-500">/ 총 {jobs.length}개 중</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600">
            즉시 서류 접수 및 자소서 작성을 추천하는 핵심 타깃입니다.
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span>내 보유 역량 커버율</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">
              {userSkills.length}개 보유
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600">
            전공: {profile.major} · 지역: {profile.regions}
          </div>
        </div>
      </div>

      {/* Market Demand vs User Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Most Demanded Skills in Automotive */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <h3 className="text-xs font-bold text-slate-900 flex items-center justify-between">
            <span>자동차/모빌리티 공고 다빈도 요구 기술</span>
            <span className="text-[11px] text-slate-400 font-normal">요구 공고 수</span>
          </h3>

          <div className="space-y-2">
            {sortedSkillsDemand.slice(0, 7).map(item => (
              <div
                key={item.skill}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs"
              >
                <div className="flex items-center gap-2">
                  {item.userHasIt ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="font-semibold uppercase text-slate-800">
                    {item.skill}
                  </span>
                  {item.userHasIt && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                      보유 중
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-600">
                  {item.count}개 공고 요구
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Strategy Recommendations */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
          <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span>점수 상승을 위한 맞춤 공략 제안</span>
          </h3>

          <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
            {missingHighImpactSkills.length > 0 ? (
              <div className="p-2.5 rounded-lg bg-white border border-amber-200/80">
                <span className="font-bold text-amber-900 block mb-1">
                  1. 핵심 툴/키워드 보강 추천
                </span>
                공고에서 자주 요구하지만 현재 프로필에 미등록된 기술:{" "}
                <strong className="text-blue-700 uppercase">
                  {missingHighImpactSkills
                    .slice(0, 3)
                    .map(s => s.skill)
                    .join(", ")}
                </strong>
                . 프로젝트 경험이나 교육 이력이 있다면 프로필에 추가하여 즉시 점수를 상승시킬 수 있습니다.
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-white border border-emerald-200">
                <span className="font-bold text-emerald-800 block mb-1">
                  핵심 요구 역량 완벽 보유!
                </span>
                공고에서 요구하는 주요 툴과 스펙을 대부분 프로필에 보유하고 있습니다.
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">
                2. 직무 가중치(40점) 극대화 전략
              </span>
              현재 설정된 희망 직무:{" "}
              <span className="font-medium text-blue-700">{profile.roles}</span>.
              자동차 채용은 생산기술/공정기술, 품질관리(QE/QA), 기계설계(샤시/차체/배터리팩), 시험평가(NVH/내구)로 특화되므로 공고별 직무 기술서에 맞춘 키워드 튜닝이 핵심입니다.
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">
                3. 지역 클러스터(20점) 매칭
              </span>
              현재 타깃 지역:{" "}
              <span className="font-medium text-blue-700">{profile.regions}</span>.
              울산·창원·부산권의 영남권 자동차 밸리와 경기·충남권의 수도권/중부권 전장 연구소를 동시에 포괄하면 지원 가능한 풀이 2배로 확장됩니다.
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Fit jobs highlight */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
        <h3 className="text-xs font-bold text-slate-800">
          내 프로필 기준 최고 적합도 TOP 3 공고
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {topFitJobs.map((j, idx) => (
            <div
              key={j.id}
              className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-500">#{idx + 1}</span>
                  <span className="font-black text-emerald-600">{j.fit.score}점</span>
                </div>
                <div className="font-bold text-xs text-slate-900">{j.company}</div>
                <div className="text-[11px] text-blue-700 mt-0.5">{j.title}</div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                마감: {j.deadline} ({j.region})
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
