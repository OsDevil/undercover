"use client";

import { motion } from "framer-motion";
import { Home, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

const TEAM_CONFIG = {
  civil: { label: "Les Civils gagnent !", emoji: "🔵", color: "#3b82f6" },
  undercover: { label: "Les Undercovers gagnent !", emoji: "🔴", color: "#ef4444" },
  mr_white: { label: "Mr. White gagne !", emoji: "⚪", color: "#94a3b8" },
  jester: { label: "Le Jester gagne !", emoji: "🃏", color: "#f59e0b" },
  amoureux: { label: "Les Amoureux gagnent !", emoji: "❤️", color: "#f97316" },
};

const ROLE_LABEL: Record<string, string> = {
  civil: "Civil",
  undercover: "Undercover",
  mr_white: "Mr. White",
};
const ROLE_COLOR: Record<string, string> = {
  civil: "#3b82f6",
  undercover: "#ef4444",
  mr_white: "#94a3b8",
};

export default function ResultPage() {
  const router = useRouter();
  const { winners, players, config, reset, resetToLobby } = useGameStore();

  useEffect(() => {
    if (!winners) router.replace("/");
  }, [winners, router]);

  if (!winners) return null;

  const teamConfig = TEAM_CONFIG[winners.team] ?? TEAM_CONFIG.civil;
  const allSorted = [...players].sort((a, b) => a.order - b.order);
  const winnerIds = new Set(winners.winnerIds);

  return (
    <main className="flex flex-col min-h-dvh px-4 py-8 max-w-md mx-auto gap-6">
      {/* Winner banner */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="text-center py-8 rounded-2xl border"
        style={{ borderColor: `${teamConfig.color}40`, background: `${teamConfig.color}10` }}
      >
        <p className="text-5xl mb-3">{teamConfig.emoji}</p>
        <h1 className="text-2xl font-black" style={{ color: teamConfig.color }}>
          {teamConfig.label}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2 px-4 leading-relaxed">
          {winners.reason}
        </p>
      </motion.div>

      {/* Words reveal */}
      <section>
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Les mots
        </h2>
        <div className="flex gap-2">
          <div className="flex-1 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
            <p className="text-xs text-blue-400 mb-1">Civil</p>
            <p className="font-bold text-blue-200">{config.civilWord}</p>
          </div>
          <div className="flex-1 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
            <p className="text-xs text-red-400 mb-1">Undercover</p>
            <p className="font-bold text-red-200">{config.undercoverWord}</p>
          </div>
        </div>
      </section>

      {/* All players roles */}
      <section>
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Rôles révélés
        </h2>
        <div className="flex flex-col gap-2">
          {allSorted.map((p) => {
            const isWinner = winnerIds.has(p.id);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * p.order }}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isWinner
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-[var(--border)] bg-[var(--surface)]"
                } ${!p.alive ? "opacity-50" : ""}`}
              >
                <span className="w-7 h-7 rounded-full bg-[var(--surface2)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                  {p.order + 1}
                </span>
                <span className="flex-1 font-medium">
                  {p.name}
                  {!p.alive && <span className="text-[var(--text-muted)] text-xs ml-1">✕</span>}
                  {isWinner && <span className="ml-1">🏆</span>}
                </span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    color: ROLE_COLOR[p.role] ?? "#fff",
                    background: `${ROLE_COLOR[p.role] ?? "#fff"}22`,
                  }}
                >
                  {ROLE_LABEL[p.role] ?? p.role}
                </span>
                {p.specialRole && (
                  <span className="text-xs text-[var(--text-muted)]">{p.specialRole}</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-auto">
        <button
          onClick={() => {
            resetToLobby();
            router.push("/lobby");
          }}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          Rejouer (mêmes joueurs)
        </button>
        <button
          onClick={() => {
            reset();
            router.push("/");
          }}
          className="w-full h-12 rounded-2xl border border-[var(--border)] text-[var(--text-muted)] font-medium flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Home className="w-4 h-4" />
          Retour à l&apos;accueil
        </button>
      </div>
    </main>
  );
}
