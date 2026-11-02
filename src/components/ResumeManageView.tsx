import React, { useState } from "react";
import { ResumeRecord, StructuredResume, ResumeProject, WorkExperience } from "../types";
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Eye,
  ShieldCheck,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";

interface ResumeManageViewProps {
  resumes: ResumeRecord[];
  onSaveResume: (resume: ResumeRecord) => void;
  onDeleteResume: (resumeId: string) => void;
  activeResumeId: string | null;
  onSelectActiveResume: (resumeId: string) => void;
  onNavigateToAnalysis: () => void;
}

export const ResumeManageView: React.FC<ResumeManageViewProps> = ({
  resumes,
  onSaveResume,
  onDeleteResume,
  activeResumeId,
  onSelectActiveResume,
  onNavigateToAnalysis,
}) => {
  const [inputMode, setInputMode] = useState<"file" | "text">("file");
  const [rawText, setRawText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Resume editing & review state (before saving)
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [title, setTitle] = useState("자동차 엔지니어 이력서");
  const [version, setVersion] = useState("v1.0");

  const [formData, setFormData] = useState<StructuredResume>({
    major: "기계자동차공학과",
    education: "대학교(4년제) 졸업예정",
    certifications: ["일반기계기사"],
    skills: ["CATIA", "CAD", "MATLAB", "SimSolid"],
    projects: [
      {
        title: "EV 감속기 모듈 3D 모델링 및 치형 접촉 해석",
        period: "2024.03 - 2024.06",
        role: "설계 및 유한요소해석 담당",
        techStack: ["CATIA", "SimSolid"],
        description: "전기차 감속기 경량화 기구설계 및 기어 치면 접촉 응력 해석을 통한 피로 안전율 1.8 확보",
        outcome: "캡스톤디자인 모빌리티 부문 우수상",
      },
    ],
    workExperience: [],
    awards: ["교내 캡스톤디자인 경진대회 우수상"],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg(null);
      if (!title || title === "자동차 엔지니어 이력서") {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleExtract = async () => {
    if (!consentGiven) {
      setErrorMsg("이력서 분석 및 보관 동의 체크박스에 동의해 주세요.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let bodyPayload: any = {};

      if (inputMode === "file") {
        if (!selectedFile) {
          setErrorMsg("업로드할 PDF 또는 DOCX 파일을 선택해 주세요.");
          setIsProcessing(false);
          return;
        }

        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });

        reader.readAsDataURL(selectedFile);
        const base64Data = await base64Promise;

        bodyPayload = {
          fileData: base64Data,
          fileName: selectedFile.name,
          fileType: selectedFile.name.split(".").pop(),
        };
      } else {
        if (!rawText.trim()) {
          setErrorMsg("직접 입력할 이력서 텍스트를 입력해 주세요.");
          setIsProcessing(false);
          return;
        }
        bodyPayload = {
          rawInputText: rawText.trim(),
        };
      }

      const res = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "추출에 실패했습니다.");
      }

      setFormData(data.structuredData);
      setEditingResumeId(null);
      setIsReviewOpen(true);
    } catch (err: any) {
      setErrorMsg(err.message || "이력서 파싱 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveVerifiedResume = () => {
    const resumeId = editingResumeId || `res-${Date.now()}`;
    const newRecord: ResumeRecord = {
      id: resumeId,
      userId: "user-current",
      title: title.trim() || "이력서",
      version: version.trim() || "v1.0",
      fileName: selectedFile?.name,
      structuredData: formData,
      consentGiven: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveResume(newRecord);
    onSelectActiveResume(resumeId);
    setIsReviewOpen(false);
    setSelectedFile(null);
    setRawText("");
  };

  const handleOpenEditExisting = (resume: ResumeRecord) => {
    setEditingResumeId(resume.id);
    setTitle(resume.title);
    setVersion(resume.version);
    setFormData(resume.structuredData);
    setIsReviewOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <FileText className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              이력서 등록 &amp; 버전 관리
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            PDF/DOCX 또는 직접 입력을 통해 전공, 기술, 프로젝트를 구조화하고 원하는 버전별로 관리하세요.
          </p>
        </div>

        {resumes.length > 0 && (
          <button
            onClick={onNavigateToAnalysis}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>기업별 AI 경쟁력 분석하기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Upload / Input Card */}
      <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4">
        {/* Toggle Mode */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setInputMode("file")}
              className={`px-3 py-1.5 rounded-lg transition ${
                inputMode === "file"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              파일 업로드 (PDF / DOCX)
            </button>
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className={`px-3 py-1.5 rounded-lg transition ${
                inputMode === "text"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              직접 텍스트 붙여넣기
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            * 추출 후 사용자가 직접 수정 및 확인할 수 있습니다.
          </span>
        </div>

        {/* Input Body */}
        {inputMode === "file" ? (
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition bg-white cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : "이력서 파일(PDF, DOCX)을 드래그하거나 클릭하여 선택"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  최대 20MB · 개인정보(성별, 나이, 주민번호)는 분석 시 제외 처리됩니다
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <textarea
              rows={6}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="이력서 텍스트 전체를 복사하여 붙여넣으세요. (전공, 학력, 자격증, 보유기술, 프로젝트 경험, 수상 내역 등)"
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed bg-white"
            />
          </div>
        )}

        {/* Consent and Submit */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={e => setConsentGiven(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs text-slate-600 leading-tight">
              <strong>[필수]</strong> AI 이력서 분석 및 안전 보관에 동의합니다. (개인정보는 분석 목적으로만 최소한 처리되며 무단 AI 학습에 사용되지 않습니다)
            </span>
          </label>

          <button
            onClick={handleExtract}
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs disabled:opacity-50 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? "정보 추출 및 구조화 중..." : "이력서 정보 추출 & 검토"}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Saved Resumes List & Version Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>등록된 이력서 버전 목록 ({resumes.length})</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            분석에 사용할 기본 이력서를 선택할 수 있습니다.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {resumes.map(r => {
            const isActive = activeResumeId === r.id;
            return (
              <div
                key={r.id}
                className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between gap-3 ${
                  isActive
                    ? "border-blue-600 bg-blue-50/20 ring-2 ring-blue-500/20 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {r.version}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                            <Check className="w-3 h-3" />
                            분석 선택됨
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {r.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditExisting(r)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        title="수정하기"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteResume(r.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="삭제하기"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 mt-2 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p>
                      <strong>전공:</strong> {r.structuredData?.major || "미기재"}
                    </p>
                    <p className="truncate">
                      <strong>보유 기술:</strong>{" "}
                      {r.structuredData?.skills?.join(", ") || "미기재"}
                    </p>
                    <p className="truncate">
                      <strong>프로젝트:</strong>{" "}
                      {r.structuredData?.projects?.map((p: any) => p.title).join(" | ") || "0건"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-400">
                    등록일: {r.createdAt.slice(0, 10)}
                  </span>

                  {!isActive ? (
                    <button
                      onClick={() => onSelectActiveResume(r.id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      이 버전으로 분석 지정
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-blue-700">
                      현재 활성 버전
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {resumes.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-1">
              <p className="text-xs font-medium">등록된 이력서 버전이 없습니다.</p>
              <p className="text-[11px] text-slate-400">
                상단의 파일 업로드 또는 텍스트 입력을 통해 첫 번째 이력서를 등록해보세요.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Review & Edit Modal (Before Final Save) */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-100 text-blue-700">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    추출 정보 검토 및 수정
                  </h3>
                  <p className="text-xs text-slate-500">
                    원문에서 추출된 내용입니다. 사실과 다르거나 누락된 항목을 직접 수정하세요.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                원문에 기재되지 않은 항목은 임의로 지어내지 않고 비워두었습니다. 필요한 경우 직접 입력해 주세요.
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    이력서 제목
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    버전 태그
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={e => setVersion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    전공
                  </label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={e =>
                      setFormData(p => ({ ...p, major: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    학력
                  </label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={e =>
                      setFormData(p => ({ ...p, education: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  보유 기술 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.skills.join(", ")}
                  onChange={e =>
                    setFormData(p => ({
                      ...p,
                      skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  자격증 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.certifications.join(", ")}
                  onChange={e =>
                    setFormData(p => ({
                      ...p,
                      certifications: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              {/* Projects List in Form */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  직무 관련 프로젝트 ({formData.projects.length}개)
                </label>
                {formData.projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="프로젝트명"
                        value={proj.title}
                        onChange={e => {
                          const updated = [...formData.projects];
                          updated[idx].title = e.target.value;
                          setFormData(p => ({ ...p, projects: updated }));
                        }}
                        className="px-2 py-1.5 bg-white border border-slate-300 rounded font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="기간 (예: 2024.03 - 2024.06)"
                        value={proj.period || ""}
                        onChange={e => {
                          const updated = [...formData.projects];
                          updated[idx].period = e.target.value;
                          setFormData(p => ({ ...p, projects: updated }));
                        }}
                        className="px-2 py-1.5 bg-white border border-slate-300 rounded text-slate-600"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="프로젝트 내용 및 기여도"
                      value={proj.description}
                      onChange={e => {
                        const updated = [...formData.projects];
                        updated[idx].description = e.target.value;
                        setFormData(p => ({ ...p, projects: updated }));
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveVerifiedResume}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                검토 완료 및 이력서 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
