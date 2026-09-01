"use client";

import { useEffect, useState } from "react";
import { MoveArrow } from "../icons";
import type { TeamCode } from "@/lib/types";

type Move = { participantName: string; fromTeam: TeamCode; toTeam: TeamCode };

const TEAM_LABELS: Record<TeamCode, string> = {
  DO: "도 (돼지)",
  GAE: "개 (강아지)",
  GEOL: "걸 (양)",
  YUT: "윷 (소)",
  MO: "모 (말)",
};

const NEXT_KEYS = ["Enter", " ", "ArrowRight", "PageDown"];
const PREV_KEYS = ["ArrowLeft", "PageUp"];

export default function BalanceControl({ submissionsOpen, hasImbalance }: { submissionsOpen: boolean; hasImbalance: boolean }) {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [moves, setMoves] = useState<Move[]>([]);
  const [index, setIndex] = useState(0);

  const activeMove = moves[index];
  const isLastMove = index === moves.length - 1;

  useEffect(() => {
    if (!moves.length) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (NEXT_KEYS.includes(event.key)) {
        event.preventDefault();
        if (isLastMove) window.location.reload();
        else setIndex((current) => current + 1);
      } else if (PREV_KEYS.includes(event.key)) {
        event.preventDefault();
        setIndex((current) => Math.max(0, current - 1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moves.length, isLastMove]);

  async function balanceTeams() {
    const confirmed = window.confirm(
      "초과 팀의 참여자를 무작위로 이동합니다. 실행 후 자동으로 되돌릴 수 없습니다. 계속할까요?",
    );

    if (!confirmed) return;

    let isPlaying = false;
    setError("");
    setMoves([]);
    setIndex(0);
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
      setMoves(result.moves);
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
    <>
      <section className="balance-control">
        <div><h2>자동 팀 밸런스</h2><p>{description}</p></div>
        <div className="balance-action">
          {error && <p className="submit-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={disabled} onClick={balanceTeams} type="button">
            {isRunning ? "룰렛 실행 중..." : "자동 룰렛 실행"}
          </button>
        </div>
      </section>

      {activeMove && (
        <div className="roulette-stage" aria-live="polite" role="status">
          <div className="roulette-card" key={index}>
            <p className="roulette-kicker">자동 룰렛</p>
            <strong className="roulette-name">{activeMove.participantName}</strong>
            <div className="roulette-move">
              <span className="roulette-team from">{TEAM_LABELS[activeMove.fromTeam]}</span>
              <MoveArrow />
              <span className="roulette-team to">{TEAM_LABELS[activeMove.toTeam]}</span>
            </div>
            <p className="roulette-progress">{index + 1} / {moves.length}</p>
            <div className="roulette-actions">
              <button
                className="secondary-button"
                disabled={index === 0}
                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                type="button"
              >
                이전
              </button>
              <button
                autoFocus
                className="primary-button"
                onClick={() => (isLastMove ? window.location.reload() : setIndex((current) => current + 1))}
                type="button"
              >
                {isLastMove ? "결과 확인하기" : "다음"}
              </button>
            </div>
            <p className="roulette-hint">Enter · Space · → 키로도 넘길 수 있습니다</p>
          </div>
        </div>
      )}
    </>
  );
}
