export type Role = "civil" | "undercover" | "mr_white";
export type SpecialRole = "jester" | "chameleon" | "vengeuse" | "amoureux";
export type GamePhase =
  | "lobby"
  | "config"
  | "reveal"
  | "first_speaker"
  | "playing"
  | "voting"
  | "mr_white_guess"
  | "vengeance"
  | "result";
export type Difficulty = "easy" | "medium" | "hard";

export interface WordPair {
  civil: string;
  undercover: string;
  difficulty: Difficulty;
}

export interface Player {
  id: string;
  name: string;
  order: number;
  role: Role;
  specialRole: SpecialRole | null;
  word: string | null;
  alive: boolean;
  loverPartnerId?: string;
}

export interface GameConfig {
  civilCount: number;
  undercoverCount: number;
  mrWhiteCount: number;
  specialRoles: Partial<Record<SpecialRole, boolean>>;
  difficulty: Difficulty | "custom";
  civilWord: string;
  undercoverWord: string;
  timerEnabled: boolean;
  timerDuration: number;
  mrWhiteCanStart: boolean;
}

export interface EliminationEntry {
  round: number;
  playerId: string;
  playerName: string;
  role: Role;
  specialRole: SpecialRole | null;
}

export interface WinResult {
  team: Role | "jester" | "amoureux";
  winnerIds: string[];
  reason: string;
}

export interface GameState {
  players: Player[];
  config: GameConfig;
  phase: GamePhase;
  round: number;
  revealIndex: number;
  eliminatedLog: EliminationEntry[];
  pendingVengeanceId: string | null;
  pendingMrWhiteId: string | null;
  winners: WinResult | null;
  firstSpeakerId: string | null;
}
