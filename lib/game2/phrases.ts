export type Game2Phrase = {
  id: string;
  text: string;
  source: string;
  category: "속담" | "인물명언" | "영화" | "드라마";
};

export const GAME2_PHRASES: Game2Phrase[] = [
  { id: "example-1", text: "원숭이도 나무에서 떨어진다.", source: "속담", category: "속담" },
  { id: "proverb-1", text: "가는 말이 고와야 오는 말이 곱다.", source: "속담", category: "속담" },
  { id: "proverb-2", text: "낮말은 새가 듣고 밤말은 쥐가 듣는다.", source: "속담", category: "속담" },
  { id: "proverb-3", text: "세 살 버릇 여든까지 간다.", source: "속담", category: "속담" },
  { id: "proverb-4", text: "소 잃고 외양간 고친다.", source: "속담", category: "속담" },
  { id: "proverb-5", text: "배보다 배꼽이 더 크다.", source: "속담", category: "속담" },
  { id: "quote-1", text: "나의 죽음을 적에게 알리지 마라.", source: "이순신", category: "인물명언" },
  { id: "quote-2", text: "나는 생각한다. 고로 존재한다.", source: "데카르트", category: "인물명언" },
  { id: "quote-3", text: "실패는 성공의 어머니다.", source: "에디슨", category: "인물명언" },
  { id: "movie-1", text: "묻고 더블로 가!", source: "《타짜》", category: "영화" },
  { id: "movie-2", text: "내가 왕이 될 상인가?", source: "《관상》", category: "영화" },
  { id: "movie-3", text: "아직 한 발 남았다.", source: "《아저씨》", category: "영화" },
  { id: "movie-4", text: "호의가 계속되면 그게 권리인 줄 알아요.", source: "《부당거래》", category: "영화" },
  { id: "movie-5", text: "느그 서장 남천동 살제?", source: "《범죄와의 전쟁》", category: "영화" },
  { id: "drama-1", text: "나랑 밥 먹을래? 나랑 죽을래?", source: "《미안하다, 사랑한다》", category: "드라마" },
  { id: "drama-2", text: "누가 기침 소리를 내었는가?", source: "《태조 왕건》", category: "드라마" },
];

export function isRevealableCharacter(character: string) {
  return /[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z0-9]/.test(character);
}
