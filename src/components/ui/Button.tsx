"use client";

import type { ButtonHTMLAttributes, Ref } from "react";

type ButtonVariant = "primary" | "secondary" | "text";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  ref?: Ref<HTMLButtonElement>;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-500 text-white uppercase tracking-wider font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors",
  secondary:
    "bg-transparent border border-white/20 text-white uppercase tracking-wider font-semibold hover:border-white/40 hover:bg-white/5 active:bg-white/10 transition-colors",
  text: "bg-transparent text-white/70 hover:text-white transition-colors",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-xs rounded-sm",
  md: "px-6 py-2.5 text-sm rounded-sm",
  lg: "px-8 py-3.5 text-base rounded-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:opacity-40 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export type { ButtonProps, ButtonVariant, ButtonSize };
