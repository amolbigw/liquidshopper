"use client";

import { useIntentStore, createDefaultIntentVector } from "@/lib/intent/store";
import { ThemeToggle } from "./ThemeToggle";

interface NavBarProps {
  showInventory?: boolean;
  onToggleInventory?: () => void;
}

export function NavBar({ showInventory, onToggleInventory }: NavBarProps) {
  const updateIntent = useIntentStore((s) => s.updateIntent);

  const handleLogoClick = () => {
    const defaults = createDefaultIntentVector();
    updateIntent(defaults);
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/");
    }
  };

  return (
    <nav className="w-full max-w-[1440px] mx-auto px-4 py-3 flex items-center justify-between">
      <button
        onClick={handleLogoClick}
        className="flex items-center gap-3 group"
        aria-label="Go to homepage"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center group-hover:bg-blue-400 transition-colors">
          <span className="text-white font-black text-sm leading-none">A</span>
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm tracking-[0.2em] uppercase leading-none">
            AMOLW
          </span>
          <span className="text-white/40 text-[9px] tracking-[0.3em] uppercase leading-tight">
            Dealership
          </span>
        </div>
      </button>

      <div className="flex items-center gap-4 md:gap-6">
        <button
          onClick={onToggleInventory}
          className={`hidden md:inline text-xs tracking-wider uppercase cursor-pointer transition-colors ${
            showInventory ? "text-white font-semibold" : "text-white/40 hover:text-white/70"
          }`}
        >
          Inventory
        </button>
        <span className="hidden md:inline text-white/40 text-xs tracking-wider uppercase hover:text-white/70 cursor-pointer transition-colors">
          Finance
        </span>
        <span className="hidden md:inline text-white/40 text-xs tracking-wider uppercase hover:text-white/70 cursor-pointer transition-colors">
          About
        </span>
        <span className="hidden md:inline text-white/40 text-xs tracking-wider uppercase hover:text-white/70 cursor-pointer transition-colors">
          Contact
        </span>
        <ThemeToggle />
      </div>
    </nav>
  );
}
