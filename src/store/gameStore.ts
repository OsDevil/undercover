"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { checkVictory, getLoverPartner, shouldTriggerMrWhiteGuess } from "@/lib/gameLogic";
import { assignRoles } from "@/lib/roleAssigner";
import type { GameConfig, GameState, Player, WinResult } from "@/lib/types";

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
        });
      },

      advanceReveal: () => {
        const { revealIndex, players } = get();
        const sorted = [...players].sort((a, b) => a.order - b.order);
        if (revealIndex + 1 >= sorted.length) {
          set({ phase: "playing" });
        } else {
          set({ revealIndex: revealIndex + 1 });
        }
      },

      setPhase: (phase) => set({ phase }),

      eliminatePlayer: (playerId) => {
        const { players, eliminatedLog, round } = get();
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
        const jesterWin = round === 1 && target.specialRole === "jester";
        if (jesterWin) {
          const result: WinResult = {
            team: "jester",
            winnerIds: [playerId],
            reason: `${target.name} était le Jester et a été éliminé au Tour 1 !`,
          };
          set({ players: updatedPlayers, eliminatedLog: newLog, winners: result, phase: "result" });
          return;
        }

        // Check vengeuse
        const hasPendingVengeance = target.specialRole === "vengeuse";

        // Check Mr. White guess trigger
        const mrWhiteId = shouldTriggerMrWhiteGuess(updatedPlayers);

        // Check victory
        const victory = checkVictory(updatedPlayers, newLog, round);

        if (hasPendingVengeance) {
          set({
            players: updatedPlayers,
            eliminatedLog: newLog,
            pendingVengeanceId: playerId,
            phase: "vengeance",
          });
          return;
        }

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
          phase: "playing",
          round: round + 1,
        });
      },

      resolveVengeance: (targetId) => {
        const { players, eliminatedLog, round } = get();
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
          phase: "playing",
          round: round + 1,
        });
      },

      resolveMrWhiteGuess: (won) => {
        const { players, round: _round, pendingMrWhiteId } = get();
        const mrWhite = players.find((p) => p.id === pendingMrWhiteId);

        if (won && mrWhite) {
          const result: WinResult = {
            team: "mr_white",
            winnerIds: [mrWhite.id],
            reason: `${mrWhite.name} (Mr. White) a trouvé le bon mot et remporte la partie !`,
          };
          set({ winners: result, phase: "result", pendingMrWhiteId: null });
          return;
        }

        // Mr. White lost the guess → Civils win
        const aliveCivils = players.filter((p) => p.alive && p.role === "civil");
        const civilWin: WinResult = {
          team: "civil",
          winnerIds: aliveCivils.map((p) => p.id),
          reason: `${mrWhite?.name ?? "Mr. White"} n'a pas trouvé le mot. Les Civils gagnent !`,
        };
        set({ winners: civilWin, phase: "result", pendingMrWhiteId: null });
      },

      reset: () => set(INITIAL_STATE),

      resetToLobby: () =>
        set({
          ...INITIAL_STATE,
          players: get().players.map((p, i) => ({
            id: p.id,
            name: p.name,
            order: i,
            role: "civil",
            specialRole: null,
            word: null,
            alive: true,
          })),
        }),
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
      }),
    }
  )
);
