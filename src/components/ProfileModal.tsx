import React from "react";
import { Profile } from "../types";
import {
  POPULAR_AUTOMOTIVE_SKILLS,
  POPULAR_MAJORS,
  POPULAR_REGIONS,
  POPULAR_ROLES,
  initialProfile,
} from "../data/initialData";
import { X, UserCheck, RotateCcw, Check, Sparkles } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onSaveProfile: (profile: Profile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = React.useState<Profile>(profile);

  React.useEffect(() => {
    setFormData(profile);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const toggleArrayItem = (
    field: "skills" | "roles" | "regions",
    item: string
  ) => {
    const currentList = formData[field]
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const exists = currentList.some(
      s => s.toLowerCase() === item.toLowerCase()
    );

    let nextList: string[];
    if (exists) {
      nextList = currentList.filter(
        s => s.toLowerCase() !== item.toLowerCase()
      );
    } else {
      nextList = [...currentList, item];
    }

    setFormData(prev => ({
      ...prev,
      [field]: nextList.join(", "),
    }));
  };

  const handleReset = () => {
    setFormData(initialProfile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  const currentSkillsList = formData.skills
    .split(",")
    .map(s => s.trim().toLowerCase());
  const currentRolesList = formData.roles
    .split(",")
    .map(s => s.trim().toLowerCase());
  const currentRegionsList = formData.regions
    .split(",")
    .map(s => s.trim().toLowerCase());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                나의 맞춤 취업 프로필
              </h2>
              <p className="text-xs text-slate-500">
                프로필 정보를 기반으로 자동차/모빌리티 공고 적합도(100점 만점)가 실시간 계산됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Major */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                전공 (연관도 10점)
              </label>
              <span className="text-[11px] text-slate-400">
                직접 입력 또는 아래 추천 전공 클릭
              </span>
            </div>
            <input
              type="text"
              value={formData.major}
              onChange={e =>
                setFormData(prev => ({ ...prev, major: e.target.value }))
              }
              placeholder="예: 기계자동차공학, 기계공학과"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR_MAJORS.map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setFormData(p => ({ ...p, major: m }))}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                    formData.major === m
                      ? "bg-blue-600 text-white border-blue-600 font-medium"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Target Roles */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                희망 직무 (가중치 40점 · 쉼표로 구분)
              </label>
              <span className="text-[11px] text-slate-400">
                공고 제목/설명 매칭
              </span>
            </div>
            <input
              type="text"
              value={formData.roles}
              onChange={e =>
                setFormData(prev => ({ ...prev, roles: e.target.value }))
              }
              placeholder="예: 생산기술, 품질관리, 기계설계, 시험평가"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR_ROLES.map(role => {
                const isSelected = currentRolesList.includes(role.toLowerCase());
                return (
                  <button
                    type="button"
                    key={role}
                    onClick={() => toggleArrayItem("roles", role)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition inline-flex items-center gap-1 ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 border-blue-300 font-semibold"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                보유 기술 및 툴 (가중치 30점 · 쉼표로 구분)
              </label>
              <span className="text-[11px] text-slate-400">
                공고 요구 역량과 비율 매칭
              </span>
            </div>
            <input
              type="text"
              value={formData.skills}
              onChange={e =>
                setFormData(prev => ({ ...prev, skills: e.target.value }))
              }
              placeholder="예: CAD, CATIA, Inventor, MATLAB, SimSolid"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
            <div className="flex flex-wrap gap-1.5 mt-2 max-h-28 overflow-y-auto pr-1">
              {POPULAR_AUTOMOTIVE_SKILLS.map(skill => {
                const isSelected = currentSkillsList.includes(
                  skill.toLowerCase()
                );
                return (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => toggleArrayItem("skills", skill)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition inline-flex items-center gap-1 ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Regions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                희망 근무 지역 (가중치 20점 · 쉼표로 구분)
              </label>
              <span className="text-[11px] text-slate-400">
                자동차/부품 클러스터 중심
              </span>
            </div>
            <input
              type="text"
              value={formData.regions}
              onChange={e =>
                setFormData(prev => ({ ...prev, regions: e.target.value }))
              }
              placeholder="예: 울산, 부산, 경남, 경기"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR_REGIONS.map(region => {
                const isSelected = currentRegionsList.includes(
                  region.toLowerCase()
                );
                return (
                  <button
                    type="button"
                    key={region}
                    onClick={() => toggleArrayItem("regions", region)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition inline-flex items-center gap-1 ${
                      isSelected
                        ? "bg-amber-50 text-amber-800 border-amber-300 font-semibold"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-amber-600" />}
                    {region}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scoring guide card */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>적합도 점수 산출 배점 안내</span>
            </div>
            <p>
              • <strong>직무 적합도 (40점)</strong>: 희망 직무 키워드가 공고 제목 또는 직무 설명에 포함 시 부여
            </p>
            <p>
              • <strong>기술 일치도 (30점)</strong>: 공고에서 요구하는 기술 목록 중 보유한 기술의 비율로 환산
            </p>
            <p>
              • <strong>지역 적합도 (20점)</strong>: 희망 근무 권역과 일치할 시 부여
            </p>
            <p>
              • <strong>전공 연관성 (10점)</strong>: 기계/자동차/산업공학 등 요구 전공 부합 시 부여
            </p>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 py-2 px-3 rounded-lg hover:bg-slate-100 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기값 복원</span>
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition"
              >
                프로필 적용 및 저장
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
