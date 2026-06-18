"use client";

import { motion } from "framer-motion";
import { Heart, Home, RefreshCw, Skull, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAvatar } from "@/lib/gameLogic";
import type { EliminationEntry } from "@/lib/types";
import { useGameStore } from "@/store/gameStore";

const TEAM_CONFIG: Record<
  string,
  { label: string; emoji: string; color: string; bg: string; glow: string }
> = {
  civil: {
    label: "Les Civils gagnent !",
    emoji: "🔵",
    color: "#2563eb",
    bg: "#2563eb12",
    glow: "#2563eb40",
  },
  undercover: {
    label: "Les Undercovers gagnent !",
    emoji: "🔴",
    color: "#dc2626",
    bg: "#dc262612",
    glow: "#dc262640",
  },
  mr_white: {
    label: "Mr. White gagne !",
    emoji: "⚪",
    color: "#64748b",
    bg: "#64748b12",
    glow: "#64748b40",
  },
  jester: {
    label: "Le Jester gagne !",
    emoji: "🃏",
    color: "#d97706",
    bg: "#d9770612",
    glow: "#d9770640",
  },
  amoureux: {
    label: "Les Amoureux gagnent !",
    emoji: "❤️",
    color: "#ea580c",
    bg: "#ea580c12",
    glow: "#ea580c40",
  },
};

const ROLE_LABEL: Record<string, string> = {
  civil: "Civil",
  undercover: "Undercover",
  mr_white: "Mr. White",
};

const ROLE_COLOR: Record<string, string> = {
  civil: "#2563eb",
  undercover: "#dc2626",
  mr_white: "#64748b",
};

const SPECIAL_LABEL: Record<string, string> = {
  jester: "Jester",
  chameleon: "Caméléon",
  vengeuse: "Vengeuse",
  amoureux: "Amoureux",
};

const SPECIAL_COLOR: Record<string, string> = {
  jester: "#d97706",
  chameleon: "#059669",
  vengeuse: "#db2777",
  amoureux: "#ea580c",
};

function detectAmoureuxCascade(log: EliminationEntry[]): { name1: string; name2: string } | null {
  const byRound = new Map<number, EliminationEntry[]>();
  for (const e of log) {
    if (e.specialRole === "amoureux") {
      const arr = byRound.get(e.round) ?? [];
      arr.push(e);
      byRound.set(e.round, arr);
    }
  }
  for (const entries of byRound.values()) {
    if (entries.length >= 2 && entries[0] && entries[1]) {
      return { name1: entries[0].playerName, name2: entries[1].playerName };
    }
  }
  return null;
}

export default function ResultPage() {
  const router = useRouter();
  const { winners, players, config, eliminatedLog, reset, resetToLobby } = useGameStore();

  useEffect(() => {
    if (!winners) router.replace("/");
  }, [winners, router]);

  if (!winners) return null;

  const teamCfg = TEAM_CONFIG[winners.team] ?? TEAM_CONFIG.civil!;
  const allSorted = [...players].sort((a, b) => a.order - b.order);
  const winnerIds = new Set(winners.winnerIds);
  const amoureuxCascade = detectAmoureuxCascade(eliminatedLog);
  const eliminationTimeline = [...eliminatedLog].sort((a, b) => a.round - b.round);

  return (
    <main className="flex flex-col min-h-dvh max-w-md mx-auto bg-[var(--bg)]">
      <div className="flex-1 flex flex-col px-4 py-6 gap-6 overflow-y-auto pb-32">
        {/* Winner banner */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 14, stiffness: 200 }}
          className="text-center py-8 px-4 rounded-3xl border-2 relative overflow-hidden"
          style={{ borderColor: teamCfg.glow, background: teamCfg.bg }}
        >
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 10 }}
            className="text-6xl mb-3"
          >
            {teamCfg.emoji}
          </motion.p>
          <h1 className="text-2xl font-black" style={{ color: teamCfg.color }}>
            {teamCfg.label}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">{winners.reason}</p>
        </motion.div>

        {/* Amoureux cascade drama (if it happened) */}
        {amoureuxCascade && (
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-3 px-4 py-4 rounded-2xl bg-orange-500/10 border border-orange-500/30"
          >
            <Heart className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-orange-500 text-sm">Cascade Amoureuse 💔</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                <span className="font-semibold text-[var(--text)]">{amoureuxCascade.name1}</span> et{" "}
                <span className="font-semibold text-[var(--text)]">{amoureuxCascade.name2}</span>{" "}
                étaient les Amoureux. L&apos;un est mort, l&apos;autre n&apos;a pas pu survivre sans
                lui.
              </p>
            </div>
          </motion.div>
        )}

        {/* Words reveal */}
        <section>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
            Les mots secrets
          </p>
          <div className="flex gap-3">
            <div className="flex-1 py-4 px-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
              <p className="text-xs text-blue-500 font-bold mb-2">Civils</p>
              <p className="text-xl font-black text-blue-600">{config.civilWord}</p>
            </div>
            <div className="flex-1 py-4 px-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-xs text-red-500 font-bold mb-2">Undercover</p>
              <p className="text-xl font-black text-red-600">{config.undercoverWord}</p>
            </div>
          </div>
        </section>

        {/* Player scoreboard */}
        <section>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
            Rôles révélés
          </p>
          <div className="flex flex-col gap-2">
            {allSorted.map((p, i) => {
              const isWinner = winnerIds.has(p.id);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-2xl border ${
                    isWinner
                      ? "border-yellow-400/50 bg-yellow-400/8"
                      : "border-[var(--border)] bg-[var(--surface)]"
                  } ${!p.alive ? "opacity-50" : ""}`}
                >
                  <span className="text-2xl leading-none">{getAvatar(p.order)}</span>
                  <span className="flex-1 font-semibold text-[var(--text)]">
                    {p.name}
                    {!p.alive && <span className="text-[var(--text-muted)] text-xs ml-1.5">✕</span>}
                  </span>
                  {isWinner && <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                  {p.specialRole && (
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                      style={{
                        color: SPECIAL_COLOR[p.specialRole] ?? "#888",
                        background: `${SPECIAL_COLOR[p.specialRole] ?? "#888"}20`,
                      }}
                    >
                      {SPECIAL_LABEL[p.specialRole] ?? p.specialRole}
                    </span>
                  )}
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{
                      color: ROLE_COLOR[p.role] ?? "#888",
                      background: `${ROLE_COLOR[p.role] ?? "#888"}20`,
                    }}
                  >
                    {ROLE_LABEL[p.role] ?? p.role}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Elimination timeline */}
        {eliminationTimeline.length > 0 && (
          <section>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
              <Skull className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />
              Ordre d&apos;élimination
            </p>
            <div className="flex flex-col gap-1.5">
              {eliminationTimeline.map((e, i) => (
                <motion.div
                  key={`${e.playerId}-${e.round}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
                >
                  <span className="text-lg">
                    {getAvatar(players.find((p) => p.id === e.playerId)?.order ?? 0)}
                  </span>
                  <span className="flex-1 text-sm font-medium text-[var(--text)]">
                    {e.playerName}
                  </span>
                  {e.specialRole && (
                    <span
                      className="text-xs font-bold"
                      style={{ color: SPECIAL_COLOR[e.specialRole] ?? "#888" }}
                    >
                      {SPECIAL_LABEL[e.specialRole]}
                    </span>
                  )}
                  <span
                    className="text-xs font-bold"
                    style={{ color: ROLE_COLOR[e.role] ?? "#888" }}
                  >
                    {ROLE_LABEL[e.role] ?? e.role}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--surface2)] px-1.5 py-0.5 rounded-md">
                    T{e.round}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky actions */}
      <div className="sticky bottom-0 bg-[var(--bg)] border-t border-[var(--border)] px-4 py-4 flex flex-col gap-2">
        <button
          onClick={() => {
            resetToLobby();
            router.push("/lobby");
          }}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-violet-500/25"
        >
          <RefreshCw className="w-5 h-5" />
          Rejouer — mêmes joueurs
        </button>
        <button
          onClick={() => {
            reset();
            router.push("/");
          }}
          className="w-full h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Home className="w-4 h-4" />
          Accueil
        </button>
      </div>
    </main>
  );
}
