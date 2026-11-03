import React, { useState, useEffect } from "react";
import { X, Bell, Send, CheckCircle2, AlertCircle, Clock, Mail } from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  userEmail,
}) => {
  const [targetEmail, setTargetEmail] = useState(userEmail || "kjkjkj1787@gmail.com");
  const [isSending, setIsSending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [emailPreview, setEmailPreview] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (userEmail) setTargetEmail(userEmail);
  }, [userEmail]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/notifications/history")
        .then(res => res.json())
        .then(data => {
          if (data?.history) setHistory(data.history);
        })
        .catch(err => console.error("History fetch error:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendTestAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setResultMessage(null);
    setEmailPreview(null);

    try {
      const res = await fetch("/api/notifications/test-deadline-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setResultMessage(data.message);
        setEmailPreview(data.emailPreview);
        // Refresh history
        const hRes = await fetch("/api/notifications/history");
        const hData = await hRes.json();
        if (hData?.history) setHistory(hData.history);
      } else {
        setResultMessage(`오류: ${data.message}`);
      }
    } catch (err: any) {
      setResultMessage(`요청 실패: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                채용 마감 이메일 알림 시스템
              </h2>
              <p className="text-xs text-slate-500">
                지원 예정 및 관심 공고의 마감 3일 전(D-3)과 1일 전(D-1)에 자동 발송됩니다.
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

        {/* Schedule & Timing Info Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-blue-50/80 border border-blue-100 text-xs space-y-1.5">
          <div className="font-bold text-blue-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>정기 예약 실행 안내</span>
          </div>
          <p className="text-slate-600">
            • <strong>실행 주기</strong>: 매일 오전 <strong>08:30 (KST, Asia/Seoul)</strong>에 마감일 점검 및 알림 대상 확인이 백엔드 스케줄러로 자동 실행됩니다.
          </p>
          <p className="text-slate-600">
            • <strong>알림 대상</strong>: 서류 마감 3일 전(D-3) 및 1일 전(D-1)에 도달한 채용공고
          </p>
          <p className="text-slate-600">
            • <strong>환경설정</strong>: <code>.env</code> 파일의 <code>SMTP_HOST</code> 설정 시 실제 메일함으로 즉시 전송되며, 미설정 시에도 시스템 내부 알림 큐에 실시간 기록됩니다.
          </p>
        </div>

        {/* Test Alert Sender */}
        <form onSubmit={handleSendTestAlert} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              수신 이메일 주소
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  value={targetEmail}
                  onChange={e => setTargetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <button
                type="submit"
                disabled={isSending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? "발송 중..." : "테스트 알림 발송"}</span>
              </button>
            </div>
          </div>

          {resultMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{resultMessage}</p>
                {emailPreview && (
                  <p className="text-[11px] text-emerald-700 mt-1">
                    제목: {emailPreview.subject}
                  </p>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Recent Dispatch History */}
        <div className="mt-5 space-y-2">
          <h3 className="text-xs font-bold text-slate-800">
            최근 발송 및 알림 기록 ({history.length})
          </h3>
          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    {item.company} - {item.jobTitle}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="font-medium text-amber-700">{item.type}</span>
                    <span>마감: {item.deadline}</span>
                    <span>수신: {item.recipient}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold shrink-0">
                  {item.status}
                </span>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                아직 발송된 마감 알림 기록이 없습니다. 상단에서 테스트 알림을 발송해보세요.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
