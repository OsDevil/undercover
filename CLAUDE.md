@AGENTS.md

# Undercover

Réplique web du jeu Undercover, jouable sur téléphone. Déployé sur Vercel.

## Stack

- Next.js 16 App Router, TypeScript strict
- Tailwind CSS v4
- Zustand v5 (persist middleware — état survit les refreshs)
- Framer Motion (card flip, transitions de pages)
- @dnd-kit (réordonner joueurs en lobby)
- Lucide React (icônes)

## Structure

```
src/
  app/          # Routes: /, /lobby, /config, /reveal, /game, /result
  components/   # RoleCard, VoteGrid, MrWhiteGuess, VengeanceModal
  store/        # gameStore.ts — Zustand store global
  lib/          # types.ts, words.ts, gameLogic.ts, wordMatcher.ts, roleAssigner.ts
```

## Flux de jeu

`/ → /lobby → /config → /reveal → /game → /result`

## Rôles spéciaux (Caméléon)

Le mot du Caméléon est encodé `"civil|||undercover"` dans `player.word`.
`getWordDisplay()` dans `gameLogic.ts` le décode et mélange l'ordre.

## Standards

- Pas de DB — tout in-memory + localStorage
- `noUncheckedIndexedAccess: true` — toujours null-check les accès tableaux
- Biome pour lint/format (pas ESLint)
