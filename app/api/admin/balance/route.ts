import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getAutomaticTargets, getTeamCounts } from "@/lib/balance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { TEAM_CODES, type TeamCode } from "@/lib/types";

type Participant = { id: string; name: string; current_team: TeamCode };

function isTeamCode(value: string): value is TeamCode {
  return TEAM_CODES.includes(value as TeamCode);
}

function randomlyPick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export async function POST() {
  const cookieStore = await cookies();

  if (!isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const [{ data: settings, error: settingsError }, { data, error: participantsError }] = await Promise.all([
      supabase.from("event_settings").select("submissions_open").eq("id", true).single(),
      supabase.from("participants").select("id, name, current_team"),
    ]);

    if (settingsError || participantsError) throw settingsError ?? participantsError;
    if (settings.submissions_open) {
      return NextResponse.json({ error: "접수를 마감한 뒤 팀 밸런스를 맞출 수 있습니다." }, { status: 409 });
    }

    const participants = (data ?? []).filter((participant): participant is Participant => isTeamCode(participant.current_team));
    const counts = getTeamCounts(participants.map((participant) => participant.current_team));
    const targets = getAutomaticTargets(counts);
    const moves: Array<{ participantName: string; fromTeam: TeamCode; toTeam: TeamCode }> = [];

    while (true) {
      const currentCounts = getTeamCounts(participants.map((participant) => participant.current_team));
      const sourceCandidates = TEAM_CODES.filter((team) => currentCounts[team] > targets[team]);
      const destinationCandidates = TEAM_CODES.filter((team) => currentCounts[team] < targets[team]);

      if (sourceCandidates.length === 0 && destinationCandidates.length === 0) break;
      if (sourceCandidates.length === 0 || destinationCandidates.length === 0) throw new Error("팀 인원 계산이 일치하지 않습니다.");

      const largestExcess = Math.max(...sourceCandidates.map((team) => currentCounts[team] - targets[team]));
      const largestShortage = Math.max(...destinationCandidates.map((team) => targets[team] - currentCounts[team]));
      const fromTeam = randomlyPick(sourceCandidates.filter((team) => currentCounts[team] - targets[team] === largestExcess));
      const toTeam = randomlyPick(destinationCandidates.filter((team) => targets[team] - currentCounts[team] === largestShortage));
      const participant = randomlyPick(participants.filter((item) => item.current_team === fromTeam));

      const { data: updatedParticipant, error: updateError } = await supabase
        .from("participants")
        .update({ current_team: toTeam })
        .eq("id", participant.id)
        .eq("current_team", fromTeam)
        .select("id")
        .maybeSingle();

      if (updateError || !updatedParticipant) throw updateError ?? new Error("참여자 이동 정보를 저장하지 못했습니다.");

      const { error: moveError } = await supabase.from("team_moves").insert({
        participant_id: participant.id,
        from_team: fromTeam,
        to_team: toTeam,
      });

      if (moveError) throw moveError;

      participant.current_team = toTeam;
      moves.push({ participantName: participant.name, fromTeam, toTeam });
    }

    return NextResponse.json({ moves, targets });
  } catch (error) {
    console.error("Failed to balance teams", error);
    return NextResponse.json({ error: "팀 밸런스를 맞추지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
