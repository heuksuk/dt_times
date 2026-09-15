import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GAME2_ROUNDS, isRevealableCharacter } from "@/lib/game2/phrases";
import { TEAM_CODES, type TeamCode } from "@/lib/types";

const EMPTY_SCORES = { DO: 0, GAE: 0, GEOL: 0, YUT: 0, MO: 0 };

async function isAuthorized() {
  const cookieStore = await cookies();
  return isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

function validTeam(value: unknown): value is TeamCode {
  return typeof value === "string" && TEAM_CODES.includes(value as TeamCode);
}

function messageFor(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("version conflict")) return "다른 화면에서 게임 상태가 변경되었습니다. 새로고침해 주세요.";
  if (message.includes("nothing to undo")) return "취소할 점수 기록이 없습니다.";
  return "게임 상태를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export async function GET() {
  if (!(await isAuthorized())) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("game2_sessions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ session: data });
  } catch (error) {
    console.error("Failed to load game2", error);
    return NextResponse.json({ error: messageFor(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 }); }

  try {
    const supabase = createSupabaseAdminClient();

    if (body.action === "new") {
      const { data, error } = await supabase.from("game2_sessions").insert({ scores: EMPTY_SCORES }).select("*").single();
      if (error) throw error;
      return NextResponse.json({ session: data });
    }

    if (body.action === "score") {
      if (!validTeam(body.team) || body.points !== 1 || !Number.isInteger(body.version)) {
        return NextResponse.json({ error: "점수 요청이 올바르지 않습니다." }, { status: 400 });
      }
      const { data, error } = await supabase.rpc("game2_add_score", {
        p_session_id: body.sessionId,
        p_team: body.team,
        p_points: body.points,
        p_reason: "phrase",
        p_round_index: body.roundIndex,
        p_version: body.version,
      });
      if (error) throw error;
      return NextResponse.json({ session: data });
    }

    if (body.action === "undo") {
      if (!Number.isInteger(body.version)) return NextResponse.json({ error: "취소 요청이 올바르지 않습니다." }, { status: 400 });
      const { data, error } = await supabase.rpc("game2_undo_score", { p_session_id: body.sessionId, p_version: body.version });
      if (error) throw error;
      return NextResponse.json({ session: data });
    }

    return NextResponse.json({ error: "지원하지 않는 작업입니다." }, { status: 400 });
  } catch (error) {
    console.error("Failed to update game2 score", error);
    return NextResponse.json({ error: messageFor(error) }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAuthorized())) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 }); }

  if (typeof body.sessionId !== "string" || !Number.isInteger(body.version)) {
    return NextResponse.json({ error: "게임 정보가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: current, error: loadError } = await supabase.from("game2_sessions").select("*").eq("id", body.sessionId).single();
    if (loadError) throw loadError;
    if (current.version !== body.version) return NextResponse.json({ error: "다른 화면에서 게임 상태가 변경되었습니다. 새로고침해 주세요." }, { status: 409 });

    const changes: Record<string, unknown> = { version: current.version + 1, updated_at: new Date().toISOString() };

    if (body.action === "reveal") {
      const round = GAME2_ROUNDS[current.current_round];
      if (!round || !Number.isInteger(body.characterIndex)) return NextResponse.json({ error: "공개 위치가 올바르지 않습니다." }, { status: 400 });
      const index = Number(body.characterIndex);
      const validIndex = round.kind === "phrase"
        ? Boolean(round.text[index] && isRevealableCharacter(round.text[index]))
        : index >= 0 && index < 9;
      if (!validIndex) return NextResponse.json({ error: "공개할 수 없는 위치입니다." }, { status: 400 });
      const revealed = { ...(current.revealed ?? {}) } as Record<string, number[]>;
      revealed[round.id] = Array.from(new Set([...(revealed[round.id] ?? []), index])).sort((a, b) => a - b);
      changes.revealed = revealed;
    } else if (body.action === "revealAll") {
      const round = GAME2_ROUNDS[current.current_round];
      if (!round) return NextResponse.json({ error: "문제를 찾을 수 없습니다." }, { status: 400 });
      changes.fully_revealed = Array.from(new Set([...(current.fully_revealed ?? []), round.id]));
    } else if (body.action === "round") {
      if (!Number.isInteger(body.roundIndex)) return NextResponse.json({ error: "라운드가 올바르지 않습니다." }, { status: 400 });
      const roundIndex = Number(body.roundIndex);
      if (roundIndex < 0 || roundIndex >= GAME2_ROUNDS.length) return NextResponse.json({ error: "라운드 범위를 벗어났습니다." }, { status: 400 });
      changes.current_round = roundIndex;
      changes.status = "playing";
    } else if (body.action === "finish") {
      changes.status = "finished";
    } else {
      return NextResponse.json({ error: "지원하지 않는 작업입니다." }, { status: 400 });
    }

    const { data, error } = await supabase.from("game2_sessions").update(changes).eq("id", body.sessionId).eq("version", body.version).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "다른 화면에서 게임 상태가 변경되었습니다. 새로고침해 주세요." }, { status: 409 });
    return NextResponse.json({ session: data });
  } catch (error) {
    console.error("Failed to update game2", error);
    return NextResponse.json({ error: messageFor(error) }, { status: 500 });
  }
}
