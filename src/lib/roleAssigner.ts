import type { GameConfig, Player, SpecialRole } from "./types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function assignRoles(players: Player[], config: GameConfig): Player[] {
  const { civilCount, undercoverCount, mrWhiteCount, specialRoles, civilWord, undercoverWord } =
    config;

  // Build role pool
  const roles: Array<{ role: Player["role"]; word: string | null }> = [
    ...Array(civilCount)
      .fill(null)
      .map(() => ({ role: "civil" as const, word: civilWord })),
    ...Array(undercoverCount)
      .fill(null)
      .map(() => ({ role: "undercover" as const, word: undercoverWord })),
    ...Array(mrWhiteCount)
      .fill(null)
      .map(() => ({ role: "mr_white" as const, word: null })),
  ];

  const shuffledRoles = shuffle(roles);
  const shuffledPlayers = [...players].sort((a, b) => a.order - b.order);

  const assigned: Player[] = shuffledPlayers.map((p, i) => ({
    ...p,
    role: shuffledRoles[i]!.role,
    word: shuffledRoles[i]!.word,
    specialRole: null,
    alive: true,
    loverPartnerId: undefined,
  }));

  // Assign special roles
  const activeSpecials = (Object.keys(specialRoles) as SpecialRole[]).filter(
    (k) => specialRoles[k]
  );

  for (const special of activeSpecials) {
    if (special === "amoureux") {
      const eligible = assigned.filter((p) => !p.specialRole);
      if (eligible.length >= 2) {
        const [a, b] = shuffle(eligible);
        if (a && b) {
          a.specialRole = "amoureux";
          b.specialRole = "amoureux";
          a.loverPartnerId = b.id;
          b.loverPartnerId = a.id;
        }
      }
      continue;
    }

    if (special === "chameleon") {
      // Caméléon must be a civil
      const eligible = assigned.filter((p) => p.role === "civil" && !p.specialRole);
      if (eligible.length > 0) {
        const target = shuffle(eligible)[0]!;
        target.specialRole = "chameleon";
        // Caméléon sees both words — store undercover word in a second field via word encoding
        // We encode as "civil|undercover" and decode in the reveal card
        target.word = `${civilWord}|||${undercoverWord}`;
      }
      continue;
    }

    const eligible = assigned.filter((p) => !p.specialRole);
    if (eligible.length > 0) {
      const target = shuffle(eligible)[0]!;
      target.specialRole = special;
    }
  }

  return assigned;
}

export function suggestRoleCounts(playerCount: number): {
  civilCount: number;
  undercoverCount: number;
  mrWhiteCount: number;
} {
  if (playerCount <= 4) return { civilCount: 2, undercoverCount: 1, mrWhiteCount: 0 };
  if (playerCount <= 6) return { civilCount: playerCount - 2, undercoverCount: 1, mrWhiteCount: 1 };
  if (playerCount <= 8) return { civilCount: playerCount - 3, undercoverCount: 2, mrWhiteCount: 1 };
  if (playerCount <= 10)
    return { civilCount: playerCount - 4, undercoverCount: 2, mrWhiteCount: 2 };
  return { civilCount: playerCount - 4, undercoverCount: 3, mrWhiteCount: 1 };
}
