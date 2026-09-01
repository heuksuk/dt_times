import { cookies } from "next/headers";
import AdminLoginForm from "./login-form";
import LogoutButton from "./logout-button";
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
  GAE: "개 · 개",
  GEOL: "걸 · 양",
  YUT: "윷 · 소",
  MO: "모 · 말",
};

type Participant = { id: string; name: string; current_team: TeamCode; submitted_at: string; };

function isTeamCode(value: string): value is TeamCode {
  return TEAM_CODES.includes(value as TeamCode);
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
  const imbalanceExists = hasImbalance(counts, getAutomaticTargets(counts));

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
              const info = TEAM_INFO[team];

              return (
                <Link className="team-card" data-team={team} href={`/admin/team/${team}`} key={team}>
                  <span className="team-card-icon" aria-hidden="true">{info.icon}</span>
                  <div className="team-card-content"><p>{TEAM_LABELS[team]}</p><h2>{info.summary}</h2><span>팀 소개 보기 →</span></div>
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
import Link from "next/link";
