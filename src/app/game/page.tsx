"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Home, Users, Vote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MrWhiteGuess } from "@/components/MrWhiteGuess";
import { VengeanceModal } from "@/components/VengeanceModal";
import { VoteGrid } from "@/components/VoteGrid";
import { useGameStore } from "@/store/gameStore";

const ROLE_COLOR: Record<string, string> = {
  civil: "#3b82f6",
  undercover: "#ef4444",
  mr_white: "#94a3b8",
};

export default function GamePage() {
  const router = useRouter();
  const {
    players,
    phase,
    round,
    config,
    eliminatedLog,
    pendingVengeanceId,
    pendingMrWhiteId,
    setPhase,
    eliminatePlayer,
    resolveVengeance,
    resolveMrWhiteGuess,
  } = useGameStore();

  useEffect(() => {
    if (phase === "result") router.replace("/result");
    if (phase === "lobby" || phase === "config" || phase === "reveal") router.replace("/");
  }, [phase, router]);

  const alivePlayers = [...players].filter((p) => p.alive).sort((a, b) => a.order - b.order);

  const eliminatedThisGame = [...eliminatedLog].sort((a, b) => a.round - b.round);

  if (phase === "mr_white_guess" && pendingMrWhiteId) {
    const mrWhite = players.find((p) => p.id === pendingMrWhiteId);
    if (mrWhite) {
      return (
        <main className="flex flex-col min-h-dvh items-center justify-center">
          <MrWhiteGuess
            mrWhiteName={mrWhite.name}
            civilWord={config.civilWord}
            onResult={resolveMrWhiteGuess}
          />
        </main>
      );
    }
  }

  if (phase === "vengeance" && pendingVengeanceId) {
    const vengeuse = players.find((p) => p.id === pendingVengeanceId);
    const candidates = alivePlayers;
    if (vengeuse) {
      return (
        <main className="flex flex-col min-h-dvh items-center justify-center">
          <VengeanceModal
            vengeuseName={vengeuse.name}
            candidates={candidates}
            onResolve={resolveVengeance}
          />
        </main>
      );
    }
  }

  return (
    <main className="flex flex-col min-h-dvh px-4 py-6 max-w-md mx-auto gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Tour {round}</h1>
            <span className="px-2 py-0.5 rounded-full bg-[var(--surface2)] text-xs text-[var(--text-muted)]">
              {alivePlayers.length} vivants
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {phase === "voting" ? "Vote en cours" : "Phase de discussion"}
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {phase === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            {/* Alive players */}
            <section>
              <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Joueurs en vie
              </h2>
              <div className="flex flex-col gap-2">
                {alivePlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
                  >
                    <span className="w-7 h-7 rounded-full bg-[var(--surface2)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                      {p.order + 1}
                    </span>
                    <span className="font-medium flex-1">{p.name}</span>
                    {p.specialRole && (
                      <span className="text-xs text-[var(--text-muted)] italic">
                        {p.specialRole}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Eliminated */}
            {eliminatedThisGame.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                  Éliminés
                </h2>
                <div className="flex flex-col gap-1.5">
                  {eliminatedThisGame.map((e) => (
                    <div
                      key={`${e.playerId}-${e.round}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] opacity-60"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: ROLE_COLOR[e.role] ?? "#fff" }}
                      />
                      <span className="text-sm flex-1 line-through">{e.playerName}</span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: ROLE_COLOR[e.role] ?? "#fff" }}
                      >
                        {e.role === "mr_white"
                          ? "Mr. White"
                          : e.role === "undercover"
                            ? "Undercover"
                            : "Civil"}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">T{e.round}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <button
              onClick={() => setPhase("voting")}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-700 to-red-800 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all mt-auto"
            >
              <Vote className="w-5 h-5" />
              Passer au vote
            </button>
          </motion.div>
        )}

        {phase === "voting" && (
          <motion.div
            key="voting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Qui éliminer ?</h2>
              <button
                onClick={() => setPhase("playing")}
                className="text-xs text-[var(--text-muted)] underline"
              >
                Annuler le vote
              </button>
            </div>
            <VoteGrid players={players} onEliminate={eliminatePlayer} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
