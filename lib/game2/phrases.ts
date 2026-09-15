export type Game2Phrase = {
  id: string;
  text: string;
  source: string;
  category: "속담" | "인물명언" | "영화" | "드라마";
};

export type Game2FaceRound = {
  id: string;
  name: string;
  image: string;
  category: "인물 맞히기";
  revealOrder: number[];
};

export const GAME2_PHRASES: Game2Phrase[] = [
  { id: "example-1", text: "원숭이도 나무에서 떨어진다.", source: "속담", category: "속담" },
  { id: "proverb-1", text: "가는 말이 고와야 오는 말이 곱다.", source: "속담", category: "속담" },
  { id: "proverb-2", text: "낮말은 새가 듣고 밤말은 쥐가 듣는다.", source: "속담", category: "속담" },
  { id: "proverb-5", text: "배보다 배꼽이 더 크다.", source: "속담", category: "속담" },
  { id: "quote-1", text: "나의 죽음을 적에게 알리지 마라.", source: "이순신", category: "인물명언" },
  { id: "quote-2", text: "나는 생각한다. 고로 존재한다.", source: "데카르트", category: "인물명언" },
  { id: "movie-1", text: "묻고 더블로 가!", source: "《타짜》", category: "영화" },
  { id: "movie-2", text: "내가 왕이 될 상인가?", source: "《관상》", category: "영화" },
  { id: "movie-3", text: "아직 한 발 남았다.", source: "《아저씨》", category: "영화" },
  { id: "movie-4", text: "호의가 계속되면 그게 권리인 줄 알아요.", source: "《부당거래》", category: "영화" },
  { id: "movie-5", text: "느그 서장 남천동 살제?", source: "《범죄와의 전쟁》", category: "영화" },
  { id: "drama-1", text: "나랑 밥 먹을래? 나랑 죽을래?", source: "《미안하다, 사랑한다》", category: "드라마" },
  { id: "drama-2", text: "누가 기침 소리를 내었는가?", source: "《태조 왕건》", category: "드라마" },
];

export const GAME2_FACE_ROUNDS: Game2FaceRound[] = [
  { id: "face-ma-dong-seok", name: "마동석", image: "/game2/people/ma-dong-seok.png", category: "인물 맞히기", revealOrder: [4, 3, 5, 1, 7, 0, 2, 6, 8] },
  { id: "face-yoo-jae-suk", name: "유재석", image: "/game2/people/yoo-jae-suk.png", category: "인물 맞히기", revealOrder: [4, 1, 3, 5, 7, 0, 2, 6, 8] },
  { id: "face-shin-dong-yup", name: "신동엽", image: "/game2/people/shin-dong-yup.png", category: "인물 맞히기", revealOrder: [1, 4, 0, 2, 3, 5, 7, 6, 8] },
];

export type Game2Round =
  | (Game2Phrase & { kind: "phrase" })
  | (Game2FaceRound & { kind: "face" });

export const GAME2_ROUNDS: Game2Round[] = [
  ...GAME2_PHRASES.map((phrase) => ({ ...phrase, kind: "phrase" as const })),
  ...GAME2_FACE_ROUNDS.map((face) => ({ ...face, kind: "face" as const })),
];

export function isRevealableCharacter(character: string) {
  return /[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z0-9]/.test(character);
}
