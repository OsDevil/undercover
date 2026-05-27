"use client";

import { ArrowRight, ChevronDown, ChevronLeft, Minus, Pencil, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { suggestRoleCounts } from "@/lib/roleAssigner";
import type { Difficulty, GameConfig, SpecialRole } from "@/lib/types";
import { getRandomPair } from "@/lib/words";
import { useGameStore } from "@/store/gameStore";

const SPECIAL_ROLE_INFO: Record<
  SpecialRole,
  { label: string; description: string; color: string }
> = {
  jester: {
    label: "Jester",
    description: "Doit se faire éliminer au Tour 1. Sinon son rôle de base s'applique.",
    color: "#f59e0b",
  },
  chameleon: {
    label: "Caméléon",
    description: "Voit les deux mots sans savoir lequel est Civil. Toujours un Civil.",
    color: "#10b981",
  },
  vengeuse: {
    label: "Vengeuse",
    description: "Si éliminée, peut emporter quelqu'un avec elle.",
    color: "#ec4899",
  },
  amoureux: {
    label: "Amoureux",
    description: "Deux joueurs liés. Si l'un meurt, l'autre aussi. Peuvent être ennemis.",
    color: "#f97316",
  },
};

function Counter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
      <span className="font-medium text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-lg bg-[var(--surface2)] flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-6 text-center font-bold text-lg">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-lg bg-[var(--surface2)] flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function ConfigPage() {
  const router = useRouter();
  const { players, config, setConfig, startGame } = useGameStore();
  const playerCount = players.length;

  const suggested = suggestRoleCounts(playerCount);

  const [civilCount, setCivilCount] = useState(
    config.civilWord ? config.civilCount : suggested.civilCount
  );
  const [undercoverCount, setUndercoverCount] = useState(
    config.civilWord ? config.undercoverCount : suggested.undercoverCount
  );
  const [mrWhiteCount, setMrWhiteCount] = useState(
    config.civilWord ? config.mrWhiteCount : suggested.mrWhiteCount
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    config.difficulty !== "custom" ? (config.difficulty as Difficulty) : "easy"
  );
  const [customMode, setCustomMode] = useState(config.difficulty === "custom");
  const [civilWord, setCivilWord] = useState(config.civilWord || "");
  const [undercoverWord, setUndercoverWord] = useState(config.undercoverWord || "");
  const [specialRoles, setSpecialRoles] = useState<Partial<Record<SpecialRole, boolean>>>(
    config.specialRoles || {}
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [wordPreview, setWordPreview] = useState<{ civil: string; undercover: string } | null>(
    config.civilWord && config.difficulty !== "custom"
      ? { civil: config.civilWord, undercover: config.undercoverWord }
      : null
  );

  const total = civilCount + undercoverCount + mrWhiteCount;
  const totalError = total !== playerCount;

  // Auto-adjust to keep total = playerCount when changing roles
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only reacts to count changes
  useEffect(() => {
    if (total > playerCount) {
      const diff = total - playerCount;
      if (civilCount > 1) setCivilCount((v) => Math.max(1, v - diff));
    }
  }, [civilCount, undercoverCount, mrWhiteCount, playerCount, total]);

  function rollWords() {
    const pair = getRandomPair(difficulty);
    setCivilWord(pair.civil);
    setUndercoverWord(pair.undercover);
    setWordPreview({ civil: pair.civil, undercover: pair.undercover });
  }

  function toggleSpecial(role: SpecialRole) {
    setSpecialRoles((prev) => ({ ...prev, [role]: !prev[role] }));
  }

  function handleStart() {
    const finalCivilWord = customMode ? civilWord.trim() : (wordPreview?.civil ?? "");
    const finalUndercoverWord = customMode
      ? undercoverWord.trim()
      : (wordPreview?.undercover ?? "");

    const cfg: GameConfig = {
      civilCount,
      undercoverCount,
      mrWhiteCount,
      specialRoles,
      difficulty: customMode ? "custom" : difficulty,
      civilWord: finalCivilWord,
      undercoverWord: finalUndercoverWord,
    };
    setConfig(cfg);
    startGame();
    router.push("/reveal");
  }

  const wordsReady = customMode
    ? civilWord.trim().length > 0 && undercoverWord.trim().length > 0
    : wordPreview !== null;

  const canStart = !totalError && wordsReady;

  const diffOptions: { value: Difficulty; label: string; sublabel: string }[] = [
    { value: "easy", label: "Facile", sublabel: "Mots clairement distincts" },
    { value: "medium", label: "Moyen", sublabel: "Similaires sémantiquement" },
    { value: "hard", label: "Difficile", sublabel: "Très proches ou subtils" },
  ];

  return (
    <main className="flex flex-col min-h-dvh px-4 py-6 max-w-md mx-auto gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/lobby")}
          className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Configuration</h1>
          <p className="text-xs text-[var(--text-muted)]">{playerCount} joueurs</p>
        </div>
      </div>

      {/* Role counts */}
      <section>
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Répartition des rôles
        </h2>
        <div className="flex flex-col gap-2">
          <Counter
            label="🔵 Civils"
            value={civilCount}
            min={1}
            max={playerCount - undercoverCount - mrWhiteCount}
            onChange={setCivilCount}
          />
          <Counter
            label="🔴 Undercovers"
            value={undercoverCount}
            min={1}
            max={playerCount - civilCount - mrWhiteCount}
            onChange={setUndercoverCount}
          />
          <Counter
            label="⚪ Mr. White"
            value={mrWhiteCount}
            min={0}
            max={playerCount - civilCount - undercoverCount}
            onChange={setMrWhiteCount}
          />
        </div>
        <div
          className={`mt-2 text-sm text-center font-medium transition-colors ${totalError ? "text-red-400" : "text-green-400"}`}
        >
          Total : {total} / {playerCount}
          {totalError && " — Doit être égal au nombre de joueurs"}
        </div>
      </section>

      {/* Words */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Mots
          </h2>
          <button
            onClick={() => {
              setCustomMode((v) => !v);
              setCivilWord("");
              setUndercoverWord("");
              setWordPreview(null);
            }}
            className="flex items-center gap-1 text-xs text-[var(--accent)] font-medium"
          >
            <Pencil className="w-3 h-3" />
            {customMode ? "Mode aléatoire" : "Mots personnalisés"}
          </button>
        </div>

        {customMode ? (
          <div className="flex flex-col gap-2">
            <input
              value={civilWord}
              onChange={(e) => setCivilWord(e.target.value)}
              placeholder="Mot des Civils"
              className="h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--civil)] transition-colors"
            />
            <input
              value={undercoverWord}
              onChange={(e) => setUndercoverWord(e.target.value)}
              placeholder="Mot des Undercovers"
              className="h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--undercover)] transition-colors"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              {diffOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setDifficulty(opt.value);
                    setWordPreview(null);
                    setCivilWord("");
                    setUndercoverWord("");
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    difficulty === opt.value
                      ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={rollWords}
              className="h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-2 font-medium text-sm active:scale-95 transition-all hover:border-[var(--accent)]"
            >
              <RefreshCw className="w-4 h-4" />
              Tirer des mots au sort
            </button>
            {wordPreview && (
              <div className="flex gap-2">
                <div className="flex-1 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                  <p className="text-xs text-blue-400 mb-1">Civil</p>
                  <p className="font-bold text-blue-200">{wordPreview.civil}</p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                  <p className="text-xs text-red-400 mb-1">Undercover</p>
                  <p className="font-bold text-red-200">{wordPreview.undercover}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Advanced: special roles */}
      <section>
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1"
        >
          <span>Rôles spéciaux</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
        </button>
        {showAdvanced && (
          <div className="flex flex-col gap-2 mt-3">
            {(Object.keys(SPECIAL_ROLE_INFO) as SpecialRole[]).map((role) => {
              const info = SPECIAL_ROLE_INFO[role];
              const active = !!specialRoles[role];
              return (
                <button
                  key={role}
                  onClick={() => toggleSpecial(role)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    active
                      ? "border-[var(--accent)] bg-violet-500/10"
                      : "border-[var(--border)] bg-[var(--surface)]"
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                    style={{ backgroundColor: info.color }}
                  />
                  <div>
                    <p className="font-semibold text-sm">{info.label}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{info.description}</p>
                  </div>
                  <div
                    className={`ml-auto w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                      active
                        ? "bg-[var(--accent)] border-[var(--accent)]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {active && <span className="text-white text-xs">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-auto">
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-violet-900/30"
        >
          Lancer la partie
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </main>
  );
}
