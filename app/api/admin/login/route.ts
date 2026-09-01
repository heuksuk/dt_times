import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken, isAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const password = body && typeof body === "object" && "password" in body && typeof body.password === "string"
    ? body.password
    : "";

  try {
    if (!isAdminPassword(password)) {
      return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status: 401 });
    }
  } catch (error) {
    console.error("Admin login configuration error", error);
    return NextResponse.json({ error: "관리자 인증을 설정하지 못했습니다." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });

  return response;
}
