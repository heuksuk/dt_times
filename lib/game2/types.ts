import type { TeamCode } from "@/lib/types";

export type Game2Scores = Record<TeamCode, number>;

export type Game2Session = {
  id: string;
  status: "ready" | "playing" | "finished";
  current_round: number;
  scores: Game2Scores;
  revealed: Record<string, number[]>;
  fully_revealed: string[];
  version: number;
  updated_at: string;
};

export type Game2ScoreEvent = {
  id: string;
  team: TeamCode;
  points: number;
  reason: "letter" | "phrase" | "undo";
  round_index: number;
  created_at: string;
};
