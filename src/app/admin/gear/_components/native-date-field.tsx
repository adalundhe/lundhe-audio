"use client";

import * as React from "react";

import { cn } from "~/lib/utils";

const formatDisplayDate = (value: string) => {
  if (!value.trim()) {
    return "";
  }

  const timestamp = new Date(`${value}T12:00:00`).getTime();
  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
};

export function NativeDateField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const displayValue = formatDisplayDate(value);

  const handleOpenPicker = React.useCallback(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    try {
      if ("showPicker" in input && typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // Fall through to focus/click.
    }

    input.focus();
    input.click();
  }, []);

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpenPicker();
          }
        }}
        className="relative flex h-8 w-full min-w-0 items-center overflow-hidden rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span
          className={cn(
            "block min-w-0 flex-1 truncate text-center",
            !displayValue && "text-muted-foreground",
          )}
        >
          {displayValue || "Select date"}
        </span>
        <input
          ref={inputRef}
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(event.target.value)}
          className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
        />
      </div>
    </div>
  );
}
