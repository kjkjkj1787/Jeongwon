import React, { useState } from "react";
import { Job } from "../types";
import { dateAfter, POPULAR_AUTOMOTIVE_SKILLS, POPULAR_REGIONS } from "../data/initialData";
import { X, Briefcase, Plus, Link as LinkIcon } from "lucide-react";

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob: (job: Omit<Job, "id">) => void;
}

export const AddJobModal: React.FC<AddJobModalProps> = ({
  isOpen,
  onClose,
  onAddJob,
}) => {
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("울산");
  const [industry, setIndustry] = useState("자동차 부품 제조");
  const [skillsStr, setSkillsStr] = useState("CAD, CATIA");
  const [majorsStr, setMajorsStr] = useState("기계, 자동차");
  const [deadline, setDeadline] = useState(dateAfter(14));
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !title.trim()) return;

    const skills = skillsStr
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    const majors = majorsStr
      .split(",")
      .map(m => m.trim())
      .filter(Boolean);

    onAddJob({
      company: company.trim(),
      title: title.trim(),
      region: region.trim(),
      industry: industry.trim(),
      skills,
      majors,
      deadline,
      url: url.trim(),
      description: description.trim() || "직무 상세 내용 참조",
      isCustom: true,
    });

    // Reset fields
    setCompany("");
    setTitle("");
    setDescription("");
    setUrl("");
    onClose();
  };

  const handleAddSkillTag = (skill: string) => {
    const list = skillsStr.split(",").map(s => s.trim()).filter(Boolean);
    if (!list.includes(skill)) {
      setSkillsStr([...list, skill].join(", "));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">새 채용공고 등록</h2>
              <p className="text-xs text-slate-500">
                관심 있는 채용공고를 직접 등록하여 캘린더와 적합도를 통합 관리하세요.
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                기업명 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="예: 현대모비스, HL만도"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                채용 제목/직무 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예: 샤시 기구설계 엔지니어"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                근무지 <span className="text-rose-500">*</span>
              </label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {POPULAR_REGIONS.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                산업/업종
              </label>
              <input
                type="text"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                placeholder="예: 자동차 부품 제조"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                서류 마감일 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                요구 기술/역량 (쉼표로 구분)
              </label>
              <span className="text-[11px] text-slate-400">클릭하여 추가</span>
            </div>
            <input
              type="text"
              value={skillsStr}
              onChange={e => setSkillsStr(e.target.value)}
              placeholder="예: CATIA, CAD, SimSolid, 생산기술"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {POPULAR_AUTOMOTIVE_SKILLS.slice(0, 10).map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => handleAddSkillTag(s)}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  +{s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                우대/필수 전공 (쉼표로 구분)
              </label>
              <input
                type="text"
                value={majorsStr}
                onChange={e => setMajorsStr(e.target.value)}
                placeholder="예: 기계, 자동차, 전기"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                채용공고 링크 URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-7 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              직무 상세 설명 / 주요 업무
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="예: 전기차 배터리 시스템 케이스 설계, 충돌 구조 강성 해석 및 고객사 기술 승인 업무 등"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>공고 추가하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
