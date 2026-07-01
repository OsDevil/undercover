"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  checkVictory,
  getLoverPartner,
  pickFirstSpeaker,
  shouldTriggerMrWhiteGuess,
} from "@/lib/gameLogic";
import { assignRoles } from "@/lib/roleAssigner";
import type { GameConfig, GameState, Player } from "@/lib/types";

interface GameStore extends GameState {
  // Lobby
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  reorderPlayers: (orderedIds: string[]) => void;

  // Config
  setConfig: (config: GameConfig) => void;

  // Game start
  startGame: () => void;

  // Reveal
  advanceReveal: () => void;

  // Game loop
  setPhase: (phase: GameState["phase"]) => void;
  eliminatePlayer: (playerId: string) => void;
  resolveVengeance: (targetId: string | null) => void;
  resolveMrWhiteGuess: (won: boolean) => void;

  // Reset
  reset: () => void;
  resetToLobby: () => void;
}

const DEFAULT_CONFIG: GameConfig = {
  civilCount: 3,
  undercoverCount: 1,
  mrWhiteCount: 0,
  specialRoles: {},
  difficulty: "easy",
  civilWord: "",
  undercoverWord: "",
  timerEnabled: false,
  timerDuration: 30,
  mrWhiteCanStart: false,
};

const INITIAL_STATE: GameState = {
  players: [],
  config: DEFAULT_CONFIG,
  phase: "lobby",
  round: 1,
  revealIndex: 0,
  eliminatedLog: [],
  pendingVengeanceId: null,
  pendingMrWhiteId: null,
  winners: null,
  firstSpeakerId: null,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addPlayer: (name) => {
        const { players } = get();
        const trimmed = name.trim();
        if (!trimmed || players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return;
        const newPlayer: Player = {
          id: crypto.randomUUID(),
          name: trimmed,
          order: players.length,
          role: "civil",
          specialRole: null,
          word: null,
          alive: true,
        };
        set({ players: [...players, newPlayer] });
      },

      removePlayer: (id) => {
        const { players } = get();
        const filtered = players.filter((p) => p.id !== id);
        const reordered = filtered.map((p, i) => ({ ...p, order: i }));
        set({ players: reordered });
      },

      reorderPlayers: (orderedIds) => {
        const { players } = get();
        const reordered = orderedIds
          .map((id, i) => {
            const p = players.find((pl) => pl.id === id);
            return p ? { ...p, order: i } : null;
          })
          .filter(Boolean) as Player[];
        set({ players: reordered });
      },

      setConfig: (config) => set({ config }),

      startGame: () => {
        const { players, config } = get();
        const assigned = assignRoles(players, config);
        set({
          players: assigned,
          phase: "reveal",
          round: 1,
          revealIndex: 0,
          eliminatedLog: [],
          winners: null,
          firstSpeakerId: pickFirstSpeaker(assigned, config),
          pendingVengeanceId: null,
          pendingMrWhiteId: null,
        });
      },

      advanceReveal: () => {
        const { revealIndex, players } = get();
        const sorted = [...players].sort((a, b) => a.order - b.order);
        if (revealIndex + 1 >= sorted.length) {
          set({ phase: "first_speaker" });
        } else {
          set({ revealIndex: revealIndex + 1 });
        }
      },

      setPhase: (phase) => set({ phase }),

      eliminatePlayer: (playerId) => {
        const { players, eliminatedLog, round, config } = get();
        const target = players.find((p) => p.id === playerId);
        if (!target) return;

        const entry = {
          round,
          playerId: target.id,
          playerName: target.name,
          role: target.role,
          specialRole: target.specialRole,
        };

        let updatedPlayers = players.map((p) => (p.id === playerId ? { ...p, alive: false } : p));

        const newLog = [...eliminatedLog, entry];

        // Amoureux cascade: if lover dies, partner dies too
        const loverPartner = getLoverPartner(updatedPlayers, playerId);
        if (loverPartner && loverPartner.alive) {
          updatedPlayers = updatedPlayers.map((p) =>
            p.id === loverPartner.id ? { ...p, alive: false } : p
          );
          newLog.push({
            round,
            playerId: loverPartner.id,
            playerName: loverPartner.name,
            role: loverPartner.role,
            specialRole: loverPartner.specialRole,
          });
        }

        // Jester check first (round 1)
        if (round === 1 && target.specialRole === "jester") {
          set({
            players: updatedPlayers,
            eliminatedLog: newLog,
            winners: {
              team: "jester",
              winnerIds: [playerId],
              reason: `${target.name} était le Jester et a été éliminé au Tour 1 !`,
            },
            phase: "result",
          });
          return;
        }

        // Vengeuse fires first (even for mr_white who is also vengeuse)
        if (target.specialRole === "vengeuse") {
          set({
            players: updatedPlayers,
            eliminatedLog: newLog,
            pendingVengeanceId: playerId,
            phase: "vengeance",
          });
          return;
        }

        // Mr. White voted out → always get a guess before any victory check
        if (target.role === "mr_white") {
          set({
            players: updatedPlayers,
            eliminatedLog: newLog,
            pendingMrWhiteId: playerId,
            phase: "mr_white_guess",
          });
          return;
        }

        // Surviving Mr. White scenario (alive after others were eliminated)
        const mrWhiteId = shouldTriggerMrWhiteGuess(updatedPlayers);
        const victory = checkVictory(updatedPlayers, newLog, round);

        if (mrWhiteId && !victory) {
          set({
            players: updatedPlayers,
            eliminatedLog: newLog,
            pendingMrWhiteId: mrWhiteId,
            phase: "mr_white_guess",
          });
          return;
        }

        if (victory) {
          set({
            players: updatedPlayers,
            eliminatedLog: newLog,
            winners: victory,
            phase: "result",
          });
          return;
        }

        set({
          players: updatedPlayers,
          eliminatedLog: newLog,
          pendingVengeanceId: null,
          pendingMrWhiteId: null,
          phase: "first_speaker",
          round: round + 1,
          firstSpeakerId: pickFirstSpeaker(updatedPlayers, config),
        });
      },

      resolveVengeance: (targetId) => {
        const { players, eliminatedLog, round, config } = get();
        let updatedPlayers = players;
        let newLog = eliminatedLog;

        if (targetId) {
          const target = players.find((p) => p.id === targetId);
          if (target) {
            updatedPlayers = players.map((p) => (p.id === targetId ? { ...p, alive: false } : p));
            newLog = [
              ...eliminatedLog,
              {
                round,
                playerId: target.id,
                playerName: target.name,
                role: target.role,
                specialRole: target.specialRole,
              },
            ];

            // Amoureux cascade for vengeance target
            const loverPartner = getLoverPartner(updatedPlayers, targetId);
            if (loverPartner && loverPartner.alive) {
              updatedPlayers = updatedPlayers.map((p) =>
                p.id === loverPartner.id ? { ...p, alive: false } : p
              );
              newLog.push({
                round,
                playerId: loverPartner.id,
                playerName: loverPartner.name,
                role: loverPartner.role,
                specialRole: loverPartner.specialRole,
              });
            }

            // Mr. White killed by vengeance gets to guess before any victory check
            if (target.role === "mr_white") {
              set({
                players: updatedPlayers,
                eliminatedLog: newLog,
                pendingVengeanceId: null,
                pendingMrWhiteId: targetId,
                phase: "mr_white_guess",
              });
              return;
            }
          }
        }

        const mrWhiteId = shouldTriggerMrWhiteGuess(updatedPlayers);
        const victory = checkVictory(updatedPlayers, newLog, round);

        if (mrWhiteId && !victory) {
          set({
            players: updatedPlayers,
            eliminatedLog: newLog,
            pendingVengeanceId: null,
            pendingMrWhiteId: mrWhiteId,
            phase: "mr_white_guess",
          });
          return;
        }

        if (victory) {
          set({
            players: updatedPlayers,
            eliminatedLog: newLog,
            pendingVengeanceId: null,
            winners: victory,
            phase: "result",
          });
          return;
        }

        set({
          players: updatedPlayers,
          eliminatedLog: newLog,
          pendingVengeanceId: null,
          phase: "first_speaker",
          round: round + 1,
          firstSpeakerId: pickFirstSpeaker(updatedPlayers, config),
        });
      },

      resolveMrWhiteGuess: (won) => {
        const { players, eliminatedLog, round, pendingMrWhiteId, config } = get();
        const mrWhite = players.find((p) => p.id === pendingMrWhiteId);

        if (won && mrWhite) {
          set({
            winners: {
              team: "mr_white",
              winnerIds: [mrWhite.id],
              reason: `${mrWhite.name} (Mr. White) a trouvé le bon mot et remporte la partie !`,
            },
            phase: "result",
            pendingMrWhiteId: null,
          });
          return;
        }

        // Mr. White lost — check actual victory state (undercovers may still be alive)
        const victory = checkVictory(players, eliminatedLog, round);
        if (victory) {
          set({ winners: victory, phase: "result", pendingMrWhiteId: null });
          return;
        }

        // No victory yet — game continues without Mr. White
        set({
          pendingMrWhiteId: null,
          phase: "first_speaker",
          round: round + 1,
          firstSpeakerId: pickFirstSpeaker(players, config),
        });
      },

      reset: () => set(INITIAL_STATE),

      resetToLobby: () => {
        const { players, config } = get();
        // Custom words were typed in by hand — the organizer already knows them, so
        // keep them. Rolled words stay hidden from the organizer, so clear those to
        // force a fresh (never-seen) pair next game.
        const isCustom = config.difficulty === "custom";
        set({
          ...INITIAL_STATE,
          config: {
            ...config,
            civilWord: isCustom ? config.civilWord : "",
            undercoverWord: isCustom ? config.undercoverWord : "",
          },
          players: players.map((p, i) => ({
            id: p.id,
            name: p.name,
            order: i,
            role: "civil",
            specialRole: null,
            word: null,
            alive: true,
          })),
        });
      },
    }),
    {
      name: "undercover-game",
      partialize: (state) => ({
        players: state.players,
        config: state.config,
        phase: state.phase,
        round: state.round,
        revealIndex: state.revealIndex,
        eliminatedLog: state.eliminatedLog,
        pendingVengeanceId: state.pendingVengeanceId,
        pendingMrWhiteId: state.pendingMrWhiteId,
        winners: state.winners,
        firstSpeakerId: state.firstSpeakerId,
      }),
      // Migrate old persisted state missing timer fields
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<typeof current>),
        config: {
          ...DEFAULT_CONFIG,
          ...((persisted as Partial<typeof current>).config ?? {}),
        },
      }),
    }
  )
);
