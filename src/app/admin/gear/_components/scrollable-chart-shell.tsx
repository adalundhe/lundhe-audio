"use client";

import * as React from "react";

import { cn } from "~/lib/utils";

export function ScrollableChartShell({
  width,
  className,
  children,
}: React.PropsWithChildren<{
  width: number;
  className?: string;
}>) {
  return (
    <div
      className={cn("mt-4 overflow-x-auto overflow-y-hidden pb-2", className)}
      style={{
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorX: "contain",
        touchAction: "pan-x pinch-zoom",
      }}
    >
      <div className="min-w-full pr-4" style={{ width }}>
        {children}
      </div>
    </div>
  );
}
