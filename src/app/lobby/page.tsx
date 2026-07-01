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
import {
  Check,
  ChevronLeft,
  Clock,
  Dices,
  Flame,
  GripVertical,
  Heart,
  Layers,
  Mic,
  Minus,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAvatar } from "@/lib/gameLogic";
import { suggestRoleCounts } from "@/lib/roleAssigner";
import type { Difficulty, GameConfig, Player, SpecialRole } from "@/lib/types";
import { getRandomPair } from "@/lib/words";
import { useGameStore } from "@/store/gameStore";

// ─── Special role cards ─────────────────────────────────────────────────────

const SPECIAL_ROLES: Record<
  SpecialRole,
  { label: string; desc: string; icon: React.ElementType; color: string }
> = {
  jester: {
    label: "Jester",
    desc: "Doit se faire éliminer au Tour 1 pour gagner",
    icon: Dices,
    color: "#d97706",
  },
  chameleon: {
    label: "Caméléon",
    desc: "Voit les deux mots sans savoir lequel est le sien",
    icon: Layers,
    color: "#059669",
  },
  vengeuse: {
    label: "Vengeuse",
    desc: "Emporte quelqu'un avec elle si éliminée",
    icon: Flame,
    color: "#db2777",
  },
  amoureux: {
    label: "Amoureux",
    desc: "Deux joueurs liés — l'un meurt, l'autre aussi",
    icon: Heart,
    color: "#ea580c",
  },
};

// ─── Counter ────────────────────────────────────────────────────────────────

function Counter({
  label,
  color,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  color: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="font-medium text-sm text-[var(--text)]">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-lg bg-[var(--surface2)] flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all text-[var(--text)]"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-6 text-center font-black text-lg text-[var(--text)]">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-lg bg-[var(--surface2)] flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all text-[var(--text)]"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Sortable player row ─────────────────────────────────────────────────────

function SortablePlayer({ player, onRemove }: { player: Player; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-[var(--text-muted)] hover:text-[var(--text)] touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <span className="text-2xl leading-none">{getAvatar(player.order)}</span>
      <span className="flex-1 font-semibold text-[var(--text)]">{player.name}</span>
      <button
        onClick={() => onRemove(player.id)}
        className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
      {children}
    </h2>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();
  const { players, config, addPlayer, removePlayer, reorderPlayers, setConfig, startGame } =
    useGameStore();

  // ── Players ──────────────────────────────────────────────────────────────

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const initialPlayerCount = useRef(players.length);

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
    reorderPlayers(arrayMove(sorted, oldIdx, newIdx).map((p) => p.id));
  }

  // ── Role counts ───────────────────────────────────────────────────────────

  const [civilCount, setCivilCount] = useState(config.civilCount);
  const [undercoverCount, setUndercoverCount] = useState(config.undercoverCount);
  const [mrWhiteCount, setMrWhiteCount] = useState(config.mrWhiteCount);

  // Auto-suggest when player count changes, but skip initial render on rematch
  useEffect(() => {
    if (players.length === initialPlayerCount.current) return;
    const sug = suggestRoleCounts(players.length);
    setCivilCount(sug.civilCount);
    setUndercoverCount(sug.undercoverCount);
    setMrWhiteCount(sug.mrWhiteCount);
  }, [players.length]);

  const total = civilCount + undercoverCount + mrWhiteCount;
  const totalOk = total === players.length;

  // ── Words ─────────────────────────────────────────────────────────────────

  const [customMode, setCustomMode] = useState(config.difficulty === "custom");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    config.difficulty !== "custom" ? (config.difficulty as Difficulty) : "easy"
  );
  const [civilWord, setCivilWord] = useState(config.civilWord || "");
  const [undercoverWord, setUndercoverWord] = useState(config.undercoverWord || "");
  const [wordsRolled, setWordsRolled] = useState(
    !!config.civilWord && config.difficulty !== "custom"
  );

  const DIFF_OPTIONS: { value: Difficulty; label: string }[] = [
    { value: "easy", label: "Facile" },
    { value: "medium", label: "Moyen" },
    { value: "hard", label: "Difficile" },
  ];

  function rollWords(diff?: typeof difficulty) {
    const pair = getRandomPair(diff ?? difficulty);
    setCivilWord(pair.civil);
    setUndercoverWord(pair.undercover);
    setWordsRolled(true);
  }

  const wordsReady = customMode
    ? civilWord.trim().length > 0 && undercoverWord.trim().length > 0
    : wordsRolled;

  // ── Special roles ─────────────────────────────────────────────────────────

  const [specialRoles, setSpecialRoles] = useState<Partial<Record<SpecialRole, boolean>>>(
    config.specialRoles || {}
  );

  function toggleSpecial(role: SpecialRole) {
    setSpecialRoles((prev) => ({ ...prev, [role]: !prev[role] }));
  }

  // ── Timer ─────────────────────────────────────────────────────────────────

  const [timerEnabled, setTimerEnabled] = useState(config.timerEnabled ?? false);
  const [timerDuration, setTimerDuration] = useState(config.timerDuration ?? 30);
  const [mrWhiteCanStart, setMrWhiteCanStart] = useState(config.mrWhiteCanStart ?? false);

  // ── Derived ───────────────────────────────────────────────────────────────

  const canStart = players.length >= 3 && totalOk && wordsReady;
  const showConfig = players.length >= 3;

  function handleStart() {
    const cfg: GameConfig = {
      civilCount,
      undercoverCount,
      mrWhiteCount,
      specialRoles,
      difficulty: customMode ? "custom" : difficulty,
      civilWord: customMode ? civilWord.trim() : civilWord,
      undercoverWord: customMode ? undercoverWord.trim() : undercoverWord,
      timerEnabled,
      timerDuration,
      mrWhiteCanStart,
    };
    setConfig(cfg);
    startGame();
    router.push("/reveal");
  }

  return (
    <main className="flex flex-col min-h-dvh max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-[var(--text)]">Nouvelle partie</h1>
            <p className="text-xs text-[var(--text-muted)]">
              {players.length} joueur{players.length !== 1 ? "s" : ""}
              {players.length < 3 && " · min. 3"}
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col px-4 pb-6 gap-6 overflow-y-auto">
        {/* ── Players section ── */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Joueurs</SectionTitle>

          {/* Add player */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Pseudo du joueur…"
              className="flex-1 h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sorted.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-1.5">
                  {sorted.map((player) => (
                    <SortablePlayer key={player.id} player={player} onRemove={removePlayer} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="py-8 text-center text-[var(--text-muted)] text-sm">
              Ajoutez au moins 3 joueurs pour commencer
            </div>
          )}
        </section>

        {/* ── Game config (locked until 3+ players, but reserves its layout) ── */}
        <div className="relative">
          {!showConfig && (
            <div className="absolute inset-x-0 top-8 z-10 flex justify-center pointer-events-none">
              <span className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] shadow-sm text-center">
                Ajoute 3 joueurs pour configurer la partie
              </span>
            </div>
          )}
          <div
            className={`flex flex-col gap-6 transition-opacity ${
              showConfig ? "" : "opacity-40 pointer-events-none select-none"
            }`}
            aria-hidden={!showConfig}
          >
            {/* Role distribution */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>Répartition des rôles</SectionTitle>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    totalOk ? "text-emerald-600 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                  }`}
                >
                  {total} / {players.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <Counter
                  label="Civils"
                  color="var(--civil)"
                  value={civilCount}
                  min={1}
                  max={players.length - undercoverCount - mrWhiteCount}
                  onChange={setCivilCount}
                />
                <Counter
                  label="Undercovers"
                  color="var(--undercover)"
                  value={undercoverCount}
                  min={1}
                  max={players.length - civilCount - mrWhiteCount}
                  onChange={setUndercoverCount}
                />
                <Counter
                  label="Mr. White"
                  color="var(--mr-white)"
                  value={mrWhiteCount}
                  min={0}
                  max={players.length - civilCount - undercoverCount}
                  onChange={setMrWhiteCount}
                />
              </div>
              {!totalOk && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  Le total doit être égal au nombre de joueurs
                </p>
              )}
            </section>

            {/* Words */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>Mots secrets</SectionTitle>
                <button
                  onClick={() => {
                    setCustomMode((v) => !v);
                    setCivilWord("");
                    setUndercoverWord("");
                    setWordsRolled(false);
                  }}
                  className="flex items-center gap-1 text-xs text-[var(--accent)] font-semibold"
                >
                  <Pencil className="w-3 h-3" />
                  {customMode ? "Aléatoire" : "Personnalisé"}
                </button>
              </div>

              {customMode ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={civilWord}
                    onChange={(e) => setCivilWord(e.target.value)}
                    placeholder="Mot des Civils"
                    className="h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <input
                    value={undercoverWord}
                    onChange={(e) => setUndercoverWord(e.target.value)}
                    placeholder="Mot des Undercovers"
                    className="h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <p className="text-xs text-[var(--text-muted)] text-center">
                    Choisissez deux mots proches mais distincts
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div className="flex gap-2">
                    {DIFF_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setDifficulty(opt.value);
                          rollWords(opt.value);
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          difficulty === opt.value
                            ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                            : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Show confirmation + re-roll only — never reveal the words */}
                  {wordsRolled ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-emerald-600 flex-1">
                        Mots prêts — personne ne les a vus
                      </span>
                      <button
                        onClick={() => rollWords()}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                        title="Re-tirer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] text-center py-1">
                      Sélectionne une difficulté pour tirer les mots
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Special roles */}
            <section>
              <SectionTitle>Rôles spéciaux</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(SPECIAL_ROLES) as SpecialRole[]).map((role) => {
                  const info = SPECIAL_ROLES[role];
                  const active = !!specialRoles[role];
                  const Icon = info.icon;
                  return (
                    <button
                      key={role}
                      onClick={() => toggleSpecial(role)}
                      className="p-3 rounded-xl border text-left transition-all active:scale-95"
                      style={
                        active
                          ? {
                              borderColor: `${info.color}55`,
                              backgroundColor: `${info.color}12`,
                            }
                          : {
                              borderColor: "var(--border)",
                              backgroundColor: "var(--surface)",
                            }
                      }
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: active ? `${info.color}25` : "var(--surface2)",
                          }}
                        >
                          <Icon
                            className="w-3.5 h-3.5"
                            style={{ color: active ? info.color : "var(--text-muted)" }}
                          />
                        </div>
                        <span className="font-bold text-sm text-[var(--text)]">{info.label}</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-tight">{info.desc}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* First speaker — only relevant when Mr. White is in play */}
            {mrWhiteCount > 0 && (
              <section>
                <SectionTitle>Premier de parole</SectionTitle>
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex items-center gap-2.5">
                    <Mic className="w-4 h-4 text-[var(--text-muted)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">
                        Mr. White peut commencer
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {mrWhiteCanStart
                          ? "Tirage parmi tous les joueurs"
                          : "Mr. White exclu du tirage"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMrWhiteCanStart((v) => !v)}
                    className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                      mrWhiteCanStart ? "bg-[var(--accent)]" : "bg-[var(--surface2)]"
                    }`}
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                      style={{ left: mrWhiteCanStart ? "calc(100% - 1.375rem)" : "2px" }}
                    />
                  </button>
                </div>
              </section>
            )}

            {/* Timer */}
            <section>
              <SectionTitle>Minuteur de tour</SectionTitle>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">Chrono par joueur</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {timerEnabled ? `${timerDuration}s par tour de parole` : "Désactivé"}
                      </p>
                    </div>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={() => setTimerEnabled((v) => !v)}
                    className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                      timerEnabled ? "bg-[var(--accent)]" : "bg-[var(--surface2)]"
                    }`}
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                      style={{ left: timerEnabled ? "calc(100% - 1.375rem)" : "2px" }}
                    />
                  </button>
                </div>

                {timerEnabled && (
                  <div className="flex gap-2">
                    {[15, 30, 45, 60].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setTimerDuration(sec)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          timerDuration === sec
                            ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                            : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]"
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* ── Launch ── */}
        <div className="mt-auto pt-2">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-violet-500/25"
          >
            <Play className="w-5 h-5" />
            Lancer la partie
          </button>
          {players.length < 3 && (
            <p className="text-center text-xs text-[var(--text-muted)] mt-2">
              Minimum 3 joueurs requis
            </p>
          )}
          {players.length >= 3 && !wordsReady && (
            <p className="text-center text-xs text-[var(--text-muted)] mt-2">
              Tirez des mots au sort ou saisissez-les manuellement
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
