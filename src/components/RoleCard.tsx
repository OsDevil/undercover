"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, HelpCircle, ShieldQuestion, X } from "lucide-react";
import { useState } from "react";
import { getAvatar, getWordDisplay } from "@/lib/gameLogic";
import type { Player } from "@/lib/types";

const SPECIAL_LABEL: Record<string, string> = {
  jester: "Jester",
  chameleon: "Caméléon",
  vengeuse: "Vengeuse",
  amoureux: "Amoureux·se",
};

const SPECIAL_COLOR: Record<string, string> = {
  jester: "#f59e0b",
  chameleon: "#10b981",
  vengeuse: "#ec4899",
  amoureux: "#f97316",
};

const SPECIAL_RULES: Record<string, string> = {
  jester:
    "Ton but : te faire éliminer au Tour 1. Si tu y arrives, tu gagnes ! Si tu survives au Tour 1, tu perds.",
  chameleon:
    "Tu vois les deux mots (civil et undercover) mais tu ne sais pas lequel est le tien. Tente de deviner en observant les autres.",
  vengeuse:
    "Si tu es éliminé·e par le vote, tu peux emporter un joueur encore en vie avec toi dans la mort.",
  amoureux:
    "Tu es lié·e à ton partenaire amoureux. Si l'un de vous deux meurt (vote ou cascade), l'autre meurt aussi.",
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
  const [showRules, setShowRules] = useState(false);
  const wordDisplay = getWordDisplay(player);
  const isMrWhite = player.role === "mr_white";
  const isChameleon = player.specialRole === "chameleon";

  const cardBg = isMrWhite
    ? "from-slate-700/70 to-slate-900/90"
    : "from-violet-900/60 to-purple-950/80";
  const cardBorder = isMrWhite ? "border-slate-500/30" : "border-violet-500/20";

  return (
    <div className="flex flex-col items-center justify-between h-full w-full max-w-sm mx-auto py-6 px-4 gap-6">
      {/* Player name */}
      <div className="text-center">
        <div className="text-4xl mb-1">{getAvatar(player.order)}</div>
        <h2 className="text-2xl font-black mt-1 text-[var(--text)]">{player.name}</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">Mémorise bien ton rôle</p>
      </div>

      {/* Card */}
      <div
        className="relative w-full aspect-[3/4] max-w-[240px]"
        style={{ cursor: !revealed ? "pointer" : "default" }}
        onClick={() => !revealed && setRevealed(true)}
      >
        {/* Back face */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-800/60 to-purple-950/80 border border-violet-500/30 flex flex-col items-center justify-center gap-3 shadow-2xl"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: revealed ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Eye className="w-8 h-8 text-violet-300" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-violet-300 font-semibold">Appuie pour révéler</p>
        </motion.div>

        {/* Front face */}
        <motion.div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cardBg} border ${cardBorder} flex flex-col items-center justify-center gap-4 shadow-2xl p-6`}
          initial={{ rotateY: -90 }}
          animate={{ rotateY: revealed ? 0 : -90 }}
          transition={{ duration: 0.2, delay: revealed ? 0.15 : 0 }}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Special role badge + help button */}
          {player.specialRole && (
            <div className="flex items-center gap-2">
              <div
                className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border"
                style={{
                  color: SPECIAL_COLOR[player.specialRole] ?? "#fff",
                  background: `${SPECIAL_COLOR[player.specialRole] ?? "#fff"}20`,
                  borderColor: `${SPECIAL_COLOR[player.specialRole] ?? "#fff"}40`,
                }}
              >
                {SPECIAL_LABEL[player.specialRole] ?? player.specialRole}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRules((v) => !v);
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: SPECIAL_COLOR[player.specialRole] ?? "#fff" }}
              >
                {showRules ? <X className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Rule explanation */}
          <AnimatePresence>
            {showRules && player.specialRole && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full px-3 py-2 rounded-xl text-center overflow-hidden"
                style={{
                  background: `${SPECIAL_COLOR[player.specialRole] ?? "#fff"}15`,
                  border: `1px solid ${SPECIAL_COLOR[player.specialRole] ?? "#fff"}30`,
                }}
              >
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: SPECIAL_COLOR[player.specialRole] ?? "#fff" }}
                >
                  {SPECIAL_RULES[player.specialRole]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          {isMrWhite ? (
            <div className="flex flex-col items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full text-slate-300 bg-slate-400/20">
                MR. WHITE
              </span>
              <ShieldQuestion className="w-12 h-12 text-slate-400" strokeWidth={1.5} />
              <p className="text-slate-300 text-sm font-semibold text-center">
                Tu n&apos;as pas de mot
              </p>
              <p className="text-slate-500 text-xs text-center leading-relaxed">
                Fais semblant de savoir — si tu es éliminé tu pourras deviner
              </p>
            </div>
          ) : isChameleon ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                L&apos;un de ces mots est le tien :
              </p>
              <p className="text-2xl font-black text-white text-center leading-tight">
                {wordDisplay.primary}
              </p>
              <p className="text-slate-500 text-sm">ou</p>
              <p className="text-2xl font-black text-white text-center leading-tight">
                {wordDisplay.secondary}
              </p>
            </div>
          ) : (
            <p className="text-4xl font-black text-white text-center leading-tight">
              {wordDisplay.primary}
            </p>
          )}

          {/* Lover info */}
          {player.specialRole === "amoureux" && loverName && (
            <div className="px-3 py-2 rounded-xl bg-orange-500/15 border border-orange-500/25 text-center">
              <p className="text-xs text-orange-400">Ton Amoureux·se&nbsp;:</p>
              <p className="font-black text-orange-300 text-sm mt-0.5">{loverName}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Done button */}
      {revealed ? (
        <button
          onClick={onDone}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-violet-500/25"
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
