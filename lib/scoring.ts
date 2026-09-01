import surveyConfig from "@/survey-config.json";
import { TEAM_CODES, type AnimalScores, type SurveyAnswers, type TeamCode } from "@/lib/types";

type ConfigQuestion = {
  id: number;
  team: TeamCode;
  reverse?: boolean;
};

const questions = surveyConfig.questions as ConfigQuestion[];

export function validateAnswers(value: unknown): SurveyAnswers | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const answers = value as Record<string, unknown>;
  const allowedIds = new Set(questions.map((question) => String(question.id)));
  const keys = Object.keys(answers);

  if (keys.length !== questions.length || keys.some((key) => !allowedIds.has(key))) return null;

  const normalized: SurveyAnswers = {};

  for (const question of questions) {
    const answer = answers[String(question.id)];
    if (typeof answer !== "number" || !Number.isInteger(answer) || answer < 1 || answer > 5) return null;
    normalized[String(question.id)] = answer;
  }

  return normalized;
}

export function calculateAssignment(answers: SurveyAnswers) {
  const scores = Object.fromEntries(TEAM_CODES.map((team) => [team, 0])) as AnimalScores;

  for (const question of questions) {
    const answer = answers[String(question.id)];
    scores[question.team] += question.reverse ? 6 - answer : answer;
  }

  const highestScore = Math.max(...TEAM_CODES.map((team) => scores[team]));
  const tiedTeams = TEAM_CODES.filter((team) => scores[team] === highestScore);
  const initialTeam = tiedTeams[Math.floor(Math.random() * tiedTeams.length)];

  return { scores, initialTeam };
}
