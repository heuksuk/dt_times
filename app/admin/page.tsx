import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import AdminLoginForm from "./login-form";
import LogoutButton from "./logout-button";
import RefreshControl from "./refresh-control";
import SubmissionControl from "./submission-control";
import BalanceControl from "./balance-control";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getAutomaticTargets, getTeamCounts, hasImbalance } from "@/lib/balance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { TEAM_CODES, type TeamCode } from "@/lib/types";
import { TEAM_INFO } from "@/lib/team-info";

export const dynamic = "force-dynamic";

const TEAM_LABELS: Record<TeamCode, string> = {
  DO: "도 · 돼지",
  GAE: "개 · 강아지",
  GEOL: "걸 · 양",
  YUT: "윷 · 소",
  MO: "모 · 말",
};

type Participant = { id: string; name: string; current_team: TeamCode; submitted_at: string; };
type TeamMove = { id: string; participant_id: string; from_team: TeamCode; to_team: TeamCode; moved_at: string; };

function isTeamCode(value: string): value is TeamCode {
  return TEAM_CODES.includes(value as TeamCode);
}

function formatMovedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function formatCheckedAt(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(value);
}

export default async function AdminPage() {
  const cookieStore = await cookies();

  if (!isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return <AdminLoginForm />;
  }

  let participants: Participant[] = [];
  let teamMoves: TeamMove[] = [];
  let submissionsOpen = false;
  let loadError = "";

  try {
    const supabase = createSupabaseAdminClient();
    const [participantsResult, settingsResult, movesResult] = await Promise.all([
      supabase.from("participants").select("id, name, current_team, submitted_at").order("submitted_at", { ascending: true }),
      supabase.from("event_settings").select("submissions_open").eq("id", true).single(),
      supabase.from("team_moves").select("id, participant_id, from_team, to_team, moved_at").order("moved_at", { ascending: false }).limit(50),
    ]);

    if (participantsResult.error || settingsResult.error || movesResult.error) {
      throw participantsResult.error ?? settingsResult.error ?? movesResult.error;
    }
    participants = (participantsResult.data ?? []).filter((participant): participant is Participant => isTeamCode(participant.current_team));
    teamMoves = (movesResult.data ?? []).filter(
      (move): move is TeamMove => isTeamCode(move.from_team) && isTeamCode(move.to_team),
    );
    submissionsOpen = settingsResult.data.submissions_open;
  } catch (error) {
    console.error("Failed to load admin dashboard", error);
    loadError = "참여자 데이터를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.";
  }

  const counts = getTeamCounts(participants.map((participant) => participant.current_team));
  const imbalanceExists = hasImbalance(counts, getAutomaticTargets(counts));
  const participantNames = new Map(participants.map((participant) => [participant.id, participant.name]));
  const checkedAt = formatCheckedAt(new Date());

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div><p className="eyebrow">관리자</p><h1>행사 현황</h1></div>
        <div className="admin-header-actions">
          <RefreshControl checkedAt={checkedAt} />
          <LogoutButton />
        </div>
      </header>

      {loadError ? (
        <p className="admin-error" role="alert">{loadError}</p>
      ) : (
        <>
          <section className="admin-total"><span>전체 참여 인원</span><strong>{participants.length}명</strong></section>
          <SubmissionControl submissionsOpen={submissionsOpen} />
          <BalanceControl hasImbalance={imbalanceExists} submissionsOpen={submissionsOpen} />
          <section className="move-history">
            <div className="move-history-header">
              <div><p className="eyebrow">룰렛 결과</p><h2>최근 팀 이동 기록</h2></div>
              <strong>{teamMoves.length}건</strong>
            </div>
            {teamMoves.length === 0 ? (
              <p className="move-history-empty">아직 룰렛으로 이동한 참여자가 없습니다.</p>
            ) : (
              <ul className="move-history-list">
                {teamMoves.map((move) => (
                  <li key={move.id}>
                    <strong>{participantNames.get(move.participant_id) ?? "알 수 없는 참여자"}</strong>
                    <span>{TEAM_LABELS[move.from_team]} <b aria-hidden="true">→</b> {TEAM_LABELS[move.to_team]}</span>
                    <time>{formatMovedAt(move.moved_at)}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="team-grid">
            {TEAM_CODES.map((team) => {
              const members = participants.filter((participant) => participant.current_team === team);
              const info = TEAM_INFO[team];

              return (
                <Link className="team-card" data-team={team} href={`/admin/team/${team}`} key={team}>
                  <div className="team-card-visual" aria-hidden="true">
                    <span className="team-card-icon"><Image alt="" height={76} src={info.icon} width={76} /></span>
                    <span className="yut-badge">{info.name}</span>
                  </div>
                  <div className="team-card-content"><p>{info.animal} 팀</p><h2>{info.summary}</h2><span>팀 소개 보기 →</span></div>
                  <strong className="team-card-count">{members.length}<small>명</small></strong>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
