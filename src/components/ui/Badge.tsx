"use client";

type BadgeVariant = "savings" | "new" | "cpo" | "price-drop";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  savings: "bg-green-500/20 text-green-400 border-green-500/30",
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  cpo: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "price-drop": "bg-red-500/20 text-red-400 border-red-500/30",
};

export function Badge({ variant, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export type { BadgeProps, BadgeVariant };
