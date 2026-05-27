"use client";

import { Eye, RefreshCw, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";

export default function Home() {
  const router = useRouter();
  const { phase, players, reset } = useGameStore();

  const hasActiveGame = phase !== "lobby" && phase !== "result" && players.length > 0;

  return (
    <main className="flex flex-col min-h-dvh items-center justify-center px-4 gap-12">
      {/* Logo / Title */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center shadow-2xl shadow-violet-900/50">
            <Eye className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-xl" />
        </div>
        <div>
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Undercover
          </h1>
          <p className="text-[var(--text-muted)] mt-1 text-sm">Qui cache quelque chose ?</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => {
            reset();
            router.push("/lobby");
          }}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-violet-900/40"
        >
          <Users className="w-5 h-5" />
          Nouvelle partie
        </button>

        {hasActiveGame && (
          <button
            onClick={() => {
              const routes: Record<string, string> = {
                config: "/config",
                reveal: "/reveal",
                playing: "/game",
                voting: "/game",
                mr_white_guess: "/game",
                vengeance: "/game",
              };
              router.push(routes[phase] ?? "/lobby");
            }}
            className="w-full h-14 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-white font-semibold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            Reprendre la partie
          </button>
        )}
      </div>

      {/* How to play hint */}
      <p className="text-xs text-[var(--text-muted)] text-center max-w-xs leading-relaxed">
        Un animateur, des joueurs réels autour d&apos;une table.
        <br />
        Chacun consulte sa carte secrètement sur ce téléphone.
      </p>
    </main>
  );
}
