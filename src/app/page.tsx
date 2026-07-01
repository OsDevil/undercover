"use client";

import { Eye, Play, RefreshCw, Search, Shield, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useGameStore } from "@/store/gameStore";

const HOW_TO_PLAY = [
  { icon: Users, emoji: "1", text: "Chacun regarde sa carte secrètement" },
  { icon: Search, emoji: "2", text: "Décrivez votre mot sans le révéler" },
  { icon: Zap, emoji: "3", text: "Votez pour éliminer l'imposteur" },
];

const PHASE_ROUTES: Record<string, string> = {
  lobby: "/lobby",
  config: "/lobby",
  reveal: "/reveal",
  playing: "/game",
  voting: "/game",
  mr_white_guess: "/game",
  vengeance: "/game",
};

export default function Home() {
  const router = useRouter();
  const { phase, players, reset } = useGameStore();
  const hasActiveGame = phase !== "result" && players.length > 0;

  return (
    <main className="flex flex-col min-h-dvh px-5">
      <div className="flex justify-end pt-4 pb-2">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 py-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-violet-500/30 blur-2xl scale-110" />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-800 flex items-center justify-center shadow-2xl shadow-violet-500/30 -rotate-3">
              <Eye className="w-12 h-12 text-white" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tight text-[var(--text)]">Undercover</h1>
            <p className="text-[var(--text-muted)] mt-2 text-sm leading-relaxed max-w-xs">
              Qui cache quelque chose parmi vous&nbsp;?
              <br />
              Un seul téléphone, des dizaines de suspicions.
            </p>
          </div>
        </div>

        {/* How to play */}
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {HOW_TO_PLAY.map(({ icon: Icon, emoji, text }) => (
            <div
              key={emoji}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-muted)]"
            >
              <div className="w-7 h-7 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-[var(--accent)]" />
              </div>
              <span className="flex-1">{text}</span>
              <span className="text-xs font-black text-[var(--accent)] opacity-50">{emoji}</span>
            </div>
          ))}
        </div>

        {/* Role hints */}
        <div className="flex gap-2 w-full max-w-xs">
          <div className="flex-1 py-2.5 px-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <p className="text-xs font-bold text-blue-500">Civil</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Trouve l&apos;imposteur</p>
          </div>
          <div className="flex-1 py-2.5 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-xs font-bold text-red-500">Undercover</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Reste incognito</p>
          </div>
          <div className="flex-1 py-2.5 px-3 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
            <Shield className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
            <p className="text-xs font-bold text-slate-500">Mr. White</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Aucun mot</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => {
              reset();
              router.push("/lobby");
            }}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black text-lg flex items-center justify-center gap-2.5 active:scale-95 transition-transform shadow-xl shadow-violet-500/30"
          >
            <Play className="w-6 h-6" />
            Nouvelle partie
          </button>

          {hasActiveGame && (
            <button
              onClick={() => router.push(PHASE_ROUTES[phase] ?? "/lobby")}
              className="w-full h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              {phase === "lobby" ? "Reprendre le setup en cours" : "Reprendre la partie en cours"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
