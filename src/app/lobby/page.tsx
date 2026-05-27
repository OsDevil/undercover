"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, ChevronLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Player } from "@/lib/types";
import { useGameStore } from "@/store/gameStore";

function SortablePlayer({ player, onRemove }: { player: Player; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] group"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-[var(--text-muted)] hover:text-white touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <span className="w-7 h-7 rounded-full bg-[var(--surface2)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
        {player.order + 1}
      </span>
      <span className="flex-1 font-medium">{player.name}</span>
      <button
        onClick={() => onRemove(player.id)}
        className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-1"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function LobbyPage() {
  const router = useRouter();
  const { players, addPlayer, removePlayer, reorderPlayers } = useGameStore();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sorted = [...players].sort((a, b) => a.order - b.order);

  function handleAdd() {
    const name = input.trim();
    if (!name) return;
    addPlayer(name);
    setInput("");
    inputRef.current?.focus();
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sorted.findIndex((p) => p.id === active.id);
    const newIdx = sorted.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(sorted, oldIdx, newIdx);
    reorderPlayers(reordered.map((p) => p.id));
  }

  const canContinue = players.length >= 3;

  return (
    <main className="flex flex-col min-h-dvh px-4 py-6 max-w-md mx-auto gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Joueurs</h1>
          <p className="text-xs text-[var(--text-muted)]">
            {players.length} joueur{players.length !== 1 ? "s" : ""} · min. 3
          </p>
        </div>
      </div>

      {/* Add player */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Pseudo du joueur…"
          className="flex-1 h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          autoCapitalize="words"
          autoComplete="off"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="h-12 w-12 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Player list */}
      {sorted.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {sorted.map((player) => (
                <SortablePlayer key={player.id} player={player} onRemove={removePlayer} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
          Aucun joueur — ajoutez au moins 3 personnes
        </div>
      )}

      <div className="mt-auto">
        <button
          onClick={() => router.push("/config")}
          disabled={!canContinue}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-violet-900/30"
        >
          Configurer la partie
          <ArrowRight className="w-5 h-5" />
        </button>
        {!canContinue && (
          <p className="text-center text-xs text-[var(--text-muted)] mt-2">
            Minimum 3 joueurs requis
          </p>
        )}
      </div>
    </main>
  );
}
