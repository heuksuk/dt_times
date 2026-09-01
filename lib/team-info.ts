import surveyConfig from "@/survey-config.json";
import type { TeamCode } from "@/lib/types";

type TeamInfo = {
  name: string;
  animal: string;
  icon: string;
  keywords: string[];
  summary: string;
};

const icons: Record<TeamCode, string> = {
  DO: "🐷",
  GAE: "🐶",
  GEOL: "🐑",
  YUT: "🐮",
  MO: "🐴",
};

export const TEAM_INFO = Object.fromEntries(
  Object.entries(surveyConfig.teams).map(([code, team]) => [
    code,
    { ...team, icon: icons[code as TeamCode] },
  ]),
) as Record<TeamCode, TeamInfo>;
