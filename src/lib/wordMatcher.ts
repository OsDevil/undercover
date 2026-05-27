function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j]! =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function mrWhiteWins(guess: string, civilWord: string): boolean {
  const g = normalize(guess);
  const t = normalize(civilWord);

  if (!g) return false;
  if (g === t) return true;

  // substring match (e.g. "jordan" matches "michael jordan")
  if (t.includes(g) || g.includes(t)) return true;

  // word-level match: any word in guess matches any word in target
  const gWords = g.split(" ").filter(Boolean);
  const tWords = t.split(" ").filter(Boolean);
  for (const gw of gWords) {
    for (const tw of tWords) {
      if (gw === tw) return true;
      if (gw.length >= 4 && tw.length >= 4 && levenshtein(gw, tw) <= 1) return true;
    }
  }

  // whole-string levenshtein with dynamic threshold
  const threshold = Math.max(2, Math.floor(t.length * 0.25));
  return levenshtein(g, t) <= threshold;
}
