"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RoleCard } from "@/components/RoleCard";
import { useGameStore } from "@/store/gameStore";

export default function RevealPage() {
  const router = useRouter();
  const { players, revealIndex, advanceReveal, phase } = useGameStore();

  useEffect(() => {
    if (phase === "playing") router.replace("/game");
    else if (phase !== "reveal") router.replace("/");
  }, [phase, router]);

  const sorted = [...players].sort((a, b) => a.order - b.order);
  const currentPlayer = sorted[revealIndex];

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
