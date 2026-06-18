"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors ${className}`}
      aria-label="Changer le thème"
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
