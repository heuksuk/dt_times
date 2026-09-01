"use client";

import { useState } from "react";

export default function SubmissionControl({ submissionsOpen }: { submissionsOpen: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const nextOpen = !submissionsOpen;

  async function changeStatus() {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open: nextOpen }),
      });
      const result = await response.json() as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "접수 상태를 변경하지 못했습니다.");
        return;
      }

      window.location.reload();
    } catch {
      setError("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="submission-control">
      <div>
        <span className={submissionsOpen ? "status-open" : "status-closed"}>{submissionsOpen ? "접수 중" : "접수 마감"}</span>
        <p>{submissionsOpen ? "참여자가 설문을 제출할 수 있습니다." : "참여자 설문 제출이 차단되어 있습니다."}</p>
      </div>
      <div>
        {error && <p className="submit-error" role="alert">{error}</p>}
        <button className={submissionsOpen ? "danger-button" : "primary-button"} disabled={isSubmitting} onClick={changeStatus} type="button">
          {isSubmitting ? "변경 중..." : submissionsOpen ? "설문 접수 마감" : "설문 접수 열기"}
        </button>
      </div>
    </section>
  );
}
