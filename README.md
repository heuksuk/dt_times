# 동물팀 행사 페이지

단일 행사에 사용하는 Next.js + Supabase 설문/팀 배정 페이지입니다.

## 현재 구성

- Next.js App Router 기본 구조
- Supabase 브라우저·서버 클라이언트 분리
- 참여자와 팀 이동 이력 테이블 마이그레이션
- 외부 클라이언트의 DB 직접 접근을 막는 RLS 기본 설정

기존 정적 설문 시안(`index.html`, `app.js`, `styles.css`)과 설문 원본(`survey-config.json`)은 다음 단계의 화면 이관을 위해 보존했습니다.

## 시작하기

1. Node.js와 npm을 설치합니다.
2. 이 폴더에서 `npm install`을 실행합니다.
3. `.env.example`을 복사해 `.env.local`을 만들고 Supabase 값과 관리자 비밀번호를 채웁니다.
4. Supabase CLI 또는 SQL Editor에서 `supabase/migrations/0001_initial_schema.sql`을 적용합니다.
5. `npm run dev`로 실행합니다.

## 환경 변수

`NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`는 브라우저에서 사용 가능한 공개 값입니다.
`SUPABASE_SECRET_KEY`와 `ADMIN_PASSWORD`는 서버에서만 사용하며, Git 또는 클라이언트 코드에 노출하면 안 됩니다.

## 중복 제출 기준

다음 단계에서는 브라우저별 UUID를 `client_token`으로 저장하고 DB의 고유 제약으로 같은 브라우저의 중복 제출을 막습니다. 로그인 없는 일회성 행사이므로 브라우저를 바꾼 중복 제출까지 식별하지는 않습니다.
