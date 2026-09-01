import { createClient } from "@supabase/supabase-js";

/**
 * 브라우저에서 사용하는 공개 Supabase 클라이언트입니다.
 * 실제 참여자 데이터 저장은 다음 단계의 서버 API가 담당합니다.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase 공개 환경 변수가 설정되지 않았습니다.");
  }

  return createClient(url, publishableKey);
}
