"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useTimeChartZoom } from "./use-time-chart-zoom";

const formatDateInputValue = (timestamp: number | null | undefined) => {
  if (!Number.isFinite(timestamp ?? Number.NaN)) {
    return "";
  }

  const date = new Date(timestamp!);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateInputStart = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const parseDateInputEnd = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const timestamp = new Date(`${value}T23:59:59.999`).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

export function ZoomableTimeChartFrame({
  values,
  className,
  minimumVisibleSpanMs,
  children,
}: {
  values: number[];
  className?: string;
  minimumVisibleSpanMs?: number;
  children: (domain: readonly [number, number] | null) => React.ReactNode;
}) {
  const {
    dataDomain,
    domain,
    isZoomed,
    canZoomIn,
    canZoomOut,
    zoomIn,
    zoomOut,
    panLeft,
    panRight,
    resetZoom,
    setDateRange,
    interactionProps,
  } = useTimeChartZoom(values, { minimumVisibleSpanMs });
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");

  React.useEffect(() => {
    if (!domain) {
      setFromDate("");
      setToDate("");
      return;
    }

    setFromDate(formatDateInputValue(domain[0]));
    setToDate(formatDateInputValue(domain[1]));
  }, [domain?.[0], domain?.[1]]);

  const handleApplyDateRange = React.useCallback(() => {
    const nextStart = parseDateInputStart(fromDate);
    const nextEnd = parseDateInputEnd(toDate);

    if (nextStart !== null && nextEnd !== null && nextStart > nextEnd) {
      return;
    }

    setDateRange(nextStart, nextEnd);
  }, [fromDate, setDateRange, toDate]);

  const hasInvalidDateRange = React.useMemo(() => {
    const nextStart = parseDateInputStart(fromDate);
    const nextEnd = parseDateInputEnd(toDate);
    return nextStart !== null && nextEnd !== null && nextStart > nextEnd;
  }, [fromDate, toDate]);
  const controlButtonClassName =
    "h-8 border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black";
  const resetButtonClassName =
    "h-8 border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black";
  const mobileRangeControlWidthClass =
    "mx-auto w-full max-w-[18rem] sm:mx-0 sm:max-w-none";

  return (
    <div className={cn("mt-4 flex min-w-0 flex-col gap-3", className)}>
      <div className="flex flex-col gap-3">
        <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,10rem)_minmax(0,10rem)_auto] sm:items-end">
          <div className={cn("flex min-w-0 flex-col gap-1", mobileRangeControlWidthClass)}>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              From
            </span>
            <Input
              type="date"
              value={fromDate}
              min={formatDateInputValue(dataDomain?.[0])}
              max={formatDateInputValue(dataDomain?.[1])}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-8 w-full sm:w-fit overflow-hidden"
            />
          </div>
          <div className={cn("flex min-w-0 flex-col gap-1", mobileRangeControlWidthClass)}>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              To
            </span>
            <Input
              type="date"
              value={toDate}
              min={formatDateInputValue(dataDomain?.[0])}
              max={formatDateInputValue(dataDomain?.[1])}
              onChange={(event) => setToDate(event.target.value)}
              className="h-8 w-full sm:w-fit overflow-hidden"
            />
          </div>
          <div
            className={cn(
              "flex min-w-0 flex-col gap-1 sm:w-auto sm:min-w-fit",
              mobileRangeControlWidthClass,
            )}
          >
            <span className="sr-only">Apply range</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleApplyDateRange}
              disabled={hasInvalidDateRange}
              className={cn(controlButtonClassName, "h-8 w-full sm:w-fit")}
            >
              Apply Range
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 sm:flex-wrap sm:justify-start">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={panLeft}
            disabled={!isZoomed}
            className={controlButtonClassName}
            aria-label="Pan left"
          >
            <ChevronLeft className="!h-[16px] !w-[16px]" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={zoomOut}
            disabled={!canZoomOut}
            className={controlButtonClassName}
            aria-label="Zoom out"
          >
            <ZoomOut className="!h-[16px] !w-[16px]" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              resetZoom();
              if (domain) {
                setFromDate(formatDateInputValue(domain[0]));
                setToDate(formatDateInputValue(domain[1]));
              }
            }}
            disabled={!isZoomed}
            className={resetButtonClassName}
            aria-label="Reset zoom"
          >
            <RotateCcw className="!h-[16px] !w-[16px]" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={zoomIn}
            disabled={!canZoomIn}
            className={controlButtonClassName}
            aria-label="Zoom in"
          >
            <ZoomIn className="!h-[16px] !w-[16px]" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={panRight}
            disabled={!isZoomed}
            className={controlButtonClassName}
            aria-label="Pan right"
          >
            <ChevronRight className="!h-[16px] !w-[16px]" />
          </Button>
        </div>
      </div>
      {hasInvalidDateRange ? (
        <div className="text-xs text-destructive">
          Start date must be before end date.
        </div>
      ) : null}
      <div className="min-w-0" {...interactionProps}>
        {children(domain)}
      </div>
    </div>
  );
}
