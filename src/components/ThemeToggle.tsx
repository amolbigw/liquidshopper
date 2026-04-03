"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("ls_theme");
    if (saved === "light") {
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("ls_theme", next);
  };

  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-full hover:bg-white/5 dark:hover:bg-white/5 transition-colors"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        /* Sun icon */
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-white/30 hover:text-white/60 transition-colors">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        /* Moon icon */
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-black/30 hover:text-black/60 transition-colors">
          <path d="M13.5 8.5a5.5 5.5 0 01-6-6 5.5 5.5 0 106 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
