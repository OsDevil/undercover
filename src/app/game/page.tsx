"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Heart,
  Home,
  MessageCircle,
  Mic,
  Skull,
  Vote,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MrWhiteGuess } from "@/components/MrWhiteGuess";
import { VengeanceModal } from "@/components/VengeanceModal";
import { VoteGrid } from "@/components/VoteGrid";
import { getAvatar } from "@/lib/gameLogic";
import { useGameStore } from "@/store/gameStore";

const ROLE_COLOR: Record<string, string> = {
  civil: "#3b82f6",
  undercover: "#ef4444",
  mr_white: "#94a3b8",
};

const ROLE_LABEL: Record<string, string> = {
  civil: "Civil",
  undercover: "Undercover",
  mr_white: "Mr. White",
};

export default function GamePage() {
  const router = useRouter();
  const {
    players,
    phase,
    round,
    config,
    eliminatedLog,
    pendingVengeanceId,
    pendingMrWhiteId,
    firstSpeakerId,
    setPhase,
    eliminatePlayer,
    resolveVengeance,
    resolveMrWhiteGuess,
  } = useGameStore();

  useEffect(() => {
    if (phase === "result") router.replace("/result");
    if (phase === "lobby" || phase === "config" || phase === "reveal") router.replace("/");
  }, [phase, router]);

  // Timer
  const [speakerIdx, setSpeakerIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timerDuration ?? 30);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only reacts to round
  useEffect(() => {
    setSpeakerIdx(0);
    setTimeLeft(config.timerDuration ?? 30);
  }, [round]);

  // Amoureux cascade drama detection
  const [amoureuxDrama, setAmoureuxDrama] = useState<{ name1: string; name2: string } | null>(null);
  const prevLogLenRef = useRef(eliminatedLog.length);

  useEffect(() => {
    const prev = prevLogLenRef.current;
    const curr = eliminatedLog.length;
    prevLogLenRef.current = curr;

    if (curr === prev + 2) {
      const last2 = eliminatedLog.slice(-2);
      if (
        last2[0]?.specialRole === "amoureux" &&
        last2[1]?.specialRole === "amoureux" &&
        last2[0].round === last2[1].round
      ) {
        setAmoureuxDrama({ name1: last2[0].playerName, name2: last2[1].playerName });
      }
    }
  }, [eliminatedLog]);

  const alivePlayers = [...players].filter((p) => p.alive).sort((a, b) => a.order - b.order);
  const firstSpeakerIdx = alivePlayers.findIndex((p) => p.id === firstSpeakerId);
  const speakingOrder =
    firstSpeakerIdx > 0
      ? [...alivePlayers.slice(firstSpeakerIdx), ...alivePlayers.slice(0, firstSpeakerIdx)]
      : alivePlayers;
  const eliminatedThisGame = [...eliminatedLog].sort((a, b) => a.round - b.round);
  const allSpoke = speakerIdx >= speakingOrder.length;
  const currentSpeaker = speakingOrder[speakerIdx];
  const firstSpeaker = players.find((p) => p.id === firstSpeakerId);

  function handleNextSpeaker() {
    setSpeakerIdx((i) => i + 1);
    setTimeLeft(config.timerDuration ?? 30);
  }

  // Countdown
  useEffect(() => {
    if (!config.timerEnabled || phase !== "playing" || allSpoke) return;
    if (timeLeft <= 0) {
      setSpeakerIdx((i) => i + 1);
      setTimeLeft(config.timerDuration ?? 30);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [config.timerEnabled, config.timerDuration, phase, allSpoke, timeLeft]);

  // ── Amoureux drama overlay ─────────────────────────────────────────────────
  if (amoureuxDrama) {
    return (
      <main className="flex flex-col min-h-dvh items-center justify-center bg-[var(--bg)] px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-sm w-full flex flex-col items-center gap-6 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: 2, duration: 0.6 }}
            className="w-24 h-24 rounded-full bg-orange-500/15 border-2 border-orange-500/40 flex items-center justify-center"
          >
            <Heart className="w-12 h-12 text-orange-500" />
          </motion.div>
          <div>
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">
              Cascade Amoureuse
            </p>
            <h2 className="text-2xl font-black text-[var(--text)]">
              {amoureuxDrama.name1} & {amoureuxDrama.name2}
            </h2>
            <p className="text-[var(--text-muted)] mt-3 leading-relaxed">
              Les deux Amoureux étaient liés. L'un est mort... l'autre ne pouvait pas rester seul.
            </p>
            <p className="text-orange-500 font-semibold mt-1">Ils partent ensemble. 💔</p>
          </div>
          <button
            onClick={() => setAmoureuxDrama(null)}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold active:scale-95 transition-transform shadow-lg shadow-orange-500/25"
          >
            Continuer
          </button>
        </motion.div>
      </main>
    );
  }

  // ── First speaker announcement (every round) ──────────────────────────────
  if (phase === "first_speaker" && firstSpeaker) {
    return (
      <main className="flex flex-col min-h-dvh bg-[var(--bg)] items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 200 }}
          className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-violet-500/15 border-2 border-violet-500/30 flex items-center justify-center">
            <Mic className="w-9 h-9 text-violet-500" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)] uppercase tracking-widest font-bold mb-2">
              Tour {round} — Premier à parler
            </p>
            <p className="text-5xl mb-3">{getAvatar(firstSpeaker.order)}</p>
            <h1 className="text-3xl font-black text-[var(--text)]">{firstSpeaker.name}</h1>
          </div>
          <button
            onClick={() => setPhase("playing")}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-violet-500/25 mt-2"
          >
            C&apos;est parti !
          </button>
        </motion.div>
      </main>
    );
  }

  // ── Mr. White guess ────────────────────────────────────────────────────────
  if (phase === "mr_white_guess" && pendingMrWhiteId) {
    const mrWhite = players.find((p) => p.id === pendingMrWhiteId);
    if (mrWhite) {
      return (
        <main className="flex flex-col min-h-dvh items-center justify-center bg-[var(--bg)]">
          <MrWhiteGuess
            mrWhiteName={mrWhite.name}
            civilWord={config.civilWord}
            onResult={resolveMrWhiteGuess}
          />
        </main>
      );
    }
  }

  // ── Vengeance ──────────────────────────────────────────────────────────────
  if (phase === "vengeance" && pendingVengeanceId) {
    const vengeuse = players.find((p) => p.id === pendingVengeanceId);
    if (vengeuse) {
      return (
        <main className="flex flex-col min-h-dvh items-center justify-center bg-[var(--bg)]">
          <VengeanceModal
            vengeuseName={vengeuse.name}
            candidates={alivePlayers}
            onResolve={resolveVengeance}
          />
        </main>
      );
    }
  }

  return (
    <main className="flex flex-col min-h-dvh max-w-md mx-auto bg-[var(--bg)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-sm font-black">
            Tour {round}
          </div>
          <span className="text-sm text-[var(--text-muted)] font-medium">
            {alivePlayers.length} vivant{alivePlayers.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={() => router.push("/")}
          className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-4 pb-6 gap-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-4"
            >
              {/* Timer panel */}
              {config.timerEnabled && (
                <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4">
                  {allSpoke ? (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <p className="text-sm font-bold text-emerald-600">
                        Tout le monde a parlé — passez au vote&nbsp;!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-[var(--text-muted)] font-medium">
                            À la parole
                          </p>
                          <p className="font-black text-xl text-[var(--text)]">
                            {currentSpeaker?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-4xl font-black tabular-nums leading-none ${timeLeft <= 5 ? "text-red-500" : "text-[var(--accent)]"}`}
                          >
                            {timeLeft}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">secondes</p>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--surface2)] rounded-full mb-3">
                        <div
                          className="h-1.5 rounded-full transition-all duration-1000"
                          style={{
                            width: `${(timeLeft / (config.timerDuration ?? 30)) * 100}%`,
                            background: timeLeft <= 5 ? "#ef4444" : "var(--accent)",
                          }}
                        />
                      </div>
                      <button
                        onClick={handleNextSpeaker}
                        className="w-full h-10 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-sm font-bold text-[var(--text)] flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        Joueur suivant <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Alive players */}
              <section>
                <div className="flex items-center gap-1.5 mb-3">
                  <MessageCircle className="w-4 h-4 text-[var(--text-muted)]" />
                  <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Discussion
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {alivePlayers.map((p) => {
                    const isSpeaker =
                      config.timerEnabled && !allSpoke && p.id === currentSpeaker?.id;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all ${
                          isSpeaker
                            ? "border-[var(--accent)]/50 bg-[var(--accent)]/8"
                            : "border-[var(--border)] bg-[var(--surface)]"
                        }`}
                      >
                        <span className="text-xl leading-none">{getAvatar(p.order)}</span>
                        <span className="font-semibold text-sm flex-1 text-[var(--text)] truncate">
                          {p.name}
                        </span>
                        {isSpeaker && (
                          <span className="text-xs font-black text-[var(--accent)]">→</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Eliminated */}
              {eliminatedThisGame.length > 0 && (
                <section>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Skull className="w-4 h-4 text-[var(--text-muted)]" />
                    <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      Éliminés
                    </h2>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {eliminatedThisGame.map((e) => (
                      <div
                        key={`${e.playerId}-${e.round}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] opacity-50"
                      >
                        <span className="text-base">
                          {getAvatar(players.find((p) => p.id === e.playerId)?.order ?? 0)}
                        </span>
                        <span className="text-sm flex-1 line-through text-[var(--text)]">
                          {e.playerName}
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: ROLE_COLOR[e.role] ?? "#888" }}
                        >
                          {ROLE_LABEL[e.role] ?? e.role}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">T{e.round}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Vote button */}
              {(!config.timerEnabled || allSpoke) && (
                <button
                  onClick={() => setPhase("voting")}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-500/20"
                >
                  <Vote className="w-5 h-5" />
                  Voter pour éliminer
                </button>
              )}
            </motion.div>
          )}

          {phase === "voting" && (
            <motion.div
              key="voting"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-black text-xl text-[var(--text)]">
                    Qui est le traître&nbsp;?
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Appuie sur un joueur puis confirme
                  </p>
                </div>
                <button
                  onClick={() => setPhase("playing")}
                  className="text-xs text-[var(--text-muted)] underline underline-offset-2"
                >
                  Annuler
                </button>
              </div>
              <VoteGrid players={players} onEliminate={eliminatePlayer} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
