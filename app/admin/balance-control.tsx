"use client";

import { useState } from "react";
import type { TeamCode } from "@/lib/types";

type Move = { participantName: string; fromTeam: TeamCode; toTeam: TeamCode };

const TEAM_LABELS: Record<TeamCode, string> = {
  DO: "도 · 돼지",
  GAE: "개 · 개",
  GEOL: "걸 · 양",
  YUT: "윷 · 소",
  MO: "모 · 말",
};

export default function BalanceControl({ submissionsOpen, hasImbalance }: { submissionsOpen: boolean; hasImbalance: boolean }) {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [activeMove, setActiveMove] = useState<Move | null>(null);

  function playMoves(moves: Move[]) {
    let index = 0;

    const showNextMove = () => {
      setActiveMove(moves[index]);
      index += 1;

      if (index < moves.length) {
        window.setTimeout(showNextMove, 1300);
      } else {
        window.setTimeout(() => window.location.reload(), 1800);
      }
    };

    showNextMove();
  }

  async function balanceTeams() {
    const confirmed = window.confirm(
      "초과 팀의 참여자를 무작위로 이동합니다. 실행 후 자동으로 되돌릴 수 없습니다. 계속할까요?",
    );

    if (!confirmed) return;

    let isPlaying = false;
    setError("");
    setActiveMove(null);
    setIsRunning(true);

    try {
      const response = await fetch("/api/admin/balance", { method: "POST" });
      const result = await response.json() as { error?: string; moves?: Move[] };

      if (!response.ok) {
        setError(result.error ?? "팀 밸런스를 맞추지 못했습니다.");
        return;
      }

      if (!result.moves?.length) {
        window.location.reload();
        return;
      }

      isPlaying = true;
      playMoves(result.moves);
    } catch {
      setError("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      if (!isPlaying) setIsRunning(false);
    }
  }

  const disabled = submissionsOpen || !hasImbalance || isRunning;
  const description = submissionsOpen
    ? "접수를 마감하면 자동으로 균등 목표 인원을 계산할 수 있습니다."
    : hasImbalance
      ? "초과 팀에서 무작위로 뽑아 가장 부족한 팀으로 이동합니다."
      : "현재 모든 팀의 인원이 자동 목표에 맞습니다.";

  return (
    <section className="balance-control">
      <div><h2>자동 팀 밸런스</h2><p>{description}</p></div>
      <div className="balance-action">
        {activeMove && <p className="roulette-result" aria-live="polite">🎯 <strong>{activeMove.participantName}</strong>님: {TEAM_LABELS[activeMove.fromTeam]} → {TEAM_LABELS[activeMove.toTeam]}</p>}
        {error && <p className="submit-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={disabled} onClick={balanceTeams} type="button">
          {isRunning ? "룰렛 실행 중..." : "자동 룰렛 실행"}
        </button>
      </div>
    </section>
  );
}
