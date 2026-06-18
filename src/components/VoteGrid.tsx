"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { getAvatar } from "@/lib/gameLogic";
import type { Player } from "@/lib/types";

export function VoteGrid({
  players,
  onEliminate,
}: {
  players: Player[];
  onEliminate: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const alive = [...players].filter((p) => p.alive).sort((a, b) => a.order - b.order);
  const selectedPlayer = alive.find((p) => p.id === selected);

  function handleSelect(id: string) {
    setSelected((prev) => (prev === id ? null : id));
  }

  function handleEliminate() {
    if (!selected) return;
    onEliminate(selected);
    setSelected(null);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 pb-28">
        {alive.map((player) => {
          const isSelected = player.id === selected;
          return (
            <motion.button
              key={player.id}
              onClick={() => handleSelect(player.id)}
              whileTap={{ scale: 0.95 }}
              className={`relative p-4 rounded-2xl border-2 text-left transition-colors ${
                isSelected
                  ? "border-red-500 bg-red-500/10"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </span>
              )}
              <div className="text-3xl mb-2 leading-none">{getAvatar(player.order)}</div>
              <div className="font-bold text-sm text-[var(--text)] truncate">{player.name}</div>
            </motion.button>
          );
        })}
      </div>

      {/* Sticky confirm bar — single tap to confirm */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 p-4 z-50"
          >
            <div className="max-w-md mx-auto">
              <button
                onClick={handleEliminate}
                className="w-full h-16 rounded-2xl bg-red-600 text-white font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-red-500/40 active:scale-95 transition-transform"
              >
                <span className="text-2xl">{getAvatar(selectedPlayer.order)}</span>
                Éliminer {selectedPlayer.name}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
