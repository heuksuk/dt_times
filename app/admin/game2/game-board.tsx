"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GAME2_ROUNDS, isRevealableCharacter } from "@/lib/game2/phrases";
import type { Game2Session } from "@/lib/game2/types";
import { TEAM_CODES, type TeamCode } from "@/lib/types";
import { TEAM_INFO } from "@/lib/team-info";

const TEAM_KEYS: Record<string, TeamCode> = { "1": "DO", "2": "GAE", "3": "GEOL", "4": "YUT", "5": "MO" };

function getWordTokens(text: string) {
  const tokens: Array<{ text: string; start: number }> = [];
  const pattern = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) tokens.push({ text: match[0], start: match.index });
  return tokens;
}

export default function Game2Board() {
  const [session, setSession] = useState<Game2Session | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/game2", { cache: "no-store" });
      const result = await response.json() as { session?: Game2Session | null; error?: string };
      if (!response.ok) throw new Error(result.error);
      setSession(result.session ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "게임을 불러오지 못했습니다.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function request(method: "POST" | "PATCH", body: Record<string, unknown>) {
    if (busy) return null;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/game2", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { session?: Game2Session; error?: string };
      if (!response.ok || !result.session) throw new Error(result.error ?? "저장하지 못했습니다.");
      setSession(result.session);
      return result.session;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "저장하지 못했습니다.");
      return null;
    } finally { setBusy(false); }
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  }

  async function newGame() {
    if (session && !window.confirm("현재 게임을 끝내고 점수 0점부터 새로 시작할까요?")) return;
    const next = await request("POST", { action: "new" });
    if (next) { setSelectedTeam(null); showNotice("새 게임을 시작했습니다."); }
  }

  async function reveal(index: number) {
    if (!session) return;
    await request("PATCH", { action: "reveal", sessionId: session.id, version: session.version, characterIndex: index });
  }

  async function revealAll() {
    if (!session) return;
    const round = GAME2_ROUNDS[session.current_round];
    const message = round.kind === "face" ? "전체 사진과 정답을 공개할까요?" : "전체 문장과 출처를 공개할까요? 점수는 자동으로 부여되지 않습니다.";
    if (!window.confirm(message)) return;
    await request("PATCH", { action: "revealAll", sessionId: session.id, version: session.version });
  }

  async function revealRandom() {
    if (!session) return;
    const round = GAME2_ROUNDS[session.current_round];
    const revealed = new Set(session.revealed[round.id] ?? []);
    const candidates = round.kind === "phrase"
      ? Array.from(round.text)
        .map((character, index) => ({ character, index }))
        .filter(({ character, index }) => isRevealableCharacter(character) && !revealed.has(index))
      : round.revealOrder
        .filter((index) => !revealed.has(index))
        .slice(0, 1)
        .map((index) => ({ character: "", index }));

    if (candidates.length === 0) {
      showNotice("공개할 글자가 없습니다.");
      return;
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const next = await request("PATCH", {
      action: "reveal",
      sessionId: session.id,
      version: session.version,
      characterIndex: chosen.index,
    });
    if (next) showNotice(round.kind === "face" ? `${chosen.index + 1}번 사진 조각을 공개했습니다.` : `${chosen.index + 1}번 글자를 공개했습니다.`);
  }

  async function award() {
    if (!session || !selectedTeam || busy) return;
    const teamName = TEAM_INFO[selectedTeam].name;
    const next = await request("POST", { action: "score", sessionId: session.id, version: session.version, team: selectedTeam, points: 1, roundIndex: session.current_round });
    if (next) { showNotice(`${teamName} 팀 +1점`); setSelectedTeam(null); }
  }

  async function undo() {
    if (!session || !window.confirm("가장 최근에 부여한 점수를 취소할까요?")) return;
    const next = await request("POST", { action: "undo", sessionId: session.id, version: session.version });
    if (next) { setNotice("마지막 점수를 취소했습니다."); setSelectedTeam(null); }
  }

  async function move(roundIndex: number) {
    if (!session) return;
    await request("PATCH", { action: "round", sessionId: session.id, version: session.version, roundIndex });
    setSelectedTeam(null);
  }

  async function finish() {
    if (!session || !window.confirm("게임을 종료하고 최종 순위를 볼까요?")) return;
    await request("PATCH", { action: "finish", sessionId: session.id, version: session.version });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const team = TEAM_KEYS[event.key];
      if (team) setSelectedTeam(team);
      else if (event.key === "Escape") setSelectedTeam(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (loading) return <main className="game2-loading">게임을 불러오는 중...</main>;
  if (!session) return <main className="game2-empty"><p className="eyebrow">2번 게임</p><h1>숨은 명대사 & 인물 맞히기</h1><p>새 게임을 시작하면 {GAME2_ROUNDS.length}개 문제가 준비됩니다.</p>{error && <p className="game2-error">{error}</p>}<button className="game2-main-button" onClick={newGame}>새 게임 시작</button><Link href="/admin">관리자 화면으로</Link></main>;

  const round = GAME2_ROUNDS[session.current_round];
  const fullyRevealed = session.fully_revealed.includes(round.id);
  const revealed = new Set(session.revealed[round.id] ?? []);
  const ranked = [...TEAM_CODES].sort((a, b) => session.scores[b] - session.scores[a]);
  const highestScore = Math.max(...TEAM_CODES.map((team) => session.scores[team]));

  if (session.status === "finished") return (
    <main className="game2-shell game2-results">
      <p className="eyebrow">게임 종료</p><h1>최종 결과</h1>
      <ol>{ranked.map((team) => {
        const rank = TEAM_CODES.filter((other) => session.scores[other] > session.scores[team]).length + 1;
        return <li data-rank={rank} key={team}><span>{rank === 1 ? "🏆" : `${rank}위`}</span><Image src={TEAM_INFO[team].icon} alt="" width={64} height={64}/><strong>{TEAM_INFO[team].name} 팀</strong><b>{session.scores[team]}점</b></li>;
      })}</ol>
      {error && <p className="game2-error">{error}</p>}
      <div className="game2-result-actions"><button onClick={undo} disabled={busy}>마지막 점수 취소</button><button onClick={newGame} disabled={busy}>처음부터 다시 시작</button></div>
    </main>
  );

  return (
    <main className="game2-shell">
      <header className="game2-scoreboard">
        {TEAM_CODES.map((team, index) => <button aria-pressed={selectedTeam === team} data-team={team} key={team} onClick={() => setSelectedTeam(selectedTeam === team ? null : team)}><span className="game2-key">{index + 1}</span>{highestScore > 0 && session.scores[team] === highestScore && <span className="game2-crown" aria-label="현재 선두">♛</span>}<Image src={TEAM_INFO[team].icon} alt="" width={48} height={48}/><span className="game2-team-name">{TEAM_INFO[team].name} 팀</span><strong>{session.scores[team]}<small>점</small></strong>{selectedTeam === team && <span className="game2-selected">✓ 선택</span>}</button>)}
      </header>

      <section className="game2-stage">
        <div className="game2-meta"><span data-category={round.category}>{round.category}</span><strong>{session.current_round + 1} / {GAME2_ROUNDS.length}</strong></div>
        <div className="game2-progress" aria-hidden="true"><span style={{ width: `${((session.current_round + 1) / GAME2_ROUNDS.length) * 100}%` }} /></div>
        {round.kind === "phrase" ? <div className="game2-phrase" aria-label="숨은 문장">
          {getWordTokens(round.text).map((token) => <span className="game2-word" key={`${token.start}-${token.text}`}>
            {Array.from(token.text).map((character, localIndex) => {
              const index = token.start + localIndex;
              return isRevealableCharacter(character) ? (
                <button aria-label={revealed.has(index) || fullyRevealed ? character : `${index + 1}번째 숨은 글자`} className="game2-letter" data-revealed={revealed.has(index) || fullyRevealed} disabled={busy || revealed.has(index) || fullyRevealed} key={`${index}-${character}`} onClick={() => reveal(index)}>{revealed.has(index) || fullyRevealed ? character : ""}</button>
              ) : <span className="game2-punctuation" key={`${index}-${character}`}>{character}</span>;
            })}
          </span>)}
        </div> : <div className="game2-face-wrap">
          <div className="game2-face-grid" aria-label="가려진 인물 사진">
            {Array.from({ length: 9 }, (_, index) => {
              const isOpen = fullyRevealed || revealed.has(index);
              return <button
                aria-label={isOpen ? `${index + 1}번 공개된 사진 조각` : `${index + 1}번 가려진 사진 조각`}
                className="game2-face-tile"
                data-revealed={isOpen}
                disabled={busy || isOpen}
                key={index}
                onClick={() => reveal(index)}
                style={{ backgroundImage: `url(${round.image})`, backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%` }}
              ><span>{index + 1}</span></button>;
            })}
          </div>
        </div>}
        {fullyRevealed && <p className="game2-source">— {round.kind === "phrase" ? round.source : `정답: ${round.name}`}</p>}
        <div className="game2-reveal-actions">
          <button className="reveal-random" disabled={busy || fullyRevealed} onClick={revealRandom}>✦ {round.kind === "face" ? "조각 공개" : "글자 공개"}</button>
          <button className="reveal-all" disabled={busy || fullyRevealed} onClick={revealAll}>{fullyRevealed ? "전체 공개됨" : round.kind === "face" ? "전체 사진 공개" : "전체 문장 공개"}</button>
        </div>
        <div className="game2-round-actions">
          <button disabled={busy || session.current_round === 0} onClick={() => move(session.current_round - 1)}>← 이전 문제</button>
          {session.current_round === GAME2_ROUNDS.length - 1 ? <button disabled={busy} onClick={finish}>최종 결과 보기</button> : <button disabled={busy} onClick={() => move(session.current_round + 1)}>다음 문제 →</button>}
        </div>
      </section>

      <section className="game2-scoring">
        <div className="game2-selected-team">{selectedTeam && <Image src={TEAM_INFO[selectedTeam].icon} alt="" width={42} height={42}/>}<span>선택된 팀<strong>{selectedTeam ? `${TEAM_INFO[selectedTeam].name} 팀` : "팀을 먼저 선택하세요"}</strong></span></div>
        <button disabled={busy || !selectedTeam} onClick={() => award()}>{round.kind === "face" ? "인물 정답" : "문장 정답"} <b>+1</b></button>
        <button className="game2-undo" disabled={busy} onClick={undo}>마지막 점수 취소</button>
      </section>
      {notice && <div className="game2-toast" role="status">{notice}</div>}
      {error && <div className="game2-error" role="alert">{error}<button onClick={load}>새로고침</button></div>}
      <footer><Link href="/admin">관리자 화면</Link></footer>
    </main>
  );
}
