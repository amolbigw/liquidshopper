"use client";

import { motion } from "framer-motion";
import type { BlockManifest } from "@/lib/layout/types";

interface GridBlockProps {
  manifest: BlockManifest;
  isMobile: boolean;
  children: React.ReactNode;
}

/** Compute stagger delay based on priority tier (spec section 9.2). */
function staggerDelay(priority: number): number {
  if (priority >= 9) return 0;
  if (priority >= 7) return 0.06;
  if (priority >= 5) return 0.12;
  return 0.18;
}

export function GridBlock({ manifest, isMobile, children }: GridBlockProps) {
  const delay = staggerDelay(manifest.priority);

  if (isMobile) {
    return (
      <motion.div
        key={manifest.block_id}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          opacity: { duration: 0.3, delay },
          y: { duration: 0.3, delay },
          layout: { duration: 0.35 },
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      key={manifest.block_id}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 0.3, delay },
        layout: { duration: 0.35 },
      }}
      style={{
        gridColumn: manifest.grid_position.col,
        gridRow: manifest.grid_position.row,
      }}
      className="min-w-0 min-h-0"
    >
      {children}
    </motion.div>
  );
}
