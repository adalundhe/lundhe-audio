"use client";

import * as React from "react";

import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "~/lib/utils";

export function AdminCheckboxRow({
  checked,
  label,
  onToggle,
  className,
}: {
  checked: boolean;
  label: React.ReactNode;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Checkbox checked={checked} className="pointer-events-none" />
    </div>
  );
}
