import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용 관리자 클라이언트입니다.
 * service role key는 Route Handler 또는 Server Action에서만 import하세요.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Supabase 서버 환경 변수가 설정되지 않았습니다.");
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
