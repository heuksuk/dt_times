const OUTLINE = "#221f1a";

/** 윷 네 짝이 모두 뒤집힌 "모" — 제출 완료 축하용 */
export function YutCelebration({ size = 64 }: { size?: number }) {
  return (
    <svg aria-hidden="true" focusable="false" fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <g stroke={OUTLINE} strokeLinejoin="round" strokeWidth="2.2">
        {[-24, -8, 8, 24].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 32 54)`}>
            <rect fill="#f3ddb0" height="41" rx="5.5" width="11" x="26.5" y="13" />
            <path d="M28.8 30.5 L35.2 36.9 M35.2 30.5 L28.8 36.9" stroke="#b64a3d" strokeLinecap="round" strokeWidth="2" />
          </g>
        ))}
      </g>
      <g fill="#c7963f" stroke={OUTLINE} strokeLinejoin="round" strokeWidth="1.6">
        <path d="M8 40 L9.8 44.2 L14 46 L9.8 47.8 L8 52 L6.2 47.8 L2 46 L6.2 44.2 Z" />
        <path d="M56 41 L57.4 44.6 L61 46 L57.4 47.4 L56 51 L54.6 47.4 L51 46 L54.6 44.6 Z" />
      </g>
    </svg>
  );
}

/** 확인 도장 — 제출 직전 마지막 확인 화면용 */
export function CheckSeal({ size = 64 }: { size?: number }) {
  return (
    <svg aria-hidden="true" focusable="false" fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <circle cx="32" cy="32" fill="#3e7167" r="23" stroke={OUTLINE} strokeWidth="2.6" />
      <path d="M22 33.5 L29 40.5 L43 24.5" stroke="#fffaf1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5.4" />
    </svg>
  );
}

/** 이동 화살표 — 룰렛 결과에서 이전 팀 → 새 팀 */
export function MoveArrow({ size = 42 }: { size?: number }) {
  return (
    <svg aria-hidden="true" focusable="false" fill="none" height={(size * 52) / 64} viewBox="0 0 64 52" width={size}>
      <path d="M4 20 H34 V9 L60 26 L34 43 V32 H4 Z" fill="#ef6f4d" stroke={OUTLINE} strokeLinejoin="round" strokeWidth="2.6" />
    </svg>
  );
}
