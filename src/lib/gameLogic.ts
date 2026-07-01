import type { EliminationEntry, GameConfig, Player, WinResult } from "./types";

const ANIMALS = [
  "🐱",
  "🐶",
  "🦊",
  "🐺",
  "🐻",
  "🐼",
  "🐨",
  "🦁",
  "🐯",
  "🦝",
  "🐸",
  "🐙",
  "🦋",
  "🦅",
  "🦉",
  "🐬",
  "🦄",
  "🐲",
];

export function getAvatar(order: number): string {
  return ANIMALS[order % ANIMALS.length] ?? "🎭";
}

export function checkVictory(
  players: Player[],
  eliminatedLog: EliminationEntry[],
  _round: number
): WinResult | null {
  const alive = players.filter((p) => p.alive);
  const aliveCivils = alive.filter((p) => p.role === "civil");
  const aliveUndercovers = alive.filter((p) => p.role === "undercover");
  const aliveMrWhites = alive.filter((p) => p.role === "mr_white");

  // Check Jester: eliminated at Round 1
  const lastElim = eliminatedLog[eliminatedLog.length - 1];
  if (lastElim && lastElim.round === 1 && lastElim.specialRole === "jester") {
    return {
      team: "jester",
      winnerIds: [lastElim.playerId],
      reason: `${lastElim.playerName} était le Jester et a été éliminé au Tour 1 !`,
    };
  }

  // Amoureux: if only two lovers left and they're the only ones
  const aliveLovers = alive.filter((p) => p.specialRole === "amoureux");
  if (aliveLovers.length === 2 && alive.length === 2) {
    return {
      team: "amoureux",
      winnerIds: aliveLovers.map((p) => p.id),
      reason: `Les Amoureux ont survécu ensemble !`,
    };
  }

  // All threats eliminated → Civils win
  if (aliveUndercovers.length === 0 && aliveMrWhites.length === 0) {
    return {
      team: "civil",
      winnerIds: aliveCivils.map((p) => p.id),
      reason: "Les Civils ont éliminé tous leurs ennemis !",
    };
  }

  // Mr. White alone wins
  if (alive.length === 1 && aliveMrWhites.length === 1) {
    return {
      team: "mr_white",
      winnerIds: aliveMrWhites.map((p) => p.id),
      reason: `${aliveMrWhites[0]!.name} (Mr. White) est le dernier survivant !`,
    };
  }

  // Civil + Mr. White only → Mr. White gets a guess (signal, not win yet)
  // Handled by pendingMrWhiteId in store

  // Undercovers ≥ Civils and no Mr. White → Undercovers win
  if (
    aliveMrWhites.length === 0 &&
    aliveUndercovers.length > 0 &&
    aliveUndercovers.length >= aliveCivils.length
  ) {
    return {
      team: "undercover",
      winnerIds: aliveUndercovers.map((p) => p.id),
      reason: "Les Undercovers sont désormais en majorité !",
    };
  }

  return null;
}

export function shouldTriggerMrWhiteGuess(players: Player[]): string | null {
  const alive = players.filter((p) => p.alive);
  const aliveCivils = alive.filter((p) => p.role === "civil");
  const aliveUndercovers = alive.filter((p) => p.role === "undercover");
  const aliveMrWhites = alive.filter((p) => p.role === "mr_white");

  // Civil + Mr. White are the only ones left
  if (aliveMrWhites.length === 1 && aliveUndercovers.length === 0 && aliveCivils.length >= 1) {
    return aliveMrWhites[0]!.id;
  }
  return null;
}

export function pickFirstSpeaker(players: Player[], config: GameConfig): string | null {
  const alive = players.filter((p) => p.alive);
  if (alive.length === 0) return null;
  const eligible = config.mrWhiteCanStart ? alive : alive.filter((p) => p.role !== "mr_white");
  const pool = eligible.length > 0 ? eligible : alive;
  return pool[Math.floor(Math.random() * pool.length)]!.id;
}

export function getLoverPartner(players: Player[], playerId: string): Player | null {
  const player = players.find((p) => p.id === playerId);
  if (!player?.loverPartnerId) return null;
  return players.find((p) => p.id === player.loverPartnerId) ?? null;
}

export function getWordDisplay(player: Player): { primary: string; secondary?: string } {
  if (player.specialRole === "chameleon" && player.word) {
    const parts = player.word.split("|||");
    const words = [parts[0] ?? "", parts[1] ?? ""].sort(() => Math.random() - 0.5);
    return { primary: words[0]!, secondary: words[1]! };
  }
  return { primary: player.word ?? "—" };
}
