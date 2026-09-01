import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  if (!isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const open = body && typeof body === "object" && "open" in body && typeof body.open === "boolean"
    ? body.open
    : null;

  if (open === null) {
    return NextResponse.json({ error: "잘못된 접수 상태입니다." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("event_settings")
      .update({ submissions_open: open, updated_at: new Date().toISOString() })
      .eq("id", true);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to update submission status", error);
    return NextResponse.json({ error: "접수 상태를 변경하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
