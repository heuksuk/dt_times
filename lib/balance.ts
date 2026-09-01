import { TEAM_CODES, type TeamCode } from "@/lib/types";

export type TeamCounts = Record<TeamCode, number>;

export function getTeamCounts(teams: TeamCode[]): TeamCounts {
  const counts = Object.fromEntries(TEAM_CODES.map((team) => [team, 0])) as TeamCounts;

  for (const team of teams) counts[team] += 1;

  return counts;
}

/**
 * 전체 인원을 다섯 팀에 최대 1명 차이로 나눕니다.
 * 나머지 자리는 현재 인원이 많은 팀에 우선 배정해 이동 횟수를 줄입니다.
 */
export function getAutomaticTargets(counts: TeamCounts): TeamCounts {
  const total = TEAM_CODES.reduce((sum, team) => sum + counts[team], 0);
  const base = Math.floor(total / TEAM_CODES.length);
  const remainder = total % TEAM_CODES.length;
  const targets = Object.fromEntries(TEAM_CODES.map((team) => [team, base])) as TeamCounts;
  const rankedTeams = [...TEAM_CODES].sort((left, right) => counts[right] - counts[left]);

  for (const team of rankedTeams.slice(0, remainder)) targets[team] += 1;

  return targets;
}

export function hasImbalance(counts: TeamCounts, targets: TeamCounts) {
  return TEAM_CODES.some((team) => counts[team] > targets[team]);
}
