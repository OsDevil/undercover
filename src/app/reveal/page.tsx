"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RoleCard } from "@/components/RoleCard";
import { getAvatar } from "@/lib/gameLogic";
import { useGameStore } from "@/store/gameStore";

export default function RevealPage() {
  const router = useRouter();
  const { players, revealIndex, advanceReveal, setPhase, phase, firstSpeakerId } = useGameStore();

  useEffect(() => {
    if (phase === "playing") router.replace("/game");
    else if (phase !== "reveal" && phase !== "first_speaker") router.replace("/");
  }, [phase, router]);

  const sorted = [...players].sort((a, b) => a.order - b.order);
  const currentPlayer = sorted[revealIndex];

  if (phase === "first_speaker") {
    const firstSpeaker = players.find((p) => p.id === firstSpeakerId) ?? players[0];
    if (!firstSpeaker) return null;
    return (
      <main className="flex flex-col min-h-dvh bg-[var(--bg)] items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 200 }}
          className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-violet-500/15 border-2 border-violet-500/30 flex items-center justify-center">
            <Mic className="w-9 h-9 text-violet-500" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)] uppercase tracking-widest font-bold mb-2">
              Premier à parler
            </p>
            <p className="text-5xl mb-3">{getAvatar(firstSpeaker.order)}</p>
            <h1 className="text-3xl font-black text-[var(--text)]">{firstSpeaker.name}</h1>
          </div>
          <button
            onClick={() => {
              setPhase("playing");
              router.replace("/game");
            }}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-violet-500/25 mt-2"
          >
            C&apos;est parti !
          </button>
        </motion.div>
      </main>
    );
  }

  if (!currentPlayer) return null;

  const loverName =
    currentPlayer.specialRole === "amoureux" && currentPlayer.loverPartnerId
      ? players.find((p) => p.id === currentPlayer.loverPartnerId)?.name
      : undefined;

  return (
    <main className="flex flex-col min-h-dvh bg-[var(--bg)]">
      {/* Progress bar */}
      <div className="w-full h-1 bg-[var(--surface2)]">
        <div
          className="h-1 bg-gradient-to-r from-violet-600 to-purple-500 transition-all duration-500"
          style={{ width: `${((revealIndex + 1) / sorted.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPlayer.id}
            className="w-full flex flex-col items-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-4 text-center px-4">
              <p className="text-[var(--text-muted)] text-xs mb-1">
                {revealIndex + 1} / {sorted.length}
              </p>
              {revealIndex > 0 && (
                <p className="text-sm text-[var(--text-muted)]">
                  Passe le téléphone à{" "}
                  <span className="font-bold text-[var(--text)]">{currentPlayer.name}</span>
                </p>
              )}
            </div>

            <div className="w-full max-h-[75dvh] flex items-center justify-center">
              <RoleCard player={currentPlayer} loverName={loverName} onDone={advanceReveal} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
