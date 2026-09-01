import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import AdminLoginForm from "../../login-form";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { TEAM_INFO } from "@/lib/team-info";
import { TEAM_CODES, type TeamCode } from "@/lib/types";

export const dynamic = "force-dynamic";

type Participant = {
  id: string;
  name: string;
  submitted_at: string;
};

function isTeamCode(value: string): value is TeamCode {
  return TEAM_CODES.includes(value as TeamCode);
}

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export default async function TeamDetailPage({ params }: { params: Promise<{ team: string }> }) {
  const { team: teamParam } = await params;

  if (!isTeamCode(teamParam)) notFound();

  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return <AdminLoginForm />;
  }

  const team = teamParam;
  const info = TEAM_INFO[team];
  let members: Participant[] = [];
  let loadError = "";

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("participants")
      .select("id, name, submitted_at")
      .eq("current_team", team)
      .order("submitted_at", { ascending: true });

    if (error) throw error;
    members = (data ?? []) as Participant[];
  } catch (error) {
    console.error("Failed to load team members", error);
    loadError = "팀 구성원을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }

  return (
    <main className="team-detail-shell" data-team={team}>
      <Link className="back-link" href="/admin">← 전체 팀 현황</Link>
      <section className="team-hero">
        <div className="team-hero-icon" aria-hidden="true">{info.icon}</div>
        <div>
          <p className="team-hero-kicker">{info.animal} 팀</p>
          <h1>{info.name} · {info.animal}</h1>
          <p className="team-summary">{info.summary}</p>
        </div>
      </section>

      <section className="strength-card">
        <h2 className="strength-headline">{info.strengthHeadline}</h2>
        <p className="strength-description">{info.strengthDescription}</p>
        <div className="team-magic">
          <span>이 팀이 모이면</span>
          <p>“{info.teamMagic}”</p>
        </div>
        <p className="section-kicker">이 팀의 강점</p>
        <div className="keyword-row">
          {info.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
        </div>
        <p>서로의 장점을 자연스럽게 연결하며, 함께할수록 팀의 에너지가 커지는 구성입니다.</p>
      </section>

      <section className="member-card">
        <div className="member-card-title">
          <div><p className="section-kicker">팀 구성원</p><h2>{members.length}명과 함께해요</h2></div>
          <span className="member-count">{members.length}</span>
        </div>
        {loadError ? (
          <p className="admin-error" role="alert">{loadError}</p>
        ) : members.length === 0 ? (
          <div className="empty-members"><span>✦</span><p>아직 이 팀에 배정된 구성원이 없습니다.</p></div>
        ) : (
          <ul className="member-list">
            {members.map((member, index) => (
              <li key={member.id}>
                <span className="member-order">{String(index + 1).padStart(2, "0")}</span>
                <strong>{member.name}</strong>
                <time>{formatSubmittedAt(member.submitted_at)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
