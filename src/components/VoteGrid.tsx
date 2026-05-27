"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { Player } from "@/lib/types";

export function VoteGrid({
  players,
  onEliminate,
}: {
  players: Player[];
  onEliminate: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const alivePlayers = [...players].filter((p) => p.alive).sort((a, b) => a.order - b.order);

  function handleSelect(id: string) {
    if (selected === id) {
      setConfirming(true);
    } else {
      setSelected(id);
      setConfirming(false);
    }
  }

  function handleConfirm() {
    if (selected) {
      onEliminate(selected);
      setSelected(null);
      setConfirming(false);
    }
  }

  const selectedPlayer = alivePlayers.find((p) => p.id === selected);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[var(--text-muted)] text-center">
        Appuie une fois pour sélectionner, une deuxième fois pour confirmer l&apos;élimination
      </p>

      <div className="grid grid-cols-2 gap-2">
        {alivePlayers.map((player) => (
          <button
            key={player.id}
            onClick={() => handleSelect(player.id)}
            className={`p-4 rounded-xl border text-left transition-all active:scale-95 ${
              selected === player.id
                ? "border-red-500/60 bg-red-500/10"
                : "border-[var(--border)] bg-[var(--surface)]"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--surface2)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                {player.order + 1}
              </div>
              <span className="font-medium text-sm truncate">{player.name}</span>
            </div>
            {selected === player.id && (
              <div className="mt-2 flex items-center gap-1 text-red-400 text-xs font-medium">
                <X className="w-3 h-3" />
                Appuie encore pour éliminer
              </div>
            )}
          </button>
        ))}
      </div>

      {confirming && selectedPlayer && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 flex flex-col gap-4">
            <div className="text-center">
              <p className="text-[var(--text-muted)] text-sm">Éliminer</p>
              <p className="text-2xl font-black mt-1">{selectedPlayer.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirming(false);
                  setSelected(null);
                }}
                className="flex-1 h-12 rounded-xl border border-[var(--border)] font-medium text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 h-12 rounded-xl bg-red-600 text-white font-bold text-sm active:scale-95 transition-transform"
              >
                Éliminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
