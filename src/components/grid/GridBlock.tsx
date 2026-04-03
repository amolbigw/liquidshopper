"use client";

import { useEffect, useState } from "react";
import type { BlockManifest } from "@/lib/layout/types";

interface GridBlockProps {
  manifest: BlockManifest;
  isMobile: boolean;
  animated: boolean;
  children: React.ReactNode;
}

/** Compute stagger delay based on priority tier (spec section 9.2). */
function staggerDelay(priority: number): number {
  if (priority >= 9) return 0;
  if (priority >= 7) return 60;
  if (priority >= 5) return 120;
  return 180;
}

export function GridBlock({ manifest, isMobile, animated, children }: GridBlockProps) {
  const [visible, setVisible] = useState(!animated);
  const delay = staggerDelay(manifest.priority);

  useEffect(() => {
    if (!animated) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [animated, delay]);

  if (isMobile) {
    return (
      <div
        className="w-full transition-all duration-300 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
        }}
      >
        {children}
      </div>
    );
  }

  // Intent bar needs overflow-visible for the search dropdown to escape the grid cell
  const isIntentBar = manifest.block_type === "intent";

  return (
    <div
      className={`min-w-0 min-h-0 transition-opacity duration-300 ease-out ${isIntentBar ? "overflow-visible z-30" : "overflow-hidden"}`}
      style={{
        gridColumn: manifest.grid_position.col,
        gridRow: manifest.grid_position.row,
        opacity: visible ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
}
