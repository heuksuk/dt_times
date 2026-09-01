import { NextResponse } from "next/server";
import { calculateAssignment, validateAnswers } from "@/lib/scoring";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const clientToken = typeof body.clientToken === "string" ? body.clientToken : "";
  const answers = validateAnswers(body.answers);

  if (name.length < 2 || name.length > 20 || !UUID_PATTERN.test(clientToken) || !answers) {
    return NextResponse.json({ error: "제출 내용을 다시 확인해 주세요." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: settings, error: settingsError } = await supabase
      .from("event_settings")
      .select("submissions_open")
      .eq("id", true)
      .single();

    if (settingsError || !settings?.submissions_open) {
      return NextResponse.json({ error: "현재 설문 접수가 마감되었습니다." }, { status: 403 });
    }

    const { scores, initialTeam } = calculateAssignment(answers);
    const { error } = await supabase.from("participants").insert({
      client_token: clientToken,
      name,
      answers,
      scores,
      initial_team: initialTeam,
      current_team: initialTeam,
    });

    if (error?.code === "23505") {
      return NextResponse.json({ error: "이 기기에서는 이미 설문을 제출했습니다." }, { status: 409 });
    }

    if (error) {
      console.error("Failed to save survey submission", error);
      return NextResponse.json({ error: "제출을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
  } catch (error) {
    console.error("Survey submission failed", error);
    return NextResponse.json({ error: "제출을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
