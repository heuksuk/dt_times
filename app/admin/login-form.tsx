"use client";

import { useState } from "react";

export default function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json() as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "로그인하지 못했습니다.");
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
    <main className="admin-shell">
      <section className="admin-login-card">
        <p className="eyebrow">관리자 전용</p>
        <h1>설문 현황</h1>
        <p className="lead">관리자 비밀번호를 입력해 주세요.</p>
        <form className="admin-login-form" onSubmit={submit}>
          <label htmlFor="admin-password">비밀번호</label>
          <input
            autoComplete="current-password"
            id="admin-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {error && <p className="submit-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "확인 중..." : "관리자 화면 열기"}
          </button>
        </form>
      </section>
    </main>
  );
}
