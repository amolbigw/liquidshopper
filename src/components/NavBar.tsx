"use client";

import { useIntentStore } from "@/lib/intent/store";
import { createDefaultIntentVector } from "@/lib/intent/store";

export function NavBar() {
  const updateIntent = useIntentStore((s) => s.updateIntent);

  const handleLogoClick = () => {
    // Reset to Discovery state (homepage)
    const defaults = createDefaultIntentVector();
    updateIntent(defaults);

    // Clear URL params
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  return (
    <nav className="w-full max-w-[1440px] mx-auto px-4 py-3 flex items-center justify-between">
      <button
        onClick={handleLogoClick}
        className="flex items-center gap-3 group"
        aria-label="Go to homepage"
      >
        {/* Logo mark */}
        <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center group-hover:bg-blue-400 transition-colors">
          <span className="text-white font-black text-sm leading-none">A</span>
        </div>
        {/* Wordmark */}
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm tracking-[0.2em] uppercase leading-none">
            AMOLW
          </span>
          <span className="text-white/40 text-[9px] tracking-[0.3em] uppercase leading-tight">
            Dealership
          </span>
        </div>
      </button>

      {/* Right side — minimal nav links */}
      <div className="hidden md:flex items-center gap-6">
        <span className="text-white/40 text-xs tracking-wider uppercase hover:text-white/70 cursor-pointer transition-colors">
          Inventory
        </span>
        <span className="text-white/40 text-xs tracking-wider uppercase hover:text-white/70 cursor-pointer transition-colors">
          Finance
        </span>
        <span className="text-white/40 text-xs tracking-wider uppercase hover:text-white/70 cursor-pointer transition-colors">
          About
        </span>
        <span className="text-white/40 text-xs tracking-wider uppercase hover:text-white/70 cursor-pointer transition-colors">
          Contact
        </span>
      </div>
    </nav>
  );
}
