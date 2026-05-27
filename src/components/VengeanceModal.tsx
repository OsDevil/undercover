"use client";

import { Flame } from "lucide-react";
import { useState } from "react";
import type { Player } from "@/lib/types";

export function VengeanceModal({
  vengeuseName,
  candidates,
  onResolve,
}: {
  vengeuseName: string;
  candidates: Player[];
  onResolve: (targetId: string | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-sm mx-auto w-full">
      <div className="w-20 h-20 rounded-full bg-pink-900/30 border border-pink-500/30 flex items-center justify-center">
        <Flame className="w-10 h-10 text-pink-400" strokeWidth={1.5} />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-black">{vengeuseName}</h2>
        <p className="text-sm text-pink-300 mt-1 font-medium">La Vengeuse</p>
        <p className="text-sm text-[var(--text-muted)] mt-3 leading-relaxed">
          Tu as été éliminé·e. Tu peux emporter quelqu&apos;un avec toi.
        </p>
      </div>

      <div className="w-full flex flex-col gap-2">
        {candidates.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id === selected ? null : p.id)}
            className={`p-4 rounded-xl border text-left transition-all active:scale-95 ${
              selected === p.id
                ? "border-pink-500/60 bg-pink-500/10"
                : "border-[var(--border)] bg-[var(--surface)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[var(--surface2)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                {p.order + 1}
              </span>
              <span className="font-medium">{p.name}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="w-full flex flex-col gap-2">
        <button
          onClick={() => selected && onResolve(selected)}
          disabled={!selected}
          className="w-full h-14 rounded-2xl bg-pink-700 text-white font-bold disabled:opacity-40 active:scale-95 transition-all"
        >
          Emporter {selected ? candidates.find((p) => p.id === selected)?.name : "…"}
        </button>
        <button
          onClick={() => onResolve(null)}
          className="w-full h-12 rounded-2xl border border-[var(--border)] text-[var(--text-muted)] text-sm font-medium active:scale-95 transition-all"
        >
          Partir seul·e
        </button>
      </div>
    </div>
  );
}
