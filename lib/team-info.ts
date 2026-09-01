import surveyConfig from "@/survey-config.json";
import type { TeamCode } from "@/lib/types";

type TeamInfo = {
  name: string;
  animal: string;
  icon: string;
  keywords: string[];
  summary: string;
  strengthHeadline: string;
  strengthDescription: string;
  teamMagic: string;
};

const icons: Record<TeamCode, string> = {
  DO: "/team-icons/pig.png",
  GAE: "/team-icons/dog.png",
  GEOL: "/team-icons/sheep.png",
  YUT: "/team-icons/cow.png",
  MO: "/team-icons/horse.png",
};

const profiles: Record<
  TeamCode,
  Pick<TeamInfo, "strengthHeadline" | "strengthDescription" | "teamMagic">
> = {
  DO: {
    strengthHeadline: "어색함을 ‘우리의 이야기’로 바꾸는 분위기 촉진자",
    strengthDescription:
      "돼지 팀은 사람 사이의 온도를 먼저 읽는 편입니다. 누군가 혼자 있거나 대화가 잠시 멈춰도, 자연스러운 한마디와 작은 리액션으로 모두가 편안히 섞일 수 있는 틈을 만듭니다. 함께 있을수록 에너지가 더 커지는 팀이에요.",
    teamMagic: "처음 만난 사이인데 10분 뒤에는 단체 사진 포즈를 정하고 있을지도 몰라요.",
  },
  GAE: {
    strengthHeadline: "‘함께’라는 약속을 끝까지 지켜 내는 신뢰의 중심",
    strengthDescription:
      "개 팀은 누군가 믿고 등을 맡길 수 있는 사람들입니다. 맡은 역할을 가볍게 넘기지 않고, 팀원이 어려워 보이면 먼저 손을 내밉니다. 말보다 행동으로 안정감을 주기 때문에, 이 팀이 있으면 협업의 바닥이 단단해집니다.",
    teamMagic: "한 명이 ‘같이 해줄래?’라고 말하면 모두가 자연스럽게 소매를 걷습니다.",
  },
  GEOL: {
    strengthHeadline: "말하지 않은 마음까지 살피는 관계의 조율자",
    strengthDescription:
      "양 팀은 대화의 내용뿐 아니라 그 안의 마음까지 귀 기울이는 편입니다. 의견이 달라도 누가 틀렸는지를 가르기보다, 모두가 납득할 수 있는 접점을 찾습니다. 그래서 이 팀 주변에서는 각자의 목소리가 존중받는다는 감각이 살아납니다.",
    teamMagic: "의견이 세 갈래로 나뉘어도 마지막에는 모두가 고개를 끄덕일 답을 찾아냅니다.",
  },
  YUT: {
    strengthHeadline: "조용한 집중으로 계획을 결과로 바꾸는 완주자",
    strengthDescription:
      "소 팀은 눈에 띄는 한 방보다 꾸준함의 힘을 압니다. 해야 할 일을 차근차근 정리하고, 중간에 흔들려도 자기 속도로 끝까지 갑니다. 팀에 이들이 있으면 좋은 아이디어가 ‘언젠가’가 아니라 실제 결과물이 됩니다.",
    teamMagic: "다른 팀이 계획을 이야기하는 동안, 이 팀은 체크리스트 첫 칸을 완료합니다.",
  },
  MO: {
    strengthHeadline: "정체된 순간에 첫발을 내딛게 하는 변화의 점화자",
    strengthDescription:
      "말 팀은 가능성이 보이면 망설임보다 실행을 먼저 선택합니다. 새로운 길과 더 나은 방식을 발견하면 주변에도 자연스럽게 용기를 건넵니다. 변화 앞에서 팀의 시선을 앞으로 돌리고, ‘해보자’를 현실의 움직임으로 만드는 사람들입니다.",
    teamMagic: "누군가 ‘한번 해볼까?’라고 말하는 순간, 이미 출발한 사람이 있습니다.",
  },
};

export const TEAM_INFO = Object.fromEntries(
  Object.entries(surveyConfig.teams).map(([code, team]) => [
    code,
    {
      ...team,
      icon: icons[code as TeamCode],
      ...profiles[code as TeamCode],
    },
  ]),
) as Record<TeamCode, TeamInfo>;
