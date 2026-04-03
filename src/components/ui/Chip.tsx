"use client";

interface ChipProps {
  label: string;
  onRemove?: () => void;
  className?: string;
}

export function Chip({ label, onRemove, className = "" }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full ${className}`}
    >
      <span className="truncate max-w-[160px]">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-500/20 transition-colors"
          aria-label={`Remove ${label}`}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className="text-blue-400"
          >
            <path
              d="M2 2l6 6M8 2l-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

export type { ChipProps };
