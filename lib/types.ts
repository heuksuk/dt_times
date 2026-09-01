export const TEAM_CODES = ["DO", "GAE", "GEOL", "YUT", "MO"] as const;

export type TeamCode = (typeof TEAM_CODES)[number];
export type AnimalScores = Record<TeamCode, number>;
export type SurveyAnswers = Record<string, number>;
