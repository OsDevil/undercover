"use client";

import { Loader2, ShieldQuestion } from "lucide-react";
import { useState } from "react";
import { mrWhiteWins } from "@/lib/wordMatcher";

export function MrWhiteGuess({
  mrWhiteName,
  civilWord,
  onResult,
}: {
  mrWhiteName: string;
  civilWord: string;
  onResult: (won: boolean) => void;
}) {
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);

  function handleSubmit() {
    if (!guess.trim() || submitted) return;
    setSubmitted(true);
    const won = mrWhiteWins(guess.trim(), civilWord);
    setResult(won);
    setTimeout(() => onResult(won), 2200);
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-sm mx-auto w-full">
      <div className="w-20 h-20 rounded-full bg-slate-700/30 border border-slate-500/30 flex items-center justify-center">
        <ShieldQuestion className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-black">{mrWhiteName}</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">Mr. White — Dernière chance !</p>
        <p className="text-sm text-white mt-3 leading-relaxed">
          Tu as été éliminé. Si tu trouves le mot des Civils, tu remportes la partie.
        </p>
      </div>

      {!submitted ? (
        <div className="w-full flex flex-col gap-3">
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Ton mot…"
            className="w-full h-14 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-white text-lg text-center placeholder:text-[var(--text-muted)] focus:outline-none focus:border-slate-400 transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={!guess.trim()}
            className="w-full h-14 rounded-2xl bg-slate-600 hover:bg-slate-500 text-white font-bold text-base disabled:opacity-40 active:scale-95 transition-all"
          >
            Soumettre ma réponse
          </button>
        </div>
      ) : result === null ? (
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
      ) : (
        <div
          className={`w-full p-6 rounded-2xl text-center ${
            result
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-red-500/10 border border-red-500/30"
          }`}
        >
          <p className="text-4xl mb-2">{result ? "🎉" : "💀"}</p>
          <p className={`text-xl font-black ${result ? "text-green-300" : "text-red-300"}`}>
            {result ? "Bonne réponse !" : "Mauvaise réponse"}
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {result ? `${mrWhiteName} gagne la partie !` : `Le mot était : "${civilWord}"`}
          </p>
        </div>
      )}
    </div>
  );
}
