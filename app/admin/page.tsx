import { cookies } from "next/headers";
import AdminLoginForm from "./login-form";
import LogoutButton from "./logout-button";
import SubmissionControl from "./submission-control";
import BalanceControl from "./balance-control";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getAutomaticTargets, getTeamCounts, hasImbalance } from "@/lib/balance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { TEAM_CODES, type TeamCode } from "@/lib/types";

export const dynamic = "force-dynamic";

const TEAM_LABELS: Record<TeamCode, string> = {
  DO: "도 · 돼지",
  GAE: "개 · 개",
  GEOL: "걸 · 양",
  YUT: "윷 · 소",
  MO: "모 · 말",
};

type Participant = {
  id: string;
  name: string;
  current_team: TeamCode;
  submitted_at: string;
};

function isTeamCode(value: string): value is TeamCode {
  return TEAM_CODES.includes(value as TeamCode);
}

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(value));
}

export default async function AdminPage() {
  const cookieStore = await cookies();

  if (!isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return <AdminLoginForm />;
  }

  let participants: Participant[] = [];
  let submissionsOpen = false;
  let loadError = "";

  try {
    const supabase = createSupabaseAdminClient();
    const [participantsResult, settingsResult] = await Promise.all([
      supabase.from("participants").select("id, name, current_team, submitted_at").order("submitted_at", { ascending: true }),
      supabase.from("event_settings").select("submissions_open").eq("id", true).single(),
    ]);

    if (participantsResult.error || settingsResult.error) throw participantsResult.error ?? settingsResult.error;
    participants = (participantsResult.data ?? []).filter((participant): participant is Participant => isTeamCode(participant.current_team));
    submissionsOpen = settingsResult.data.submissions_open;
  } catch (error) {
    console.error("Failed to load admin dashboard", error);
    loadError = "참여자 데이터를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.";
  }

  const counts = getTeamCounts(participants.map((participant) => participant.current_team));
  const targets = getAutomaticTargets(counts);
  const imbalanceExists = hasImbalance(counts, targets);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div><p className="eyebrow">관리자</p><h1>행사 현황</h1></div>
        <LogoutButton />
      </header>

      {loadError ? (
        <p className="admin-error" role="alert">{loadError}</p>
      ) : (
        <>
          <section className="admin-total"><span>전체 참여 인원</span><strong>{participants.length}명</strong></section>
          <SubmissionControl submissionsOpen={submissionsOpen} />
          <BalanceControl hasImbalance={imbalanceExists} submissionsOpen={submissionsOpen} />
          <div className="team-grid">
            {TEAM_CODES.map((team) => {
              const members = participants.filter((participant) => participant.current_team === team);
              const difference = members.length - targets[team];

              return (
                <section className="team-card" key={team}>
                  <div className="team-card-title"><h2>{TEAM_LABELS[team]}</h2><strong>{members.length}명</strong></div>
                  <p className="team-balance-status">
                    자동 목표 {targets[team]}명 · {difference > 0 ? `${difference}명 초과` : difference < 0 ? `${Math.abs(difference)}명 부족` : "균형"}
                  </p>
                  {members.length === 0 ? (
                    <p className="empty-team">아직 참여자가 없습니다.</p>
                  ) : (
                    <ul className="participant-list">
                      {members.map((participant) => <li key={participant.id}><span>{participant.name}</span><time>{formatSubmittedAt(participant.submitted_at)}</time></li>)}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
