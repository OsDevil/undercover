"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldQuestion } from "lucide-react";
import { useState } from "react";
import { getWordDisplay } from "@/lib/gameLogic";
import type { Player } from "@/lib/types";

const ROLE_CONFIG = {
  civil: {
    label: "Civil",
    color: "#3b82f6",
    bg: "from-blue-900/60 to-blue-950/80",
    border: "border-blue-500/40",
  },
  undercover: {
    label: "Undercover",
    color: "#ef4444",
    bg: "from-red-900/60 to-red-950/80",
    border: "border-red-500/40",
  },
  mr_white: {
    label: "Mr. White",
    color: "#94a3b8",
    bg: "from-slate-700/60 to-slate-900/80",
    border: "border-slate-500/40",
  },
};

const SPECIAL_LABEL: Record<string, string> = {
  jester: "Jester",
  chameleon: "Caméléon",
  vengeuse: "Vengeuse",
  amoureux: "Amoureux·se",
};

export function RoleCard({
  player,
  loverName,
  onDone,
}: {
  player: Player;
  loverName?: string;
  onDone: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const role = ROLE_CONFIG[player.role];
  const wordDisplay = getWordDisplay(player);
  const isMrWhite = player.role === "mr_white";
  const isChameleon = player.specialRole === "chameleon";

  return (
    <div className="flex flex-col items-center justify-between h-full w-full max-w-sm mx-auto py-8 px-4 gap-6">
      {/* Player name */}
      <div className="text-center">
        <p className="text-[var(--text-muted)] text-sm">Joueur #{player.order + 1}</p>
        <h2 className="text-2xl font-black mt-1">{player.name}</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">Mémorise bien ton mot</p>
      </div>

      {/* Card */}
      <div
        className="relative w-full aspect-[3/4] max-w-[240px] cursor-pointer"
        onClick={() => !revealed && setRevealed(true)}
      >
        {/* Back face */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-800/40 to-purple-950/60 border border-violet-500/20 flex flex-col items-center justify-center gap-3 shadow-2xl"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: revealed ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Eye className="w-8 h-8 text-violet-300" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-violet-300 font-medium">Appuie pour révéler</p>
        </motion.div>

        {/* Front face */}
        <motion.div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${role.bg} border ${role.border} flex flex-col items-center justify-center gap-4 shadow-2xl p-6`}
          initial={{ rotateY: -90 }}
          animate={{ rotateY: revealed ? 0 : -90 }}
          transition={{ duration: 0.2, delay: revealed ? 0.15 : 0 }}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Role badge */}
          <div className="flex flex-col items-center gap-1">
            <span
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ color: role.color, background: `${role.color}22` }}
            >
              {role.label}
            </span>
            {player.specialRole && (
              <span className="text-xs text-[var(--text-muted)]">
                + {SPECIAL_LABEL[player.specialRole] ?? player.specialRole}
              </span>
            )}
          </div>

          {/* Word(s) */}
          {isMrWhite ? (
            <div className="flex flex-col items-center gap-1">
              <ShieldQuestion className="w-10 h-10 text-slate-400" strokeWidth={1.5} />
              <p className="text-slate-300 text-sm font-medium text-center">
                Tu n&apos;as pas de mot
              </p>
            </div>
          ) : isChameleon ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-[var(--text-muted)] text-center">
                L&apos;un de ces mots est le tien — à toi de deviner lequel :
              </p>
              <p className="text-2xl font-black text-center leading-tight">{wordDisplay.primary}</p>
              <p className="text-[var(--text-muted)] text-sm">ou</p>
              <p className="text-2xl font-black text-center leading-tight">
                {wordDisplay.secondary}
              </p>
            </div>
          ) : (
            <p
              className="text-3xl font-black text-center leading-tight"
              style={{ color: role.color }}
            >
              {wordDisplay.primary}
            </p>
          )}

          {/* Lover info */}
          {player.specialRole === "amoureux" && loverName && (
            <div className="mt-2 p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
              <p className="text-xs text-orange-300">Ton Amoureux·se :</p>
              <p className="font-bold text-orange-200 text-sm">{loverName}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Done button */}
      {revealed ? (
        <button
          onClick={onDone}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <EyeOff className="w-5 h-5" />
          J&apos;ai mémorisé, cacher
        </button>
      ) : (
        <div className="h-14" />
      )}
    </div>
  );
}
